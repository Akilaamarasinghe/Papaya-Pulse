from flask import Flask, request, jsonify
from flask_cors import CORS
import pickle
import numpy as np
import pandas as pd
from datetime import datetime
import shap
import os
import sys
import traceback

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from weather_pipeline import get_weather_features

app = Flask(__name__)
CORS(app)

# ======================================================
# LOAD MODELS & ARTIFACTS
# ======================================================
with open("models/yield_model.pkl", "rb") as f:
    yield_model = pickle.load(f)

with open("models/harvest_model.pkl", "rb") as f:
    harvest_model = pickle.load(f)

with open("models/scaler.pkl", "rb") as f:
    scaler = pickle.load(f)

with open("models/feature_names.pkl", "rb") as f:
    feature_names = pickle.load(f)

with open("models/shap_yield.pkl", "rb") as f:
    shap_yield = pickle.load(f)

with open("models/shap_harvest.pkl", "rb") as f:
    shap_harvest = pickle.load(f)

# ======================================================
# NORMALIZATION MAPS (CRITICAL)
# ======================================================
WATERING_FREQ_MAP = {
    "1/day": 7, "2/day": 14, "3/day": 21,
    "every 2 days": 3.5,
    "2/week": 2, "3/week": 3,
    "4/week": 4, "5/week": 5,
    "daily": 7
}

MONTH_MAP = {
    "january": 1, "february": 2, "march": 3, "april": 4,
    "may": 5, "june": 6, "july": 7, "august": 8,
    "september": 9, "october": 10, "november": 11, "december": 12
}

SOIL_MAP = {
    "loam": "loam",
    "sandy loam": "sandy_loam",
    "laterite": "laterite_soils",
    "laterite soil": "laterite_soils",
    "laterite soils": "laterite_soils"
}

DISTRICT_MAP = {
    "matara": "Matara",
    "hambantota": "Hambantota",
    "galle": "Galle"
}

WATERING_METHOD_MAP = {
    "drip": "Drip",
    "manual": "Manual",
    "sprinkler": "Sprinkler"
}

# ======================================================
# HELPERS
# ======================================================
def parse_month(value):
    if isinstance(value, str):
        key = value.strip().lower()
        if key in MONTH_MAP:
            return MONTH_MAP[key]
        raise ValueError("Invalid plant_month string")
    value = int(value)
    if not 1 <= value <= 12:
        raise ValueError("plant_month must be 1–12")
    return value

def remaining_days(total_days, plant_month):
    """
    Calculate remaining days until harvest based on planting month.
    Assumes planting happened on the 1st of the given month.
    """
    now = datetime.utcnow()
    current_year = now.year
    
    # Create planting date (1st of the plant_month)
    planted = datetime(current_year, plant_month, 1)
    
    # If planting month is in the future, it was last year
    if planted > now:
        planted = datetime(current_year - 1, plant_month, 1)
    
    # Calculate days passed since planting
    passed = (now - planted).days
    
    # Calculate remaining days (ensure non-negative)
    remaining = max(0, int(total_days - passed))
    
    return remaining, passed

def build_features(data, weather):
    f = {}

    f["watering_freq_num"] = WATERING_FREQ_MAP.get(
        str(data["watering_frequency"]).lower(), 7
    )

    f["plant_month_num"] = parse_month(data["plant_month"])
    f["trees_count"] = int(data["trees_count"])
    f["avg_temp"] = float(weather["avg_temp"])
    f["total_rain"] = float(weather["total_rain"])
    f["rainy_days"] = int(weather["rainy_days"])

    f["rain_intensity"] = f["total_rain"] / (f["rainy_days"] + 1)
    f["temp_stress"] = abs(f["avg_temp"] - 28)
    f["rain_per_tree"] = f["total_rain"] / (f["trees_count"] + 1)
    f["is_monsoon"] = int(f["plant_month_num"] in [5,6,7,8,9])
    f["is_dry"] = int(f["plant_month_num"] in [1,2,3,12])
    f["temp_rain_synergy"] = np.log1p(f["avg_temp"]) * np.log1p(f["total_rain"])

    df = pd.DataFrame([f])

    # ---- SAFE ONE-HOT ENCODING ----
    soil = SOIL_MAP.get(str(data["soil_type"]).lower().strip())
    district = DISTRICT_MAP.get(str(data["district"]).lower().strip())
    method = WATERING_METHOD_MAP.get(str(data["watering_method"]).lower().strip())

    if soil:
        col = f"soil_type_{soil}"
        if col in feature_names:
            df[col] = 1

    if district:
        col = f"district_{district}"
        if col in feature_names:
            df[col] = 1

    if method:
        col = f"watering_method_{method}"
        if col in feature_names:
            df[col] = 1

    for col in feature_names:
        if col not in df:
            df[col] = 0

    return df[feature_names]

def shap_top_features(explainer, X_scaled):
    sv = explainer(X_scaled)
    vals = sv.values[0]
    ranked = sorted(
        zip(feature_names, vals),
        key=lambda x: abs(x[1]),
        reverse=True
    )
    return [(r[0].replace("_", " "), r[1]) for r in ranked[:3]]

def get_month_name(month_num):
    months = ["January", "February", "March", "April", "May", "June",
              "July", "August", "September", "October", "November", "December"]
    return months[month_num - 1]

