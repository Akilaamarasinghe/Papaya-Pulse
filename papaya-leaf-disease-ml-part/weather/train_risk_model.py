"""
train_risk_model.py
===================
Trains a weather-based disease risk classifier.

Input CSV  : weather_risk_train.csv
Features   : disease, severity, tmean_c, rain_7d_mm, humidity_pct
Target     : risk_level  (LOW | MEDIUM | HIGH | CRITICAL)

Output     : weather_risk_model.pkl
             weather_risk_model_meta.json
"""

import pandas as pd
import numpy as np
import json
import joblib
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.preprocessing import OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix

CSV       = "weather_risk_train.csv"
OUT_MODEL = "weather_risk_model.pkl"
OUT_META  = "weather_risk_model_meta.json"

CAT_FEATS = ["disease", "severity"]
NUM_FEATS = ["tmean_c", "rain_7d_mm", "humidity_pct"]
FEATURES  = CAT_FEATS + NUM_FEATS
TARGET    = "risk_level"


def build_pipeline(clf):
    pre = ColumnTransformer([
        ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CAT_FEATS),
        ("num", "passthrough", NUM_FEATS),
    ])
    return Pipeline([("pre", pre), ("clf", clf)])


def main():
    print(f"Loading {CSV} ...")
    df = pd.read_csv(CSV)
    print(f"Shape: {df.shape}")
    print(df[TARGET].value_counts(), "\n")

    X = df[FEATURES]
    y = df[TARGET].astype(str)

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    rf  = build_pipeline(RandomForestClassifier(
        n_estimators=400,
        max_depth=None,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    ))
    gb  = build_pipeline(GradientBoostingClassifier(
        n_estimators=300,
        learning_rate=0.07,
        max_depth=5,
        random_state=42,
    ))

    print("Training Random Forest ...")
    rf.fit(X_tr, y_tr)
    rf_acc = accuracy_score(y_te, rf.predict(X_te))

    print("Training Gradient Boosting ...")
    gb.fit(X_tr, y_tr)
    gb_acc = accuracy_score(y_te, gb.predict(X_te))

    print(f"\nRF  accuracy : {rf_acc:.4f}")
    print(f"GB  accuracy : {gb_acc:.4f}")

    best_pipe  = rf  if rf_acc >= gb_acc else gb
    best_name  = "RandomForest" if rf_acc >= gb_acc else "GradientBoosting"
    best_acc   = max(rf_acc, gb_acc)

    best_pipe.fit(X, y)   # retrain on full dataset

    print(f"\nBest: {best_name}  ({best_acc:.4f})")
    print(classification_report(y_te, (rf if rf_acc >= gb_acc else gb).predict(X_te)))

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    cv_scores = cross_val_score(best_pipe, X, y, cv=cv, scoring="accuracy")
    print(f"CV scores: {cv_scores}  mean={cv_scores.mean():.4f}")

    joblib.dump(best_pipe, OUT_MODEL)
    print(f"\nSaved: {OUT_MODEL}")

    meta = {
        "features": FEATURES,
        "target": TARGET,
        "model_type": best_name,
        "accuracy": float(best_acc),
        "cv_mean": float(cv_scores.mean()),
        "classes": sorted(y.unique().tolist()),
        "risk_order": ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
    }
    with open(OUT_META, "w") as f:
        json.dump(meta, f, indent=2)
    print(f"Saved: {OUT_META}")

    # Smoke test
    print("\n-- Smoke test --")
    tests = [
        {"disease": "anthracnose", "severity": "severe",   "tmean_c": 28.5, "rain_7d_mm": 80.0, "humidity_pct": 88.0},
        {"disease": "mites",       "severity": "moderate", "tmean_c": 32.0, "rain_7d_mm": 3.0,  "humidity_pct": 45.0},
        {"disease": "mosaic",      "severity": "mild",     "tmean_c": 30.0, "rain_7d_mm": 5.0,  "humidity_pct": 58.0},
        {"disease": "leaf_curl",   "severity": "severe",   "tmean_c": 27.0, "rain_7d_mm": 25.0, "humidity_pct": 75.0},
        {"disease": "anthracnose", "severity": "mild",     "tmean_c": 22.0, "rain_7d_mm": 2.0,  "humidity_pct": 60.0},
    ]
    import pandas as _pd
    for tc in tests:
        pred  = best_pipe.predict(_pd.DataFrame([tc]))[0]
        probs = best_pipe.predict_proba(_pd.DataFrame([tc]))[0]
        conf  = probs.max() * 100
        print(f"  {tc['disease']:15s}  {tc['severity']:10s}  "
              f"T={tc['tmean_c']}°C  R={tc['rain_7d_mm']}mm  H={tc['humidity_pct']}%  "
              f"=> {pred}  ({conf:.1f}%)")


if __name__ == "__main__":
    main()
