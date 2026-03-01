import os
import sys
import json
import joblib
import warnings
import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.nn.functional as F
from flask import Flask, request, jsonify
from PIL import Image
from torchvision import transforms
from transformers import ViTForImageClassification

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Path setup – allow importing from sub-folders
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, BASE_DIR)

# Load .env if present (local development)
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(BASE_DIR, ".env"))
except ImportError:
    pass

app = Flask(__name__)
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# ---------------------------------------------------------------------------
# Lazy-load fertilizer model
# (weather_risk_model is loaded inside risk_engine_v2 — no duplication here)
# ---------------------------------------------------------------------------
_fert_model = None

def _get_fert_model():
    global _fert_model
    if _fert_model is not None:
        return _fert_model
    path = os.path.join(BASE_DIR, "ML", "fertilizer_model_v2.pkl")
    if os.path.exists(path):
        _fert_model = joblib.load(path)
    return _fert_model

# ---------------------------------------------------------------------------
# Prevention knowledge base (used when model not available)
# ---------------------------------------------------------------------------
from crop_advisor import (
    PREV_ITEM_EN, PREV_ITEM_SI,
    FERT_LABEL_EN, FERT_LABEL_SI,
    get_crop_advice,
)
from weather.weather_client import get_7day_weather
from weather.risk_engine_v2 import compute_weather_risk_v2
from weather.sri_lanka_regions import (
    get_lat_lon_from_district, get_district_info,
    validate_district, SUPPORTED_DISTRICTS
)

# Static prevention packs per (disease, severity)
_PREVENTION_PACKS = {
    ("anthracnose", "mild"):     "MANCOZEB_75WP|NEEM_OIL_SPRAY|SANITATION_PRUNE|DRAINAGE_MOISTURE_CONTROL|PREVENTIVE_SPRAY_SCHEDULE|IPM_WARNING",
    ("anthracnose", "moderate"): "MANCOZEB_75WP|CHLOROTHALONIL_SPRAY|SANITATION_PRUNE|DRAINAGE_MOISTURE_CONTROL|TRICHODERMA_APPLICATION|FRUIT_BAGGING|MONITOR_CLOSELY_3DAYS|IPM_WARNING",
    ("anthracnose", "severe"):   "MANCOZEB_75WP|CHLOROTHALONIL_SPRAY|SANITATION_PRUNE|DRAINAGE_MOISTURE_CONTROL|TRICHODERMA_APPLICATION|FRUIT_BAGGING|INCREASE_SPRAY_FREQUENCY|CONSULT_EXTENSION_OFFICER|IPM_WARNING",
    ("mosaic", "mild"):          "VECTOR_CONTROL_MINERAL_OIL|REFLECTIVE_MULCH|WEED_MANAGEMENT|SANITATION_PRUNE|PREVENTIVE_SPRAY_SCHEDULE|IPM_WARNING",
    ("mosaic", "moderate"):      "VECTOR_CONTROL_MINERAL_OIL|REMOVE_INFECTED_PLANTS|REFLECTIVE_MULCH|APHID_CONTROL_DIMETHOATE|WEED_MANAGEMENT|MONITOR_CLOSELY_3DAYS|IPM_WARNING",
    ("mosaic", "severe"):        "REMOVE_INFECTED_PLANTS|VECTOR_CONTROL_MINERAL_OIL|APHID_CONTROL_DIMETHOATE|REFLECTIVE_MULCH|WEED_MANAGEMENT|CONSULT_EXTENSION_OFFICER|IPM_WARNING",
    ("mites", "mild"):           "NEEM_OIL_SPRAY|SULPHUR_DUST_APPLICATION|WATER_SPRAY_TO_DISLODGE|PREVENTIVE_SPRAY_SCHEDULE|IPM_WARNING",
    ("mites", "moderate"):       "ABAMECTIN_1.8EC|NEEM_OIL_SPRAY|SULPHUR_DUST_APPLICATION|WATER_SPRAY_TO_DISLODGE|REMOVE_HEAVILY_INFESTED_LEAVES|MONITOR_CLOSELY_3DAYS|IPM_WARNING",
    ("mites", "severe"):         "ABAMECTIN_1.8EC|PROPARGITE_SPRAY|REMOVE_HEAVILY_INFESTED_LEAVES|INCREASE_SPRAY_FREQUENCY|CONSULT_EXTENSION_OFFICER|IPM_WARNING",
    ("leaf_curl", "mild"):       "THRIPS_CONTROL_SPINOSAD|VECTOR_CONTROL_MINERAL_OIL|REFLECTIVE_MULCH|WEED_MANAGEMENT|SANITATION_PRUNE|PREVENTIVE_SPRAY_SCHEDULE|IPM_WARNING",
    ("leaf_curl", "moderate"):   "THRIPS_CONTROL_SPINOSAD|WHITEFLY_CONTROL_IMIDACLOPRID|REMOVE_INFECTED_PLANTS|REFLECTIVE_MULCH|WEED_MANAGEMENT|SANITATION_PRUNE|MONITOR_CLOSELY_3DAYS|IPM_WARNING",
    ("leaf_curl", "severe"):     "THRIPS_CONTROL_SPINOSAD|WHITEFLY_CONTROL_IMIDACLOPRID|REMOVE_INFECTED_PLANTS|REFLECTIVE_MULCH|WEED_MANAGEMENT|CONSULT_EXTENSION_OFFICER|INCREASE_SPRAY_FREQUENCY|IPM_WARNING",
}

