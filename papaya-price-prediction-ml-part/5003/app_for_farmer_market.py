from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime
import numpy as np
import pandas as pd
import joblib
import traceback
import json
import random
import logging

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False

from utils_weather import get_last7_days_rainfall, geocode_district, get_current_month

# =====================================================
# APP
# =====================================================
app = Flask(__name__)
CORS(app)
logging.basicConfig(level=logging.INFO)

# =====================================================
# LOAD ARTIFACTS
# =====================================================
def load_artifacts(path):
    obj = joblib.load(path)
    return {
        "price_model": obj["price_model"],
        "day_model": obj["day_model"],
        "price_scaler": obj["price_scaler"],
        "day_scaler": obj["day_scaler"],
        "label_encoders": obj["label_encoders"],
        "feature_names_price": obj["feature_names_price"],
        "feature_names_day": obj["feature_names_day"],
        "price_rmse": obj.get("price_rmse")
    }

BEST = load_artifacts("best_qulity_ml_models/papaya_price_model_complete.pkl")
FACTORY = load_artifacts("factory_outlet_ml_models/papaya_price_model_complete.pkl")

# =====================================================
# LOAD SUMMARY TEMPLATES
# =====================================================
with open("summary_templates.json", "r", encoding="utf-8") as f:
    SUMMARY_TEMPLATES = json.load(f)

# Load Sinhala summary templates if available
try:
    with open("summary_templates_si.json", "r", encoding="utf-8") as f:
        SUMMARY_TEMPLATES_SI = json.load(f)
except FileNotFoundError:
    SUMMARY_TEMPLATES_SI = []

# =====================================================
# SHAP EXPLAINERS
# =====================================================
best_explainer = None
factory_explainer = None

if SHAP_AVAILABLE:
    try:
        best_explainer = shap.TreeExplainer(
            BEST["price_model"].estimators_[0][1]
        )
        factory_explainer = shap.TreeExplainer(
            FACTORY["price_model"].estimators_[0][1]
        )
    except Exception:
        pass

FEATURE_TO_TEXT = {
    "rainfall_impact_score": "recent weather conditions",
    "last7_days_rainfall": "recent rainfall",
    "month_encoded": "season timing",
    "month_sin": "seasonal market cycle",
    "harvest_density": "harvest size",
    "total_weight_kg": "total harvest quantity",
    "avg_weight_kg": "fruit size",
    "quality_encoded": "crop quality",
    "early_week": "selling timing",
    "expect_selling_week": "planned selling time"
}

FEATURE_TO_TEXT_SI = {
    "rainfall_impact_score": "මෑත කාලගුණ තත්ත්ව",
    "last7_days_rainfall": "මෑත වර්ෂාපතනය",
    "month_encoded": "ඍතු කාලය",
    "month_sin": "සෘතු වෙළඳපල චක්‍රය",
    "harvest_density": "අස්වනු ප්‍රමාණය",
    "total_weight_kg": "මුළු අස්වනු ප්‍රමාණය",
    "avg_weight_kg": "ඵල ප්‍රමාණය",
    "quality_encoded": "ෙගොාදවිතැන් ගුණාත්මකභාවය",
    "early_week": "විකුණුම් කාලය",
    "expect_selling_week": "සැලසුම් කළ විකිණීමේ වේලාව"
}

# Sinhala selling day mapping
SELLING_DAY_SI = {
    "today": "අද",
    "Today": "අද",
    "Week 0": "අද",
    "Week_0": "අද",
    "week0": "අද",
    "0": "අද",
    "Week 1": "සතිය 1",
    "Week_1": "සතිය 1",
    "week1": "සතිය 1",
    "1": "සතිය 1",
    "Week 2": "සතිය 2",
    "Week_2": "සතිය 2",
    "week2": "සතිය 2",
    "2": "සතිය 2",
}

