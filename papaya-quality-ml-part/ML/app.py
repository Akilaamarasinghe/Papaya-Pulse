from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pandas as pd
import joblib
import json
from PIL import Image
import io
import warnings
warnings.filterwarnings('ignore')

app = Flask(__name__)
CORS(app)

try:
    model = joblib.load('models/papaya_grade_model.pkl')
    label_encoder = joblib.load('models/label_encoder.pkl')
    with open('models/model_metadata.json', 'r') as f:
        metadata = json.load(f)
except FileNotFoundError as e:
    print(f"Error loading model files: {e}")
    model = None
    label_encoder = None
    metadata = None

def get_dominant_color(image_file):
    try:
        img = Image.open(image_file)
        img = img.convert('RGB')
        img = img.resize((150, 150))
        pixels = np.array(img).reshape(-1, 3)
        
        center_y, center_x = 75, 75
        radius = 50
        center_pixels = []
        for y in range(max(0, center_y - radius), min(150, center_y + radius)):
            for x in range(max(0, center_x - radius), min(150, center_x + radius)):
                if (x - center_x)**2 + (y - center_y)**2 <= radius**2:
                    center_pixels.append(img.getpixel((x, y)))
        
        if center_pixels:
            pixels = np.array(center_pixels)
        
        non_extreme = pixels[
            (pixels[:, 0] > 10) & (pixels[:, 0] < 245) &
            (pixels[:, 1] > 10) & (pixels[:, 1] < 245) &
            (pixels[:, 2] > 10) & (pixels[:, 2] < 245)
        ]
        
        if len(non_extreme) > 0:
            pixels = non_extreme
        
        avg_color = np.median(pixels, axis=0).astype(int)
        
        hex_color = '#{:02X}{:02X}{:02X}'.format(avg_color[0], avg_color[1], avg_color[2])
        return hex_color
    except Exception as e:
        raise ValueError(f"Error processing image: {str(e)}")

def hex_to_rgb(hex_color):
    hex_color = str(hex_color).lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def get_shap_explanation(input_features, prediction_idx, predicted_class):
    try:
        import shap
        feature_names = ['district', 'variety', 'maturity', 'days_since_plucked', 'R', 'G', 'B']
        
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(input_features)
        
        if isinstance(shap_values, list):
            num_classes = len(shap_values)
            if prediction_idx >= num_classes:
                prediction_idx = 0
            shap_values_for_pred = np.array(shap_values[prediction_idx]).flatten()
        else:
            if len(shap_values.shape) == 3:
                shap_values_for_pred = shap_values[0, :, prediction_idx]
            else:
                shap_values_for_pred = shap_values[0]
        
        base_value = explainer.expected_value
        if isinstance(base_value, (list, np.ndarray)):
            base_value = float(base_value[prediction_idx]) if len(base_value) > prediction_idx else float(base_value[0])
        else:
            base_value = float(base_value)
        
        feature_contributions = []
        for i, feature_name in enumerate(feature_names):
            contribution = float(shap_values_for_pred[i])
            feature_value = float(input_features[0][i])
            feature_contributions.append({
                'feature': feature_name,
                'value': feature_value,
                'contribution': contribution,
                'abs_contribution': abs(contribution)
            })
        
        feature_contributions.sort(key=lambda x: x['abs_contribution'], reverse=True)
        
        top_features = feature_contributions[:3]
        
        explanation_text = f"The model predicted Grade {predicted_class} based on these key factors: "
        
        for i, feat in enumerate(top_features, 1):
            impact = "increases" if feat['contribution'] > 0 else "decreases"
            explanation_text += f"{i}. {feat['feature'].replace('_', ' ').title()} (value: {feat['value']:.2f}) {impact} the likelihood of this grade (impact: {feat['contribution']:.4f}). "
        
        return {
            'base_value': base_value,
            'feature_contributions': feature_contributions,
            'top_features': top_features,
            'explanation': explanation_text
        }
    except ImportError:
        return {
            'base_value': 0,
            'feature_contributions': [],
            'top_features': [],
            'explanation': 'SHAP explanations not available. Install shap package for detailed explanations.'
        }
    except Exception as e:
        return {
            'base_value': 0,
            'feature_contributions': [],
            'top_features': [],
            'explanation': f'Explanation generation failed: {str(e)}'
        }

@app.route('/predict', methods=['POST'])
def predict():
    if model is None or label_encoder is None:
        return jsonify({'error': 'Model not loaded. Please run train.py first.'}), 500
    
    try:
        data_json = request.form.get('data')
        if not data_json:
            return jsonify({'error': 'Missing data field'}), 400
        
        data = json.loads(data_json)
        
        required_fields = ['district', 'variety', 'maturity', 'days_since_plucked']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        if 'file' not in request.files:
            return jsonify({'error': 'Image file is required'}), 400
        
        image_file = request.files['file']
        if image_file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        hex_color = get_dominant_color(image_file)
        
        district = int(data['district'])
        variety = int(data['variety'])
        maturity = int(data['maturity'])
        days_since_plucked = int(data['days_since_plucked'])
        
        r, g, b = hex_to_rgb(hex_color)
        
        input_features = pd.DataFrame([[district, variety, maturity, days_since_plucked, r, g, b]], 
                                      columns=metadata['feature_names'])
        
        prediction = model.predict(input_features)
        prediction_proba = model.predict_proba(input_features)
        
        predicted_grade = str(label_encoder.inverse_transform(prediction)[0])
        confidence = float(prediction_proba[0][prediction[0]])
        
        all_probabilities = {}
        for i, grade in enumerate(label_encoder.classes_):
            all_probabilities[str(grade)] = float(prediction_proba[0][i])
        
        input_features_array = input_features.values
        shap_explanation = get_shap_explanation(input_features_array, prediction[0], predicted_grade)
        
        response = {
            'predicted_grade': predicted_grade,
            'confidence': confidence,
            'all_probabilities': all_probabilities,
            'extracted_color': hex_color,
            'explanation': shap_explanation
        }
        
        return jsonify(response), 200
        
    except json.JSONDecodeError:
        return jsonify({'error': 'Invalid JSON in data field'}), 400
    except ValueError as e:
        return jsonify({'error': f'Invalid data type: {str(e)}'}), 400
    except Exception as e:
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

@app.route('/health', methods=['GET'])
def health():
    status = {
        'status': 'healthy' if model is not None else 'unhealthy',
        'model_loaded': model is not None,
        'label_encoder_loaded': label_encoder is not None,
        'metadata_loaded': metadata is not None
    }
    return jsonify(status), 200 if model is not None else 503

@app.route('/model-info', methods=['GET'])
def model_info():
    if metadata is None:
        return jsonify({'error': 'Model metadata not loaded'}), 500
    return jsonify(metadata), 200

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)