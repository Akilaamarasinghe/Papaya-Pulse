import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib
import json

def train_model(csv_path="recommender_train.csv"):
    print("Loading data...")
    df = pd.read_csv(csv_path)

    print(f"Dataset shape: {df.shape}")
    print("\nTarget distribution (fertilizer_action):")
    print(df["fertilizer_action"].value_counts())

    # Features and target
    X = df[["disease", "severity", "growth_stage", "soil_type", "rain_7d", "temp_mean"]]
    y = df["fertilizer_action"].astype(str)

    cat = ["disease", "severity", "growth_stage", "soil_type"]
    num = ["rain_7d", "temp_mean"]

    pre = ColumnTransformer([
        ("cat", OneHotEncoder(handle_unknown="ignore"), cat),
        ("num", "passthrough", num)
    ])

    # Two models like your friend's file
    rf = RandomForestClassifier(
        n_estimators=300,
        max_depth=15,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        n_jobs=-1
    )

    gb = GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.08,
        random_state=42
    )

    rf_pipe = Pipeline([("pre", pre), ("clf", rf)])
    gb_pipe = Pipeline([("pre", pre), ("clf", gb)])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print(f"\nTraining size: {len(X_train)} | Test size: {len(X_test)}")

    print("\nTraining Random Forest...")
    rf_pipe.fit(X_train, y_train)
    rf_pred = rf_pipe.predict(X_test)
    rf_acc = accuracy_score(y_test, rf_pred)

    print("\nTraining Gradient Boosting...")
    gb_pipe.fit(X_train, y_train)
    gb_pred = gb_pipe.predict(X_test)
    gb_acc = accuracy_score(y_test, gb_pred)

    print("\n" + "="*60)
    print("RANDOM FOREST RESULTS")
    print("="*60)
    print(f"Accuracy: {rf_acc:.4f}")
    print("\nClassification report:")
    print(classification_report(y_test, rf_pred))
    print("Confusion matrix:")
    print(confusion_matrix(y_test, rf_pred))

    print("\n" + "="*60)
    print("GRADIENT BOOSTING RESULTS")
    print("="*60)
    print(f"Accuracy: {gb_acc:.4f}")
    print("\nClassification report:")
    print(classification_report(y_test, gb_pred))
    print("Confusion matrix:")
    print(confusion_matrix(y_test, gb_pred))

    print("\n" + "="*60)
    print("CROSS-VALIDATION (5-fold)")
    print("="*60)
    rf_cv = cross_val_score(rf_pipe, X, y, cv=5)
    gb_cv = cross_val_score(gb_pipe, X, y, cv=5)
    print(f"RF CV: {rf_cv.mean():.4f} (+/- {rf_cv.std():.4f})")
    print(f"GB CV: {gb_cv.mean():.4f} (+/- {gb_cv.std():.4f})")

    # Pick best model
    best_pipe = rf_pipe if rf_acc >= gb_acc else gb_pipe
    best_name = "RandomForest" if rf_acc >= gb_acc else "GradientBoosting"
    best_acc = max(rf_acc, gb_acc)

    print("\n" + "="*60)
    print(f"BEST MODEL: {best_name} | Accuracy: {best_acc:.4f}")
    print("="*60)

    # Save model + metadata
    joblib.dump(best_pipe, "fertilizer_recommender.pkl")
    metadata = {
        "features": ["disease", "severity", "growth_stage", "soil_type", "rain_7d", "temp_mean"],
        "model_type": best_name,
        "accuracy": float(best_acc),
        "classes": sorted(y.unique().tolist())
    }
    with open("fertilizer_model_metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)

    print("\nSaved:")
    print("- fertilizer_recommender.pkl")
    print("- fertilizer_model_metadata.json")

    return best_pipe

def predict_action(model, disease, severity, growth_stage, soil_type, rain_7d, temp_mean):
    X = pd.DataFrame([{
        "disease": disease,
        "severity": severity,
        "growth_stage": growth_stage,
        "soil_type": soil_type,
        "rain_7d": rain_7d,
        "temp_mean": temp_mean
    }])
    pred = model.predict(X)[0]

    # if model supports proba
    proba = None
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X)[0]
        classes = model.classes_
        proba = dict(zip(classes, probs))

    return pred, proba

if __name__ == "__main__":
    model = train_model("recommender_train.csv")

    print("\nExample prediction:")
    pred, proba = predict_action(
        model,
        disease="anthracnose",
        severity="severe",
        growth_stage="bearing",
        soil_type="clay_loam",
        rain_7d=80,
        temp_mean=28
    )
    print("Pred:", pred)
    if proba:
        print("Top probs:", sorted(proba.items(), key=lambda x: x[1], reverse=True)[:3])
