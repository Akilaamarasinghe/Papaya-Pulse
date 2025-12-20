from flask import Flask, request, jsonify
import joblib
import numpy as np
import pandas as pd
import requests
from pathlib import Path
from datetime import datetime, timedelta
import shap
import json
import traceback

# ================= CONFIG =================
MODEL_DIR = Path("ml_models")
MODEL_PATH = MODEL_DIR / "model.joblib"
ENC_PATH = MODEL_DIR / "encoders.joblib"
SHAP_BG_PATH = MODEL_DIR / "shap_background.npy"
LABELS_PATH = Path("data_mapping.json")  # Using data_mapping.json instead

FEATURES = ["district", "variety", "color", "texture", "maturity", "damage", "temperature"]
CAT = ["district", "variety", "color", "texture"]
NUM = ["maturity", "damage", "temperature"]

# ================= APP =================
app = Flask(__name__)

model = joblib.load(MODEL_PATH)
encoders = joblib.load(ENC_PATH)
shap_bg = np.load(SHAP_BG_PATH)

with open(LABELS_PATH, "r", encoding="utf-8") as f:
    LABELS = json.load(f)

explainer = shap.TreeExplainer(model, data=shap_bg)

# ================= HELPERS =================
def clean_cat(x):
    if x is None:
        return "unknown"
    s = str(x).strip()
    return s if s else "unknown"

def geocode(name):
    try:
        r = requests.get(
            "https://nominatim.openstreetmap.org/search",
            params={"q": name, "format": "json", "limit": 1},
            headers={"User-Agent": "PapayaGrader"},
            timeout=10
        )
        d = r.json()
        if not d:
            return None
        return float(d[0]["lat"]), float(d[0]["lon"])
    except:
        return None

def get_temp(district):
    coords = geocode(district)
    if coords is None:
        return None

    lat, lon = coords
    end = (datetime.utcnow() - timedelta(days=1)).date()
    start = end - timedelta(days=2)

    try:
        r = requests.get(
            "https://api.open-meteo.com/v1/forecast",
            params={
                "latitude": lat,
                "longitude": lon,
                "start_date": start.isoformat(),
                "end_date": end.isoformat(),
                "hourly": "temperature_2m",
                "timezone": "UTC"
            },
            timeout=15
        )

        temps = r.json().get("hourly", {}).get("temperature_2m", [])
        if not temps:
            return None

        avg = sum(temps) / len(temps)
        if avg < 10 or avg > 45:
            return None

        return round(avg, 2)
    except:
        return None

def friendly(pred, shap_vals):
    boosts, drops = [], []

    for feat, sv in zip(FEATURES, shap_vals):
        if sv > 0.01:
            boosts.append(feat)
        elif sv < -0.01:
            drops.append(feat)

    s1 = "These factors improved the fruit quality: " + (", ".join(boosts) if boosts else "none") + "."
    s2 = "These factors slightly reduced the quality: " + (", ".join(drops) if drops else "none") + "."

    if pred == "Best Quality":
        s3 = "Overall, this papaya is top-tier quality."
    elif pred == "Medium Quality":
        s3 = "Overall, the fruit is good but not perfect."
    else:
        s3 = "Overall, the fruit quality is low due to multiple issues."

    return f"{s1} {s2} {s3}"

# ================= ROUTE =================
@app.route("/papaya_grade_predict", methods=["POST"])
def predict():
    try:
        p = request.get_json(force=True)

        dist_map = LABELS["district"]
        var_map = LABELS["variety"]
        grade_map = LABELS["farmer_grade"]

        dist_rev = {v: k for k, v in dist_map.items()}
        var_rev = {v: k for k, v in var_map.items()}

        district = dist_rev.get(int(p["district"]), "unknown")
        variety = var_rev.get(int(p["variety"]), "unknown")
        color = clean_cat(p.get("color"))
        texture = clean_cat(p.get("texture"))
        
        # Handle maturity - can be text or number
        maturity_input = p.get("maturity", 75.0)
        if isinstance(maturity_input, str):
            maturity_map = {
                'unmature': 50.0,
                'half-mature': 75.0,
                'mature': 90.0
            }
            maturity = maturity_map.get(maturity_input.lower(), 75.0)
        else:
            maturity = float(maturity_input)
            
        damage = float(p["damage"])

        temperature = get_temp(district)
        if temperature is None:
            return jsonify({"error": "Unable to fetch valid temperature"}), 400

        row = [district, variety, color, texture, maturity, damage, temperature]
        df = pd.DataFrame([row], columns=FEATURES)

        for feat in CAT:
            le = encoders[feat]
            val = df.at[0, feat]
            if val not in le.classes_:
                le.classes_ = np.append(le.classes_, val)
            df[feat] = le.transform(df[feat].astype(str))

        df[NUM] = df[NUM].astype(float)

        pred_value = int(model.predict(df)[0])
        proba = model.predict_proba(df)[0]

        classes = list(model.classes_)
        idx = classes.index(pred_value)

        confidence = f"{round(proba[idx] * 100, 2)}%"
        pred_label = grade_map.get(str(pred_value), "Unknown")

        shap_values = explainer.shap_values(df)

        if isinstance(shap_values, list):
            shap_vals = shap_values[idx][0]
        else:
            shap_vals = shap_values[0]

        shap_vals = np.array(shap_vals).reshape(-1).tolist()

        explanation = friendly(pred_label, shap_vals)


        return jsonify({
            "prediction_label": pred_label,
            "prediction_confidence_percent": confidence,
            "temperature_used": temperature,
            "farmer_friendly_explanation": explanation
        })

    except Exception as e:
        return jsonify({
            "error": str(e),
            "trace": traceback.format_exc()
        }), 500

# ================= MAIN =================
if __name__ == "__main__":
    app.run(debug=True)
