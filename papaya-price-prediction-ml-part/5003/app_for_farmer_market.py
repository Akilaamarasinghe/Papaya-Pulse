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

app = Flask(__name__)
CORS(app)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)
logger.info(f"App file path: {__file__}")


def load_artifacts(path):
    """
    Backward-compatible loader.

    New model bundles no longer contain:
      - day_model
      - day_scaler
      - feature_names_day

    because best_selling_day is now deterministic business logic derived from
    expect_selling_week, not an ML prediction target.
    """
    try:
        logger.info(f"Loading artifacts from: {path}")
        obj = joblib.load(path)
        logger.info(f"Successfully loaded model. Keys: {list(obj.keys())}")
        
        result = {
            "price_model": obj["price_model"],
            "day_model": obj.get("day_model"),
            "price_scaler": obj.get("price_scaler"),
            "day_scaler": obj.get("day_scaler"),
            "label_encoders": obj.get("label_encoders", {}),
            "feature_names_price": obj["feature_names_price"],
            "feature_names_day": obj.get("feature_names_day"),
            "price_rmse": obj.get("price_rmse")
        }
        logger.info(f"Feature names: {result['feature_names_price']}")
        return result
    except Exception as e:
        logger.error(f"Failed to load artifacts from {path}: {str(e)}", exc_info=True)
        raise


BEST = load_artifacts("best_qulity_ml_models/papaya_price_model_complete.pkl")
FACTORY = load_artifacts("factory_outlet_ml_models/factory_outlet_model.pkl")

logger.info("=" * 60)
logger.info("Model loading completed successfully!")
logger.info(f"BEST model features: {BEST['feature_names_price']}")
logger.info(f"FACTORY model features: {FACTORY['feature_names_price']}")
logger.info("=" * 60)

with open("summary_templates.json", "r", encoding="utf-8") as f:
    SUMMARY_TEMPLATES = json.load(f)


def _get_tree_model_for_shap(model):
    """
    Try to extract a tree-based estimator for SHAP.
    Supports:
    - CatBoost-like models directly
    - VotingRegressor/VotingClassifier with estimators_
    - pipelines that expose named_steps/final estimator less explicitly
    """
    # CatBoost / tree model directly
    if hasattr(model, "get_feature_importance") or model.__class__.__name__.lower().startswith("catboost"):
        return model

    # VotingRegressor / VotingClassifier
    if hasattr(model, "estimators_") and model.estimators_:
        for est in model.estimators_:
            if hasattr(est, "feature_importances_") or hasattr(est, "get_feature_importance"):
                return est

    # Old code assumed tuple style; keep a last fallback
    if hasattr(model, "estimators") and model.estimators:
        for est in model.estimators:
            if isinstance(est, tuple) and len(est) == 2:
                candidate = est[1]
                if hasattr(candidate, "feature_importances_") or hasattr(candidate, "get_feature_importance"):
                    return candidate

    return None


best_explainer = None
factory_explainer = None

if SHAP_AVAILABLE:
    try:
        best_tree_model = _get_tree_model_for_shap(BEST["price_model"])
        if best_tree_model is not None:
            best_explainer = shap.TreeExplainer(best_tree_model)
    except Exception:
        best_explainer = None

    try:
        factory_tree_model = _get_tree_model_for_shap(FACTORY["price_model"])
        if factory_tree_model is not None:
            factory_explainer = shap.TreeExplainer(factory_tree_model)
    except Exception:
        factory_explainer = None


FEATURE_TO_TEXT = {
    "rainfall_impact_score": "recent weather conditions",
    "last7_days_rainfall": "recent rainfall",
    "month_encoded": "season timing",
    "month_sin": "seasonal market cycle",
    "month_cos": "seasonal market cycle",
    "harvest_density": "harvest size",
    "total_weight_kg": "total harvest quantity",
    "avg_weight_kg": "fruit size",
    "quality_encoded": "crop quality",
    "quality_method_encoded": "quality and cultivation method mix",
    "quality_variety_encoded": "quality and variety mix",
    "variety_encoded": "papaya variety",
    "cultivation_methode_encoded": "cultivation method",
    "early_week": "selling timing",
    "expect_selling_week": "planned selling time",
    "rainfall_per_kg_unit": "rainfall relative to harvest size"
}


def normalize_month_name(month):
    if month is None:
        return get_current_month()
    month = str(month).strip()
    return month[:1].upper() + month[1:].lower() if month else get_current_month()


def best_selling_day_from_week(expect_selling_week):
    """
    Business rule replacing the removed day_model.
    """
    try:
        week = int(expect_selling_week)
    except Exception:
        week = 1

    mapping = {
        1: "Today",
        2: "1_day",
        3: "2_day",
        4: "3_day",
    }
    return mapping.get(week, "Today" if week <= 1 else f"{max(week - 1, 0)}_day")