def _get_prevention_pack(disease: str, severity: str) -> str:
    key = (disease.lower().replace(" ", "_").replace("-", "_"), severity.lower())
    return _PREVENTION_PACKS.get(key, "SANITATION_PRUNE|IPM_WARNING|MONITOR_CLOSELY_3DAYS")

def _normalize_disease(name: str) -> str:
    d = name.strip().lower().replace(" ", "_").replace("-", "_")
    mapping = {"curl": "leaf_curl", "anthracnose": "anthracnose",
               "mite_disease": "mites", "mite": "mites",
               "mosaic_virus": "mosaic", "mosaic": "mosaic",
               "leaf_curl": "leaf_curl"}
    return mapping.get(d, d)

class ViTWrapper(nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model 
    def forward(self, x):
        return self.model(x).logits 

def load_vit_model(path):
    saved = torch.load(path, map_location=device) 
    classes = saved["classes"] 

    base_model = ViTForImageClassification.from_pretrained(
        "google/vit-base-patch16-224",
        num_labels=len(classes),
        ignore_mismatched_sizes=True
    ).to(device) 

    base_model.load_state_dict(saved["state_dict"], strict=False)
    base_model.eval()
    return ViTWrapper(base_model), classes

leaf_model, leaf_classes = load_vit_model("models/leaf/leaf_detector.pth") 
disease_model, disease_classes = load_vit_model("models/disease/disease_classifier.pth") 

def load_stage_model(disease):
    saved = torch.load(f"models/stages/{disease}_stage.pth", map_location=device)
    classes = saved["classes"]

    base_model = ViTForImageClassification.from_pretrained(
        "google/vit-base-patch16-224",
        num_labels=len(classes),
        ignore_mismatched_sizes=True
    ).to(device)

    base_model.load_state_dict(saved["state_dict"], strict=False)
    base_model.eval()
    return ViTWrapper(base_model), classes

image_tf = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485,0.456,0.406],[0.229,0.224,0.225])
])

def predict_pipeline(img):
    tensor = image_tf(img).to(device)

    with torch.no_grad():
        out = leaf_model(tensor.unsqueeze(0))
        probs = F.softmax(out, dim=1)[0].cpu().numpy()

    leaf_prob = float(probs[leaf_classes.index("leaf")])
    not_leaf_prob = float(probs[leaf_classes.index("not_leaf")])

    is_leaf = leaf_prob >= 0.5

    result = {
        "is_leaf": is_leaf,
        "leaf_prob": f"{leaf_prob * 100:.2f}%",
        "not_leaf_prob": f"{not_leaf_prob * 100:.2f}%"
    }

    if not is_leaf:
        result["message"] = "Not a papaya leaf"
        return result

    with torch.no_grad():
        out = disease_model(tensor.unsqueeze(0))
        probs = F.softmax(out, dim=1)[0].cpu().numpy()

    disease_idx = int(np.argmax(probs))
    disease_name = disease_classes[disease_idx]

    result["disease"] = disease_name
    result["disease_prob"] = f"{float(probs[disease_idx]) * 100:.2f}%"

    stage_model, stage_classes = load_stage_model(disease_name)

    with torch.no_grad():
        out = stage_model(tensor.unsqueeze(0))
        probs = F.softmax(out, dim=1)[0].cpu().numpy()

    stage_idx = int(np.argmax(probs))
    stage_name = stage_classes[stage_idx]

    result["stage"] = stage_name
    result["stage_prob"] = f"{float(probs[stage_idx]) * 100:.2f}%"
    return result

