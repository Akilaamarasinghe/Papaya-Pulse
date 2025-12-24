import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import LabelEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import json

def hex_to_rgb(hex_color):
    hex_color = str(hex_color).lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def prepare_features(df):
    df['R'] = df['Color'].apply(lambda x: hex_to_rgb(x)[0])
    df['G'] = df['Color'].apply(lambda x: hex_to_rgb(x)[1])
    df['B'] = df['Color'].apply(lambda x: hex_to_rgb(x)[2])
    
    features = ['District', 'Variety', 'Maturity', 'Days_since_plucked', 'R', 'G', 'B']
    X = df[features]
    y = df['Grade'].astype(str)
    
    return X, y, features

def train_model(csv_path):
    print("Loading data...")
    df = pd.read_csv(csv_path)
    
    print(f"Dataset shape: {df.shape}")
    print(f"\nGrade distribution:\n{df['Grade'].value_counts()}")
    
    X, y, feature_names = prepare_features(df)
    
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )
    
    print(f"\nTraining set size: {len(X_train)}")
    print(f"Test set size: {len(X_test)}")
    
    print("\nTraining Random Forest model...")
    rf_model = RandomForestClassifier(
        n_estimators=200,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train, y_train)
    
    print("Training Gradient Boosting model...")
    gb_model = GradientBoostingClassifier(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.1,
        random_state=42
    )
    gb_model.fit(X_train, y_train)
    
    print("\n" + "="*60)
    print("RANDOM FOREST RESULTS")
    print("="*60)
    rf_pred = rf_model.predict(X_test)
    rf_accuracy = accuracy_score(y_test, rf_pred)
    print(f"Accuracy: {rf_accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, rf_pred, target_names=[str(c) for c in le.classes_]))
    
    print("\n" + "="*60)
    print("GRADIENT BOOSTING RESULTS")
    print("="*60)
    gb_pred = gb_model.predict(X_test)
    gb_accuracy = accuracy_score(y_test, gb_pred)
    print(f"Accuracy: {gb_accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, gb_pred, target_names=[str(c) for c in le.classes_]))
    
    print("\n" + "="*60)
    print("CROSS-VALIDATION SCORES (5-fold)")
    print("="*60)
    rf_cv_scores = cross_val_score(rf_model, X, y_encoded, cv=5)
    print(f"Random Forest CV Accuracy: {rf_cv_scores.mean():.4f} (+/- {rf_cv_scores.std():.4f})")
    
    gb_cv_scores = cross_val_score(gb_model, X, y_encoded, cv=5)
    print(f"Gradient Boosting CV Accuracy: {gb_cv_scores.mean():.4f} (+/- {gb_cv_scores.std():.4f})")
    
    print("\n" + "="*60)
    print("FEATURE IMPORTANCE (Random Forest)")
    print("="*60)
    feature_importance = pd.DataFrame({
        'feature': feature_names,
        'importance': rf_model.feature_importances_
    }).sort_values('importance', ascending=False)
    print(feature_importance)
    
    best_model = rf_model if rf_accuracy >= gb_accuracy else gb_model
    best_model_name = "Random Forest" if rf_accuracy >= gb_accuracy else "Gradient Boosting"
    
    print(f"\n{'='*60}")
    print(f"Best Model: {best_model_name}")
    print(f"{'='*60}")
    
    print("\nSaving model and encoders...")
    joblib.dump(best_model, 'papaya_grade_model.pkl')
    joblib.dump(le, 'label_encoder.pkl')
    
    metadata = {
        'feature_names': feature_names,
        'classes': [str(c) for c in le.classes_],
        'model_type': best_model_name,
        'accuracy': float(max(rf_accuracy, gb_accuracy))
    }
    with open('model_metadata.json', 'w') as f:
        json.dump(metadata, f, indent=2)
    
    print("\nModel saved as: papaya_grade_model.pkl")
    print("Label encoder saved as: label_encoder.pkl")
    print("Metadata saved as: model_metadata.json")
    
    return best_model, le

def predict_grade(district, variety, maturity, days_since_plucked, color):
    try:
        model = joblib.load('papaya_grade_model.pkl')
        le = joblib.load('label_encoder.pkl')
        
        with open('model_metadata.json', 'r') as f:
            metadata = json.load(f)
        
        r, g, b = hex_to_rgb(color)
        
        input_df = pd.DataFrame([[district, variety, maturity, days_since_plucked, r, g, b]], 
                                columns=metadata['feature_names'])
        
        prediction = model.predict(input_df)
        prediction_proba = model.predict_proba(input_df)
        
        grade = le.inverse_transform(prediction)[0]
        confidence = prediction_proba[0][prediction[0]]
        
        return grade, confidence, dict(zip([str(c) for c in le.classes_], prediction_proba[0]))
    except Exception as e:
        print(f"Prediction error: {e}")
        raise

if __name__ == "__main__":
    print("PAPAYA GRADE PREDICTION MODEL TRAINING")
    print("="*60)
    
    csv_file = "papaya_quality_dataset.csv"
    
    try:
        model, label_encoder = train_model(csv_file)
        
        print("\n" + "="*60)
        print("EXAMPLE PREDICTIONS")
        print("="*60)
        
        test_cases = [
            (1, 0, 2, 6, "#F96C21", "3"),
            (2, 0, 2, 4, "#FFD53E", "2"),
            (0, 0, 0, 2, "#1E950F", "1"),
        ]
        
        for district, variety, maturity, days, color, expected in test_cases:
            grade, confidence, all_probs = predict_grade(district, variety, maturity, days, color)
            print(f"\nInput: District={district}, Variety={variety}, Maturity={maturity}, Days={days}, Color={color}")
            print(f"Expected: {expected} | Predicted: {grade} | Confidence: {confidence:.4f}")
            
    except FileNotFoundError:
        print(f"\nError: Could not find '{csv_file}'")
        print("Please save your CSV data as 'papaya_quality_dataset.csv' and run again.")
    except Exception as e:
        print(f"\nError: {e}")
        import traceback
        traceback.print_exc()