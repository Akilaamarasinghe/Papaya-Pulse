from flask import Flask, request, jsonify
import numpy as np
import pandas as pd
import joblib
import cv2
import shap
import os

from PIL import Image
from app_image import predict_pipeline
from suggetion_maker import generate_final_suggestion
from weather_pipeline import geocode_district, fetch_past_weather
from datetime import datetime, timedelta

app = Flask(__name__)

MODEL_DIR = "models_for_customers"

FEATURES = joblib.load(f"{MODEL_DIR}/features.pkl")

MODELS = {
    "ripeness": joblib.load(f"{MODEL_DIR}/ripeness_stage_model.pkl"),
    "taste": joblib.load(f"{MODEL_DIR}/taste_model.pkl"),
    "quality": joblib.load(f"{MODEL_DIR}/quality_grade_model.pkl"),
    "buy": joblib.load(f"{MODEL_DIR}/buying_recommendation_model.pkl")
}

ENCODERS = {
    "ripeness": joblib.load(f"{MODEL_DIR}/ripeness_stage_encoder.pkl"),
    "taste": joblib.load(f"{MODEL_DIR}/taste_encoder.pkl"),
    "quality": joblib.load(f"{MODEL_DIR}/quality_grade_encoder.pkl"),
    "buy": joblib.load(f"{MODEL_DIR}/buying_recommendation_encoder.pkl")
}


def extract_color_ratios(image):
    img = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)
    img = cv2.resize(img, (224, 224))
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    h, s, v = cv2.split(hsv)

    green_mask = ((h >= 35) & (h <= 85))
    yellow_mask = ((h >= 20) & (h < 35))
    orange_mask = ((h >= 10) & (h < 20))

    total = hsv.shape[0] * hsv.shape[1]

    green_ratio = green_mask.sum() / total
    yellow_ratio = yellow_mask.sum() / total
    orange_ratio = orange_mask.sum() / total

    norm = green_ratio + yellow_ratio + orange_ratio
    return (
        round(green_ratio / norm, 3),
        round(yellow_ratio / norm, 3),
        round(orange_ratio / norm, 3)
    )


def get_last_7_days_weather(city):
    lat, lon = geocode_district(city)
    end = datetime.utcnow().date()
    start = end - timedelta(days=7)

    df = fetch_past_weather(lat, lon, start, end)

    return {
        "avg_temp": round(df["temp"].mean(), 2),
        "max_temp": round(df["temp"].max(), 2),
        "min_temp": round(df["temp"].min(), 2)
    }


def shap_explanation(model, X, feature_names):
    if hasattr(model, "named_steps"):
        final_model = model.named_steps[list(model.named_steps.keys())[-1]]
        X_used = model[:-1].transform(X) if hasattr(model[:-1], "transform") else X
    else:
        final_model = model
        X_used = X

    model_name = final_model.__class__.__name__

    try:
        if model_name in ["RandomForestClassifier", "XGBClassifier"]:
            explainer = shap.TreeExplainer(final_model)
            shap_values = explainer.shap_values(X_used)

            if isinstance(shap_values, list):
                shap_vals = shap_values[0][0]
            else:
                shap_vals = shap_values[0]

            base_value = (
                np.mean(explainer.expected_value)
                if isinstance(explainer.expected_value, (list, np.ndarray))
                else explainer.expected_value
            )

        else:
            explainer = shap.Explainer(final_model.predict_proba, X_used)
            shap_values = explainer(X_used)

            shap_vals = shap_values.values[0]
            base_value = float(np.mean(shap_values.base_values))

        impacts = {}
        for i, fname in enumerate(feature_names):
            val = shap_vals[i]
            impact = float(np.mean(val)) if isinstance(val, np.ndarray) else float(val)
            impacts[fname] = impact

        sorted_impacts = sorted(
            impacts.items(),
            key=lambda x: abs(x[1]),
            reverse=True
        )

        return {
            "base_value": round(float(base_value), 4),
            "top_factors": [
                {
                    "feature": k,
                    "impact": round(v, 4),
                    "direction": "increased" if v > 0 else "reduced"
                }
                for k, v in sorted_impacts[:5]
            ]
        }

    except Exception as e:
        return {
            "note": f"XAI not available for model type: {model_name}",
            "reason": str(e)
        }



@app.route("/predict-customer-recomandations", methods=["POST"])
def predict_customer_recomandations():
    if "image" not in request.files or "city" not in request.form:
        return jsonify({"error": "city and image are required"}), 400

    city = request.form["city"]

    image = Image.open(request.files["image"]).convert("RGB")
    papaya_result = predict_pipeline(image)
    print(papaya_result)

    if not papaya_result["is_papaya"]:
        return jsonify({"error": "Not a papaya", "not_papaya_prob": papaya_result["not_papaya_prob"]}), 400

    green, yellow, orange = extract_color_ratios(image)
    
    weather = get_last_7_days_weather(city)

    X = pd.DataFrame([[
        green,
        yellow,
        orange,
        weather["avg_temp"],
        weather["max_temp"],
        weather["min_temp"]
    ]], columns=FEATURES)

    outputs = {}
    xai = {}

    for key in MODELS:
        model = MODELS[key]
        enc = ENCODERS[key]

        pred = model.predict(X)[0]
        label = enc.inverse_transform([pred])[0]
        outputs[key] = label

        xai[key] = shap_explanation(model, X, FEATURES)

    suggestion = generate_final_suggestion(
    color_ratios={
        "green": green,
        "yellow": yellow,
        "orange": orange
    },
    weather_last_7_days=weather,
    predictions={
        "ripeness_stage": outputs["ripeness"],
        "taste": outputs["taste"],
        "quality_grade": outputs["quality"],
        "buying_recommendation": outputs["buy"]
    },
    xai_explanations=xai,
    temperature_for_taste=(
        0.65 if outputs["taste"].lower() == "sweet" else 0.4
    )
)
    return jsonify({
        "color_ratios": {
            "green": green,
            "yellow": yellow,
            "orange": orange
        },
        "papaya_probability": papaya_result["papaya_prob"],
        "weather_last_7_days": weather,
        "predictions": {
            "ripeness_stage": outputs["ripeness"],
            "taste": outputs["taste"],
            "quality_grade": outputs["quality"],
            "buying_recommendation": outputs["buy"]
        },
        "final_suggestion": suggestion
    })


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5002, debug=True)