@app.route("/predict", methods=["POST"])
def predict():
    if "image" not in request.files:
        return jsonify({"error": "Image missing"}), 400
    img = Image.open(request.files["image"].stream).convert("RGB")
    return jsonify(predict_pipeline(img))


# ===========================================================================
# POST /recommend
# ===========================================================================
# Body (JSON):
#   disease       : "anthracnose" | "mosaic" | "mites" | "leaf_curl"
#   severity      : "mild" | "moderate" | "severe"
#   growth_stage  : "vegetative" | "flowering" | "bearing"
#   soil_type     : "sandy_loam" | "clay_loam" | "red_laterite"   (optional)
#   district      : "galle" | "matara" | "hambantota"  (Southern Province only)
#   include_ai_advice: true/false (optional, default true)
# ===========================================================================
@app.route("/recommend", methods=["POST"])
def recommend():
    body = request.get_json(force=True, silent=True) or {}

    disease        = _normalize_disease(body.get("disease", ""))
    severity       = body.get("severity", "moderate").lower().strip()
    growth_stage   = body.get("growth_stage", "vegetative").lower().strip()
    soil_type      = body.get("soil_type", "sandy_loam").lower().strip()
    district       = body.get("district", None)
    use_ai_advice  = body.get("include_ai_advice", True)

    if not disease:
        return jsonify({"error": "disease is required"}), 400
    if severity not in ("mild", "moderate", "severe"):
        return jsonify({"error": "severity must be mild|moderate|severe"}), 400

    # Southern Province district validation
    if district:
        is_valid_district, district = validate_district(district)
        if not is_valid_district:
            return jsonify({
                "error": "This system supports Southern Province only.",
                "error_si": "මෙම පද්ධතිය දකුණු පළාතට පමණක් සහාය දක්වයි.",
                "supported_districts": SUPPORTED_DISTRICTS,
                "supported_districts_si": ["ගාල්ල", "මාතර", "හම්බන්තොට"],
            }), 400

    # ---- Fertilizer recommendation ----------------------------------------
    fert_model = _get_fert_model()
    if fert_model is not None:
        try:
            inp = pd.DataFrame([{
                "disease":      disease,
                "severity":     severity,
                "growth_stage": growth_stage,
                "soil_type":    soil_type,
            }])
            fertilizer_action = fert_model.predict(inp)[0]
            fert_conf         = float(fert_model.predict_proba(inp)[0].max())
        except Exception as e:
            fertilizer_action = "BALANCED_NPK"
            fert_conf = 0.5
    else:
        # Static fallback
        _static = {
            "severe":   "SKIP_FERTILIZER_TREAT_FIRST",
            "moderate": "REDUCE_N_INCREASE_K",
            "mild":     "BALANCED_NPK_PLUS_ORGANIC",
        }
        fertilizer_action = _static.get(severity, "BALANCED_NPK")
        fert_conf = 0.6

    # ---- Prevention pack ---------------------------------------------------
    prevention_pack = _get_prevention_pack(disease, severity)
    prev_items      = prevention_pack.split("|")

    # ---- Weather risk (if district provided) -------------------------------
    weather_risk_data = None
    forecast_days     = []
    risk_level        = "MEDIUM"

    if district:
        dist_info = get_district_info(district)
        coords    = (dist_info["lat"], dist_info["lon"]) if dist_info["lat"] else None

        if coords:
            try:
                forecast_days = get_7day_weather(coords[0], coords[1])
                weather_risk_data = compute_weather_risk_v2(
                    disease, severity, forecast_days
                )
                risk_level = weather_risk_data.get("risk_level", "MEDIUM")
            except Exception as e:
                weather_risk_data = {"error": str(e), "risk_level": "MEDIUM"}

    # ---- AI advice enrichment ---------------------------------------------
    advisor_data = {}
    if use_ai_advice:
        try:
            advisor_data = get_crop_advice(
                disease=disease,
                severity=severity,
                growth_stage=growth_stage,
                fertilizer_action=fertilizer_action,
                prevention_pack=prevention_pack,
                weather_risk=risk_level,
                district=district,
            )
        except Exception as e:
            advisor_data = {"error": str(e), "ai_enriched": False}

    # ---- Build response ----------------------------------------------------
    resp = {
        "disease":          disease,
        "severity":         severity,
        "growth_stage":     growth_stage,
        "soil_type":        soil_type,
        "fertilizer": {
            "action":       fertilizer_action,
            "confidence":   round(fert_conf, 3),
            "advice_en":    FERT_LABEL_EN.get(fertilizer_action, fertilizer_action),
            "advice_si":    FERT_LABEL_SI.get(fertilizer_action, fertilizer_action),
        },
        "prevention": {
            "pack":         prev_items,
            "steps_en":     [PREV_ITEM_EN.get(p, p) for p in prev_items],
            "steps_si":     [PREV_ITEM_SI.get(p, p) for p in prev_items],
        },
        "weather_risk":     weather_risk_data,
    }

    if advisor_data:
        resp["ai_advice"] = {
            "advice_en":        advisor_data.get("advice_en", ""),
            "advice_si":        advisor_data.get("advice_si", ""),
            "outlook_en":       advisor_data.get("outlook_en", ""),
            "outlook_si":       advisor_data.get("outlook_si", ""),
            "urgent_action_en": advisor_data.get("urgent_action_en", ""),
            "urgent_action_si": advisor_data.get("urgent_action_si", ""),
            "confidence":       advisor_data.get("confidence", 0.75),
            "ai_enriched":      advisor_data.get("ai_enriched", False),
        }

    return jsonify(resp)


