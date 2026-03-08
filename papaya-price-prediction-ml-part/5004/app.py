from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import joblib
from datetime import datetime
from PIL import Image
import shap
import numpy as np

from check_papaya import predict_pipeline
from getColor import get_dominant_color, hex_to_rgb
from suggestion_maker import generate_market_suggestion
from utils_weather import geocode_district, get_last7_days_rainfall

# ---------------- APP SETUP ----------------
app = Flask(__name__)
CORS(app)

# ---------------- LOAD MODELS ----------------
ripeness_pipeline = joblib.load("artifacts/ripeness_model.joblib")
price_pipeline = joblib.load("artifacts/price_model.joblib")

ripeness_model = ripeness_pipeline.named_steps["model"]
ripeness_preproc = ripeness_pipeline.named_steps["preproc"]

price_model = price_pipeline.named_steps["model"]
price_preproc = price_pipeline.named_steps["preproc"]

VARIETIES = ["Red_Lady", "Tainung"]

RIPENESS_LABELS = {
    0: "Unripe",
    1: "Half ripe",
    2: "Market ready",
    3: "Overripe"
}

RIPENESS_LABELS_SI = {
    0: "නොඉදුණු",
    1: "අර්ධ ඉදුණු",
    2: "වෙළඳපලට සූදානම්",
    3: "අධිකව ඉදුණු"
}

# ---------------- UTIL FUNCTIONS ----------------
def rgb_to_ratios(rgb):
    r, g, b = rgb
    total = r + g + b + 1e-6
    return {
        "green": round(g / total, 4),
        "yellow": round((r + g) / (2 * total), 4),
        "orange": round(r / total, 4)
    }


def shap_explain(model, X_transformed, feature_names):
    """
    Fully robust SHAP explainer.
    Handles:
    - Multiclass GradientBoostingClassifier (KernelExplainer)
    - Tree models (TreeExplainer)
    - Scalar OR vector SHAP values per feature
    """

    model_name = model.__class__.__name__

    # ---------- MULTICLASS GRADIENT BOOSTING ----------
    if model_name == "GradientBoostingClassifier":
        def predict_fn(x):
            return model.predict_proba(x)

        background = np.mean(X_transformed, axis=0, keepdims=True)
        explainer = shap.KernelExplainer(predict_fn, background)

        shap_values = explainer.shap_values(
            X_transformed,
            nsamples=50
        )

        if isinstance(shap_values, list):
            pred_class = int(model.predict(X_transformed)[0])
            shap_vals = shap_values[min(pred_class, len(shap_values) - 1)][0]
        else:
            shap_vals = shap_values[0]

    # ---------- TREE MODELS ----------
    else:
        explainer = shap.TreeExplainer(model)
        shap_values = explainer.shap_values(X_transformed)

        if isinstance(shap_values, list):
            shap_vals = shap_values[0][0]
        else:
            shap_vals = shap_values[0]

    impacts = []
    for i, name in enumerate(feature_names):
        val = shap_vals[i]

        # 🔥 THIS IS THE CRITICAL FIX
        if isinstance(val, (list, np.ndarray)):
            impact = float(np.mean(np.abs(val)))
        else:
            impact = float(val)

        impacts.append({
            "feature": name,
            "impact": round(impact, 4)
        })

    impacts.sort(key=lambda x: abs(x["impact"]), reverse=True)
    return impacts[:5]



# ---------------- API ENDPOINT ----------------
@app.route("/sachini-cus-predict", methods=["POST"])
def predict():
    if "file" not in request.files:
        return jsonify({"error": "image required"}), 400

    # ---------- IMAGE ----------
    file = request.files["file"]
    image = Image.open(file.stream).convert("RGB")

    city = request.form.get("city")
    if not city:
        return jsonify({"error": "city required"}), 400

    seller_price = request.form.get("seller_price")
    seller_price = float(seller_price) if seller_price else None

    language = request.form.get("language", "en")

    # ---------- PAPAYA CHECK ----------
    papaya_check = predict_pipeline(image)
    if not papaya_check["is_papaya"]:
        # Return 200 so the frontend navigates to the result screen and shows
        # the "Detection Failed" UI instead of crashing with an AxiosError.
        return jsonify({"error": "Not a papaya"}), 200

    # ---------- COLOR ----------
    # Reset the stream position before re-reading for colour extraction
    # (PIL.Image.open() leaves the stream pointer at the end).
    file.stream.seek(0)
    hex_color = get_dominant_color(file.stream)
    rgb = hex_to_rgb(hex_color)
    ratios = rgb_to_ratios(rgb)

    # ---------- WEATHER ----------
    lat, lon = geocode_district(city)
    rainfall = float(get_last7_days_rainfall(lat, lon))
    month = datetime.now().month

    # ---------- RIPENESS ----------
    X1 = pd.DataFrame([{
        "district": city,
        "month": month,
        "green_ratio": ratios["green"],
        "yellow_ratio": ratios["yellow"],
        "orange_ratio": ratios["orange"],
        "last7_days_rainfall": rainfall
    }])

    X1_t = ripeness_preproc.transform(X1)
    ripeness_pred = int(ripeness_model.predict(X1_t)[0])
    ripeness_label = RIPENESS_LABELS[ripeness_pred]
    ripeness_label_si = RIPENESS_LABELS_SI[ripeness_pred]
    confidence = round(max(ripeness_model.predict_proba(X1_t)[0]) * 100, 2)

    ripeness_features = (
        ripeness_preproc.get_feature_names_out().tolist()
        if hasattr(ripeness_preproc, "get_feature_names_out")
        else list(X1.columns)
    )


    ripeness_shap = shap_explain(
        ripeness_model,
        X1_t,
        ripeness_features
    )

    # ---------- PRICE ----------
    price_rows = []

    for variety in VARIETIES:
        X2 = pd.DataFrame([{
            "district": city,
            "variety": variety,
            "month": month,
            "green_ratio": ratios["green"],
            "yellow_ratio": ratios["yellow"],
            "orange_ratio": ratios["orange"],
            "ripeness_stage": ripeness_pred,
            
            "last7_days_rainfall": rainfall
        }])

        X2_t = price_preproc.transform(X2)
        price = float(price_model.predict(X2_t)[0])

        price_features = (
            price_preproc.get_feature_names_out().tolist()
            if hasattr(price_preproc, "get_feature_names_out")
            else list(X2.columns)
        )

        price_shap = shap_explain(
            price_model,
            X2_t,
            price_features
        )

        price_rows.append({
            "variety": variety,
            "price_lkr_per_kg": round(price, 2),
            "price_drivers": price_shap
        })

    # ---------- PAYLOAD FOR GEMINI ----------
    payload = {
        "location": city,
        "month": month,
        "rainfall_mm": rainfall,
        "ripeness": ripeness_label,
        "ripeness_si": ripeness_label_si,
        "confidence_percent": confidence,
        "color_ratios": ratios,
        "ripeness_drivers": ripeness_shap, 
        "price_table": price_rows,
        "seller_price": seller_price
    }

    final_suggestion = generate_market_suggestion(payload, language=language)

    # ---------- RESPONSE ----------
    return jsonify({
        "analysis": payload,
        "final_market_advice": final_suggestion.get("en", final_suggestion) if isinstance(final_suggestion, dict) else final_suggestion,
        "final_market_advice_si": final_suggestion.get("si", "") if isinstance(final_suggestion, dict) else "",
    })


# ---------------- RUN ----------------
if __name__ == "__main__":
    app.run(port=5004, debug=True)