def engineer_features(data, rainfall, month):
    df = pd.DataFrame([data]).copy()

    month = normalize_month_name(month)
    rainfall = float(rainfall)

    df["last7_days_rainfall"] = rainfall
    df["month"] = month

    df["total_weight_kg"] = (
        df["total_harvest_papaya_units_count"] * df["avg_weight_kg"]
    )
    df["harvest_density"] = (
        df["total_harvest_papaya_units_count"] / (df["avg_weight_kg"] + 1e-3)
    )
    df["rainfall_impact_score"] = 100 - (rainfall / 600.0 * 50.0)
    df["rainfall_squared"] = rainfall ** 2
    df["log_rainfall"] = np.log1p(rainfall)
    df["rainfall_per_kg_unit"] = rainfall / (df["avg_weight_kg"] + 1e-3)
    df["units_x_weight"] = df["total_harvest_papaya_units_count"] * df["avg_weight_kg"]

    month_map = {
        "January": 1, "February": 2, "March": 3, "April": 4,
        "May": 5, "June": 6, "July": 7, "August": 8,
        "September": 9, "October": 10, "November": 11, "December": 12
    }

    df["month_num"] = df["month"].map(month_map).fillna(datetime.now().month)
    df["month_sin"] = np.sin(2 * np.pi * df["month_num"] / 12)
    df["month_cos"] = np.cos(2 * np.pi * df["month_num"] / 12)
    df["season"] = df["month_num"].apply(lambda x: "Monsoon" if x in [5, 6, 9, 10, 11] else "Dry")
    df["early_week"] = (df["expect_selling_week"] <= 2).astype(int)
    df["is_early_week"] = df["early_week"]

    df["quality_method_interaction"] = df["quality"].astype(str) + "_" + df["cultivation_methode"].astype(str)
    df["quality_variety_interaction"] = df["quality"].astype(str) + "_" + df["variety"].astype(str)
    df["method_variety_interaction"] = df["cultivation_methode"].astype(str) + "_" + df["variety"].astype(str)
    df["district_variety"] = df["district"].astype(str) + "_" + df["variety"].astype(str)
    df["full_interaction"] = (
        df["quality"].astype(str) + "_" +
        df["cultivation_methode"].astype(str) + "_" +
        df["variety"].astype(str)
    )

    # Common alternate names some new models may use
    df["quality_method"] = df["quality_method_interaction"]
    df["quality_variety"] = df["quality_variety_interaction"]
    df["method_variety"] = df["method_variety_interaction"]

    return df


def encode_features(df, encoders):
    for col, le in encoders.items():
        if col in df.columns:
            values = df[col].astype(str)
            known = set(map(str, le.classes_))
            fallback_class = str(le.classes_[0]) if len(le.classes_) else None

            def safe_encode(x):
                x = str(x)
                if x in known:
                    return int(le.transform([x])[0])
                if fallback_class is not None:
                    return int(le.transform([fallback_class])[0])
                return 0

            df[f"{col}_encoded"] = values.apply(safe_encode)
        else:
            df[f"{col}_encoded"] = 0
    return df


def build_feature_frame(df, feature_names):
    row = []
    for f in feature_names:
        row.append(df[f].iloc[0] if f in df.columns else 0)
    return pd.DataFrame([row], columns=feature_names)


def predict_price(artifacts, X_price):
    model = artifacts["price_model"]
    scaler = artifacts.get("price_scaler")

    X_input = scaler.transform(X_price) if scaler is not None else X_price
    pred = model.predict(X_input)
    return float(pred[0])


def extract_shap_features(explainer, X_df):
    if not explainer:
        return []

    try:
        shap_vals = explainer.shap_values(X_df)
        if isinstance(shap_vals, list):
            shap_vals = shap_vals[0]

        impacts = shap_vals[0]
        features = X_df.columns

        items = [
            {"feature": str(f), "impact": float(v)}
            for f, v in zip(features, impacts)
        ]
        items.sort(key=lambda x: abs(x["impact"]), reverse=True)
        return items[:5]
    except Exception:
        return []


def generate_template_summary(input_data, predictions, shap_items):
    crop = str(input_data["variety"]).replace("_", " ")
    price = predictions["price_per_kg"]
    best_day = str(predictions["best_selling_day"]).replace("_", " ")
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