# ===========================================================================
# POST /full-analysis
# ===========================================================================
# Run image prediction + recommendation + weather risk in one call.
# FormData:
#   image         : (file)
#   growth_stage      : vegetative | flowering | bearing
#   soil_type         : sandy_loam | clay_loam | red_laterite  (optional)
#   district          : galle | matara | hambantota  (Southern Province only)
#   include_ai_advice : true | false (optional)
# ===========================================================================
@app.route("/full-analysis", methods=["POST"])
def full_analysis():
    if "image" not in request.files:
        return jsonify({"error": "Image missing"}), 400

    growth_stage  = request.form.get("growth_stage",    "vegetative").lower().strip()
    soil_type     = request.form.get("soil_type",       "sandy_loam").lower().strip()
    district_raw  = request.form.get("district",        None)
    use_ai_advice = request.form.get("include_ai_advice", "true").lower() != "false"

    # Southern Province district validation
    district = None
    if district_raw:
        is_valid_district, district = validate_district(district_raw)
        if not is_valid_district:
            return jsonify({
                "error": "This system supports Southern Province only.",
                "error_si": "මෙම පද්ධතිය දකුණු පළාතට පමණක් සහාය දක්වයි.",
                "supported_districts": SUPPORTED_DISTRICTS,
                "supported_districts_si": ["ගාල්ල", "මාතර", "හම්බන්තොට"],
            }), 400

    img        = Image.open(request.files["image"].stream).convert("RGB")
    prediction = predict_pipeline(img)

    if not prediction.get("is_leaf", False):
        return jsonify({
            "is_leaf": False,
            "message": "Not a papaya leaf / Image not recognized as papaya.",
            "message_si": "පළතුරු කොළය හඳුනා ගැනීමට නොහැකිය.",
            "prediction": prediction,
        })

    raw_disease = prediction.get("disease", "healthy")
    if raw_disease.lower() in ("healthy", "none", ""):
        return jsonify({
            "is_leaf": True,
            "disease": "healthy",
            "disease_si": "සෞඛ්‍ය සම්පන්නයි",
            "message": "No disease detected. Your plant appears healthy!",
            "message_si": "රෝගයක් හඳුනා නොගිය. ඔබේ ශාකය සෞඛ්‍ය සම්පන්නයි!",
            "prediction": prediction,
        })

    disease  = _normalize_disease(raw_disease)
    severity = prediction.get("stage", "moderate").lower().strip()
    if severity not in ("mild", "moderate", "severe"):
        # map stage labels to severity
        _s = severity
        if any(w in _s for w in ["early", "stage_1", "stage 1", "initial"]):
            severity = "mild"
        elif any(w in _s for w in ["late", "stage_3", "stage 3", "advanced"]):
            severity = "severe"
        else:
            severity = "moderate"

    # Fertilizer model
    fert_model = _get_fert_model()
    if fert_model is not None:
        try:
            inp = pd.DataFrame([{"disease": disease, "severity": severity,
                                  "growth_stage": growth_stage, "soil_type": soil_type}])
            fertilizer_action = fert_model.predict(inp)[0]
            fert_conf = float(fert_model.predict_proba(inp)[0].max())
        except Exception:
            fertilizer_action = "BALANCED_NPK"
            fert_conf = 0.5
    else:
        fertilizer_action = {"severe": "SKIP_FERTILIZER_TREAT_FIRST",
                              "moderate": "REDUCE_N_INCREASE_K"}.get(severity, "BALANCED_NPK")
        fert_conf = 0.6

    prevention_pack = _get_prevention_pack(disease, severity)
    prev_items      = prevention_pack.split("|")

    # Weather risk
    weather_risk_data = None
    forecast_days     = []
    risk_level        = "MEDIUM"

    if district:
        dist_info = get_district_info(district)
        coords    = (dist_info["lat"], dist_info["lon"]) if dist_info["lat"] else None
        if coords:
            try:
                forecast_days     = get_7day_weather(coords[0], coords[1])
                weather_risk_data = compute_weather_risk_v2(disease, severity, forecast_days)
                risk_level        = weather_risk_data.get("risk_level", "MEDIUM")
            except Exception as e:
                weather_risk_data = {"error": str(e), "risk_level": "MEDIUM"}

    # AI advice enrichment
    advisor_data = {}
    if use_ai_advice:
        try:
            advisor_data = get_crop_advice(
                disease=disease, severity=severity,
                growth_stage=growth_stage, fertilizer_action=fertilizer_action,
                prevention_pack=prevention_pack, weather_risk=risk_level,
                district=district,
            )
        except Exception as e:
            advisor_data = {"error": str(e), "ai_enriched": False}

    return jsonify({
        "is_leaf":          True,
        "prediction": {
            "disease":            prediction.get("disease"),
            "disease_confidence": prediction.get("disease_prob"),
            "severity":           severity,
            "severity_confidence":prediction.get("stage_prob"),
            "leaf_confidence":    prediction.get("leaf_prob"),
        },
        "disease_normalized": disease,
        "severity":           severity,
        "growth_stage":       growth_stage,
        "soil_type":          soil_type,
        "fertilizer": {
            "action":     fertilizer_action,
            "confidence": round(fert_conf, 3),
            "advice_en":  FERT_LABEL_EN.get(fertilizer_action, fertilizer_action),
            "advice_si":  FERT_LABEL_SI.get(fertilizer_action, fertilizer_action),
        },
        "prevention": {
            "pack":       prev_items,
            "steps_en":   [PREV_ITEM_EN.get(p, p) for p in prev_items],
            "steps_si":   [PREV_ITEM_SI.get(p, p) for p in prev_items],
        },
        "weather_risk":     weather_risk_data,
        "ai_advice": {
            "advice_en":        advisor_data.get("advice_en", ""),
            "advice_si":        advisor_data.get("advice_si", ""),
            "outlook_en":       advisor_data.get("outlook_en", ""),
            "outlook_si":       advisor_data.get("outlook_si", ""),
            "urgent_action_en": advisor_data.get("urgent_action_en", ""),
            "urgent_action_si": advisor_data.get("urgent_action_si", ""),
            "confidence":       advisor_data.get("confidence", 0.75),
            "ai_enriched":      advisor_data.get("ai_enriched", False),
        } if advisor_data else None,
    })


# ===========================================================================
# GET /health
# ===========================================================================
@app.route("/health", methods=["GET"])
def health():
    fert_ok    = os.path.exists(os.path.join(BASE_DIR, "ML", "fertilizer_model_v2.pkl"))
    risk_ok    = os.path.exists(os.path.join(BASE_DIR, "weather", "weather_risk_model.pkl"))
    advisor_ok = bool(os.environ.get("GITHUB_TOKEN"))
    return jsonify({
        "status":               "running",
        "fertilizer_model_v2":  fert_ok,
        "weather_risk_model":   risk_ok,
        "ai_advisor_ready":     advisor_ok,
        "device":               str(device),
    })

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5005, debug=True) 
