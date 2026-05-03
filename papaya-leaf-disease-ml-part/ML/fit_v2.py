"""
fit_v2.py
=========
Trains recommendation models on recommender_train_v2.csv
Features: disease, severity, growth_stage, soil_type
Targets:
  - fertilizer_action  (multi-class classification)
  - prevention_label   (multi-label -> top-level category classifier)

Outputs:
  - fertilizer_model_v2.pkl
  - fertilizer_model_v2_meta.json
"""

import pandas as pd
import numpy as np
import json
import joblib
from sklearn.model_selection import train_test_split, cross_val_score, StratifiedKFold
from sklearn.preprocessing import OrdinalEncoder
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import classification_report, accuracy_score
from sklearn.pipeline import Pipeline
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder

FEATURES = ["disease", "severity", "growth_stage", "soil_type"]
TARGET_FERT = "fertilizer_action"
CSV = "recommender_train_v2.csv"


def build_preprocessor():
    cat_features = ["disease", "severity", "growth_stage", "soil_type"]
    pre = ColumnTransformer([
        ("ohe", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_features)
    ])
    return pre


def train_fertilizer_model(df: pd.DataFrame):
    X = df[FEATURES]
    y = df[TARGET_FERT].astype(str)

    pre = build_preprocessor()

    rf = RandomForestClassifier(
        n_estimators=400,
        max_depth=None,
        min_samples_split=2,
        min_samples_leaf=1,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1,
    )
    gb = GradientBoostingClassifier(
        n_estimators=250,
        learning_rate=0.07,
        max_depth=5,
        random_state=42,
    )

    rf_pipe = Pipeline([("pre", pre), ("clf", rf)])
    gb_pipe = Pipeline([("pre", pre), ("clf", gb)])

    X_tr, X_te, y_tr, y_te = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training Random Forest (fertilizer)...")
    rf_pipe.fit(X_tr, y_tr)
    rf_acc = accuracy_score(y_te, rf_pipe.predict(X_te))

    print("Training Gradient Boosting (fertilizer)...")
    gb_pipe.fit(X_tr, y_tr)
    gb_acc = accuracy_score(y_te, gb_pipe.predict(X_te))

    print(f"\nRF  accuracy: {rf_acc:.4f}")
    print(f"GB  accuracy: {gb_acc:.4f}")

    best_pipe = rf_pipe if rf_acc >= gb_acc else gb_pipe
    best_name = "RandomForest" if rf_acc >= gb_acc else "GradientBoosting"
    best_acc = max(rf_acc, gb_acc)

    print(f"\nBest: {best_name}  ({best_acc:.4f})")
    print(classification_report(y_te, best_pipe.predict(X_te)))

    # Cross-validation
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    best_full_pipe = rf_pipe if rf_acc >= gb_acc else gb_pipe
    # retrain on full data
    best_full_pipe.fit(X, y)

    cv_scores = cross_val_score(
        rf_pipe if rf_acc >= gb_acc else gb_pipe,
        X, y, cv=cv, scoring="accuracy"
    )
    print(f"CV scores: {cv_scores}  mean={cv_scores.mean():.4f}")

    return best_full_pipe, best_name, float(best_acc), sorted(y.unique().tolist())


def main():
    print(f"Loading {CSV} ...")
    df = pd.read_csv(CSV)
    print(f"Shape: {df.shape}")
    print(df["fertilizer_action"].value_counts(), "\n")

    fert_model, model_name, fert_acc, fert_classes = train_fertilizer_model(df)

    out_model = "fertilizer_model_v2.pkl"
    joblib.dump(fert_model, out_model)
    print(f"\nSaved: {out_model}")

    meta = {
        "features": FEATURES,
        "target": TARGET_FERT,
        "model_type": model_name,
        "accuracy": fert_acc,
        "classes": fert_classes,
        "version": "2",
        "notes": "Trained without weather features. Weather handled separately by weather_risk_model.pkl"
    }
    with open("fertilizer_model_v2_meta.json", "w") as f:
        json.dump(meta, f, indent=2)
    print("Saved: fertilizer_model_v2_meta.json")

    # Quick smoke test
    print("\n-- Smoke test predictions --")
    test_cases = [
        {"disease": "anthracnose", "severity": "severe",   "growth_stage": "bearing",    "soil_type": "clay_loam"},
        {"disease": "mosaic",      "severity": "moderate", "growth_stage": "flowering",  "soil_type": "sandy_loam"},
        {"disease": "mites",       "severity": "mild",     "growth_stage": "vegetative", "soil_type": "red_laterite"},
        {"disease": "leaf_curl",   "severity": "severe",   "growth_stage": "bearing",    "soil_type": "sandy_loam"},
    ]
    import pandas as _pd
    for tc in test_cases:
        pred = fert_model.predict(_pd.DataFrame([tc]))[0]
        prob = fert_model.predict_proba(_pd.DataFrame([tc]))[0].max()
        print(f"  {tc['disease']:15s}  {tc['severity']:10s}  {tc['growth_stage']:12s}  {tc['soil_type']:12s}  => {pred}  ({prob*100:.1f}%)")


if __name__ == "__main__":
    main()