# =====================================================
# FEATURE ENGINEERING
# =====================================================
def engineer_features(data, rainfall, month):
    df = pd.DataFrame([data])

    df["last7_days_rainfall"] = rainfall
    df["rainfall_squared"] = rainfall ** 2
    df["month"] = month

    df["total_weight_kg"] = (
        df["total_harvest_papaya_units_count"] * df["avg_weight_kg"]
    )
    df["harvest_density"] = (
        df["total_harvest_papaya_units_count"] / (df["avg_weight_kg"] + 1e-3)
    )
    df["rainfall_impact_score"] = 100 - (rainfall / 600 * 50)

    month_map = {
        "January": 1, "February": 2, "March": 3, "April": 4,
        "May": 5, "June": 6, "July": 7, "August": 8,
        "September": 9, "October": 10, "November": 11, "December": 12
    }

    df["month_num"] = df["month"].map(month_map)
    df["month_sin"] = np.sin(2 * np.pi * df["month_num"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month_num"] / 12)
    df["early_week"] = (df["expect_selling_week"] <= 2).astype(int)

    df["quality_method_interaction"] = df["quality"] + "_" + df["cultivation_methode"]
    df["quality_variety_interaction"] = df["quality"] + "_" + df["variety"]
    df["method_variety_interaction"] = df["cultivation_methode"] + "_" + df["variety"]
    df["full_interaction"] = (
        df["quality"] + "_" +
        df["cultivation_methode"] + "_" +
        df["variety"]
    )

    return df

# =====================================================
# ENCODING
# =====================================================
def encode_features(df, encoders):
    for col, le in encoders.items():
        if col in df.columns:
            df[f"{col}_encoded"] = df[col].astype(str).apply(
                lambda x: le.transform([x])[0] if x in le.classes_ else 0
            )
        else:
            df[f"{col}_encoded"] = 0
    return df

def build_feature_frame(df, feature_names):
    return pd.DataFrame(
        [[df[f].iloc[0] if f in df.columns else 0 for f in feature_names]],
        columns=feature_names
    )

# =====================================================
# SHAP EXTRACTION
# =====================================================
def extract_shap_features(explainer, X_df):
    if not explainer:
        return []

    shap_vals = explainer.shap_values(X_df)
    if isinstance(shap_vals, list):
        shap_vals = shap_vals[0]

    impacts = shap_vals[0]
    features = X_df.columns

    items = [
        {"feature": f, "impact": float(v)}
        for f, v in zip(features, impacts)
    ]
    items.sort(key=lambda x: abs(x["impact"]), reverse=True)
    return items[:5]

# =====================================================
# TEMPLATE-BASED SUMMARY
# =====================================================
def generate_template_summary(input_data, predictions, shap_items):
    crop = input_data["variety"].replace("_", " ")
    price = predictions["price_per_kg"]
    best_day = predictions["best_selling_day"].replace("_", " ")
    time_phrase = "today" if best_day.lower() == "today" else f"after {best_day}"

    positives = [f for f in shap_items if f["impact"] > 0][:3]
    negatives = [f for f in shap_items if f["impact"] < 0][:1]

    positive_reasons = ", ".join(
        FEATURE_TO_TEXT.get(f["feature"], f["feature"].replace("_", " "))
        for f in positives
    ) or "current market conditions"

    negative_clause = ""
    if negatives:
        neg = FEATURE_TO_TEXT.get(
            negatives[0]["feature"],
            negatives[0]["feature"].replace("_", " ")
        )
        negative_clause = f"However, {neg} is slightly reducing the price. "

    return random.choice(SUMMARY_TEMPLATES).format(
        positive_reasons=positive_reasons,
        negative_clause=negative_clause,
        crop=crop,
        price=price,
        time_phrase=time_phrase
    )


def generate_template_summary_si(input_data, predictions, shap_items):
    """Generate a Sinhala template-based market summary."""
    crop = input_data["variety"].replace("_", " ")
    price = predictions["price_per_kg"]
    best_day = predictions["best_selling_day"]
    time_phrase_si = SELLING_DAY_SI.get(best_day, best_day)

    positives = [f for f in shap_items if f["impact"] > 0][:3]
    negatives = [f for f in shap_items if f["impact"] < 0][:1]

    positive_reasons_si = ", ".join(
        FEATURE_TO_TEXT_SI.get(f["feature"], f["feature"].replace("_", " "))
        for f in positives
    ) or "වත්මන් වෙළඳපල තත්ත්ව"

    negative_clause_si = ""
    if negatives:
        neg_si = FEATURE_TO_TEXT_SI.get(
            negatives[0]["feature"],
            negatives[0]["feature"].replace("_", " ")
        )
        negative_clause_si = f"කෙසේ නමුත්, {neg_si} මිල තරමක් අඩු කරයි. "

    templates_si = SUMMARY_TEMPLATES_SI if SUMMARY_TEMPLATES_SI else [
        "{positive_reasons_si} නිසා වෙළඳපල මිල හොඳ ලෙස ක්‍රියාත්මක වේ. "
        "{negative_clause_si}{crop} හි දැනට මිල LKR {price:.2f} per kg ලෙස ඇත. "
        "{time_phrase_si} විකිණීම ලාභදායී ලෙස අපේක්ෂා කෙරේ."
    ]

    return random.choice(templates_si).format(
        positive_reasons_si=positive_reasons_si,
        negative_clause_si=negative_clause_si,
        crop=crop,
        price=price,
        time_phrase_si=time_phrase_si
    )

# =====================================================
# BEST QUALITY ENDPOINT
# =====================================================
@app.route("/martket_data_predict", methods=["POST"])
def martket_data_predict():
    try:
        data = request.get_json()
        language = data.get("language", "en")
        month = get_current_month()
        lat, lon = geocode_district(data["district"])
        rainfall = get_last7_days_rainfall(lat, lon)

        df = engineer_features(data, rainfall, month)
        df = encode_features(df, BEST["label_encoders"])

        X_price = build_feature_frame(df, BEST["feature_names_price"])
        X_day = build_feature_frame(df, BEST["feature_names_day"])

        price = float(
            BEST["price_model"].predict(
                BEST["price_scaler"].transform(X_price)
            )[0]
        )

        day_enc = BEST["day_model"].predict(
            BEST["day_scaler"].transform(X_day)
        )[0]

        best_day = BEST["label_encoders"]["best_selling_day"].inverse_transform([day_enc])[0]

        shap_items = extract_shap_features(best_explainer, X_price)

        predictions = {
            "best_selling_day": best_day,
            "best_selling_day_si": SELLING_DAY_SI.get(str(best_day), best_day),
            "price_per_kg": round(price, 2),
            "total_harvest_value": round(
                price * data["total_harvest_papaya_units_count"] * data["avg_weight_kg"], 2
            )
        }

        summary_en = generate_template_summary(data, predictions, shap_items)
        summary_si = generate_template_summary_si(data, predictions, shap_items)

        return jsonify({
            "success": True,
            "predictions": predictions,
            "summary": summary_en,
            "summary_si": summary_si,
            "xai_factors": shap_items,
            "timestamp": datetime.now().isoformat()
        })

    except Exception:
        return jsonify({"success": False, "error": traceback.format_exc()}), 500

# =====================================================
# FACTORY OUTLET ENDPOINT
# =====================================================
@app.route("/factory_outlet_price_predict", methods=["POST"])
def factory_outlet_price_predict():
    try:
        data = request.get_json()
        language = data.get("language", "en")
        month = get_current_month()
        lat, lon = geocode_district(data["district"])
        rainfall = get_last7_days_rainfall(lat, lon)

        df = engineer_features(data, rainfall, month)
        df = encode_features(df, FACTORY["label_encoders"])

        X_price = build_feature_frame(df, FACTORY["feature_names_price"])
        X_day = build_feature_frame(df, FACTORY["feature_names_day"])

        price = float(
            FACTORY["price_model"].predict(
                FACTORY["price_scaler"].transform(X_price)
            )[0]
        )

        day_enc = FACTORY["day_model"].predict(
            FACTORY["day_scaler"].transform(X_day)
        )[0]

        best_day = FACTORY["label_encoders"]["best_selling_day"].inverse_transform([day_enc])[0]

        shap_items = extract_shap_features(factory_explainer, X_price)

        predictions = {
            "best_selling_day": best_day,
            "best_selling_day_si": SELLING_DAY_SI.get(str(best_day), best_day),
            "price_per_kg": round(price, 2),
            "total_harvest_value": round(
                price * data["total_harvest_papaya_units_count"] * data["avg_weight_kg"], 2
            )
        }

        summary_en = generate_template_summary(data, predictions, shap_items)
        summary_si = generate_template_summary_si(data, predictions, shap_items)

        return jsonify({
            "success": True,
            "predictions": predictions,
            "summary": summary_en,
            "summary_si": summary_si,
            "xai_factors": shap_items,
            "timestamp": datetime.now().isoformat()
        })

    except Exception:
        return jsonify({"success": False, "error": traceback.format_exc()}), 500

# =====================================================
# RUN
# =====================================================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5003, debug=False)