def build_farmer_explanation(
    yield_pred,
    harvest_total,
    weather,
    plant_month,
    shap_yield_factors,
    shap_harvest_factors,
    soil_type=None
):
    explanation = []

    avg_temp = float(weather.get("avg_temp", 0))
    total_rain = float(weather.get("total_rain", 0))
    rainy_days = int(weather.get("rainy_days", 0))

    month_name = get_month_name(plant_month)

    def effective_rainfall(rain, soil):
        if soil == "sandy_loam":
            return rain * 0.9
        if soil in ["clay", "laterite_soils"]:
            return rain * 1.15
        return rain

    def rainfall_status(rain_eff):
        if rain_eff < 80:
            return "low"
        elif 80 <= rain_eff <= 170:
            return "ideal"
        return "excess"

    rain_eff = effective_rainfall(total_rain, soil_type)
    rain_state = rainfall_status(rain_eff)
    rain_intensity = total_rain / (rainy_days + 1)

    explanation.append(
        f"Your papaya trees are expected to produce about {yield_pred:.1f} kg per tree."
    )
    explanation.append("Here is why:")

    used_topics = set()

    for feature, impact in shap_yield_factors:
        f = feature.lower()

        if "rain" in f and "rain" not in used_topics:
            if rain_state == "ideal":
                explanation.append(
                    f"- Rainfall ({total_rain:.1f} mm) was within the ideal range for papaya and supported healthy growth."
                )
            elif rain_state == "low":
                explanation.append(
                    f"- Rainfall ({total_rain:.1f} mm) was slightly low, increasing dependence on irrigation."
                )
            else:
                explanation.append(
                    f"- Rainfall ({total_rain:.1f} mm) was higher than ideal, which may have caused temporary root stress."
                )

            if rain_intensity > 20:
                explanation.append(
                    "- Rainfall occurred in short, heavy periods, reducing soil oxygen availability."
                )

            used_topics.add("rain")

        elif "temp" in f and "temp" not in used_topics:
            if avg_temp < 24:
                explanation.append(
                    f"- Cooler temperatures ({avg_temp:.1f} celsius) slowed plant metabolism slightly."
                )
            elif avg_temp > 32:
                explanation.append(
                    f"- Higher temperatures ({avg_temp:.1f} celsius) increased heat stress on plants."
                )
            else:
                explanation.append(
                    f"- Temperature conditions ({avg_temp:.1f} celsius) were favorable for fruit development."
                )
            used_topics.add("temp")

        elif "plant_month" in f and "month" not in used_topics:
            explanation.append(
                f"- Planting in {month_name} influenced growth due to seasonal climate patterns."
            )
            used_topics.add("month")

        elif "watering" in f and "watering" not in used_topics:
            explanation.append(
                "- The watering method and frequency played a role in maintaining soil moisture balance."
            )
            used_topics.add("watering")

        elif "trees" in f and "trees" not in used_topics:
            explanation.append(
                "- The number of trees affected nutrient competition and overall yield per tree."
            )
            used_topics.add("trees")

        if len(used_topics) >= 3:
            break

    explanation.append("")

    explanation.append(
        f"The estimated harvest time is around {int(harvest_total)} days."
    )
    explanation.append("Why harvest takes this long:")

    explanation.append(
        f"- Temperature ({avg_temp:.1f} celsius) controls how fast fruits mature."
    )

    explanation.append(
        f"- Rainfall ({total_rain:.1f} mm) affects flowering consistency and fruit setting."
    )

    explanation.append(
        f"- Planting month ({month_name}) determines exposure to monsoon and dry periods."
    )

    return explanation

# ======================================================
# API ENDPOINT
# ======================================================
@app.route("/growth_predict", methods=["POST"])
def predict():
    try:
        data = request.get_json()
        
        print(f"Received request data: {data}")  # Debug logging

        required = [
            "district", "soil_type", "watering_method",
            "watering_frequency", "trees_count", "plant_month"
        ]
        for r in required:
            if r not in data:
                return jsonify({"error": f"Missing field: {r}"}), 400

        plant_month = parse_month(data["plant_month"])

        try:
            weather = get_weather_features(data["district"], plant_month)
            weather = {
                "avg_temp": float(weather["avg_temp"]),
                "total_rain": float(weather["total_rain"]),
                "rainy_days": int(weather["rainy_days"])
            }
        except Exception as weather_error:
            print(f"Weather data error: {str(weather_error)}")
            # Use default weather values for Sri Lankan papaya growing regions
            weather = {
                "avg_temp": 27.0,
                "total_rain": 150.0,
                "rainy_days": 12
            }
            print(f"Using default weather values: {weather}")

        X = build_features(data, weather)
        X_scaled = scaler.transform(X)

        yield_pred = float(yield_model.predict(X_scaled)[0])
        harvest_total = float(harvest_model.predict(X_scaled)[0])

        remaining, passed = remaining_days(harvest_total, plant_month)
        total_yield = yield_pred * int(data["trees_count"])

        # Get SHAP explanations
        yield_factors = shap_top_features(shap_yield, X_scaled)
        harvest_factors = shap_top_features(shap_harvest, X_scaled)

        # Build dynamic farmer explanation
        farmer_explanation = build_farmer_explanation(
            yield_pred, harvest_total, weather, plant_month,
            yield_factors, harvest_factors
        )
        
        result = {
            "farmer_explanation": farmer_explanation,
            "predictions": {
                "yield_per_tree": round(yield_pred, 2),
                "harvest_days_total": int(harvest_total),
                "harvest_days_remaining": remaining,
                "days_since_planting": passed
            }
        }
        
        print(f"Sending response: {result}")
        print(f"Debug - Total: {int(harvest_total)}, Passed: {passed}, Remaining: {remaining}")

        return jsonify(result)

    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Prediction error: {str(e)}")
        print(f"Full traceback:\n{error_trace}")
        return jsonify({
            "error": str(e),
            "message": "Unable to generate prediction. Please check your input data.",
            "details": error_trace if app.debug else None
        }), 500

# ======================================================
if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0", port=5000)