def prepare_input_and_predict(data, artifacts, explainer=None, force_factory_rule=False):
    month = data.get("month") or get_current_month()

    # Normalize common input variations from the mobile app
    data = dict(data or {})
    district = str(data.get("district", "")).strip()
    variety = str(data.get("variety", "")).strip()
    cultivation_methode = str(data.get("cultivation_methode", "")).strip()
    quality = str(data.get("quality", "")).strip()

    district_fixes = {
        "Hambanthota": "Hambantota",
    }
    variety_fixes = {
        "RedLady": "Red Lady",
    }

    data["district"] = district_fixes.get(district, district)
    data["variety"] = variety_fixes.get(variety, variety)
    data["cultivation_methode"] = cultivation_methode or "Unknown"
    data["quality"] = quality or "Unknown"

    def _safe_float(value, default=0.0):
        try:
            if value is None or value == "":
                return float(default)
            return float(value)
        except Exception:
            return float(default)

    def _safe_int(value, default=0):
        try:
            if value is None or value == "":
                return int(default)
            return int(float(value))
        except Exception:
            return int(default)

    data["total_harvest_papaya_units_count"] = _safe_float(
        data.get("total_harvest_papaya_units_count"), 0.0
    )
    data["avg_weight_kg"] = _safe_float(data.get("avg_weight_kg"), 0.0)
    data["expect_selling_week"] = _safe_int(data.get("expect_selling_week"), 1)

    if "last7_days_rainfall" in data and data["last7_days_rainfall"] is not None:
        rainfall = float(data["last7_days_rainfall"])
    else:
        try:
            lat, lon = geocode_district(data["district"])
            rainfall = float(get_last7_days_rainfall(lat, lon))
        except Exception as e:
            logger.warning(
                f"Rainfall lookup failed for district '{data.get('district')}': {e}. Using fallback 0.")
            rainfall = 0.0

    df = engineer_features(data, rainfall, month)

    # Factory outlet business rule for quality B
    if force_factory_rule and str(data.get("quality", "")).upper() == "B":
        df["expect_selling_week"] = 1

    df = encode_features(df, artifacts["label_encoders"])
    X_price = build_feature_frame(df, artifacts["feature_names_price"])
    price = predict_price(artifacts, X_price)

    best_day = best_selling_day_from_week(df["expect_selling_week"].iloc[0])
    shap_items = extract_shap_features(explainer, X_price)

    predictions = {
        "best_selling_day": best_day,
        "price_per_kg": round(price, 2),
        "total_harvest_value": round(
            price * float(data["total_harvest_papaya_units_count"]) * float(data["avg_weight_kg"]),
            2
        )
    }

    return {
        "success": True,
        "predictions": predictions,
        "summary": generate_template_summary(data, predictions, shap_items),
        "xai_factors": shap_items,
        "context": {
            "month_used": normalize_month_name(month),
            "rainfall_used": round(rainfall, 2)
        },
        "timestamp": datetime.now().isoformat()
    }


@app.route("/martket_data_predict", methods=["POST"])
def martket_data_predict():
    try:
        data = request.get_json()
        logger.info(f"Market prediction request: {data}")
        result = prepare_input_and_predict(data, BEST, best_explainer, force_factory_rule=False)
        logger.info(f"Market prediction result: {result}")
        return jsonify(result)
    except Exception as e:
        error_msg = f"Market price prediction error: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return jsonify({"success": False, "error": error_msg, "traceback": traceback.format_exc()}), 500


@app.route("/factory_outlet_price_predict", methods=["POST"])
def factory_outlet_price_predict():
    try:
        data = request.get_json()
        logger.info(f"Factory prediction request: {data}")
        result = prepare_input_and_predict(data, FACTORY, factory_explainer, force_factory_rule=True)
        logger.info(f"Factory prediction result: {result}")
        return jsonify(result)
    except Exception as e:
        error_msg = f"Factory outlet price prediction error: {str(e)}"
        logger.error(error_msg, exc_info=True)
        return jsonify({"success": False, "error": error_msg, "traceback": traceback.format_exc()}), 500


@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint to verify models are loaded correctly."""
    try:
        return jsonify({
            "status": "healthy",
            "models_loaded": True,
            "best_model_features": BEST['feature_names_price'],
            "factory_model_features": FACTORY['feature_names_price'],
            "encoders_best": list(BEST['label_encoders'].keys()),
            "encoders_factory": list(FACTORY['label_encoders'].keys()),
            "timestamp": datetime.now().isoformat()
        }), 200
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}", exc_info=True)
        return jsonify({"status": "error", "error": str(e)}), 500


if __name__ == "__main__":
    try:
        routes = [str(rule) for rule in app.url_map.iter_rules()]
        logger.info(f"Registered routes: {routes}")
    except Exception as e:
        logger.warning(f"Failed to list routes: {e}")
    app.run(host="0.0.0.0", port=5003, debug=False)
