"""
Quick smoke-test for fertilizer_model_v2.pkl and weather_risk_model.pkl.
Run from the papaya-leaf-disease-ml-part directory:
    python _test_models.py
"""
import os, sys, json, warnings
warnings.filterwarnings("ignore")
sys.path.insert(0, os.path.dirname(__file__))

import joblib
import pandas as pd

BASE = os.path.dirname(os.path.abspath(__file__))

# ── 1. Fertilizer model ──────────────────────────────────────────────────────
print("=" * 60)
print("1. FERTILIZER MODEL  (ML/fertilizer_model_v2.pkl)")
print("=" * 60)

fert_path = os.path.join(BASE, "ML", "fertilizer_model_v2.pkl")
if not os.path.exists(fert_path):
    print("  ERROR: file not found:", fert_path)
else:
    fert = joblib.load(fert_path)
    print(f"  Loaded OK  model type: {type(fert).__name__}")
    if hasattr(fert, 'classes_'):
        print(f"  Classes: {list(fert.classes_)}")

    test_cases = [
        {"disease": "anthracnose", "severity": "mild",     "growth_stage": "vegetative", "soil_type": "sandy_loam"},
        {"disease": "anthracnose", "severity": "moderate", "growth_stage": "flowering",  "soil_type": "sandy_loam"},
        {"disease": "anthracnose", "severity": "severe",   "growth_stage": "fruiting",   "soil_type": "clay_loam"},
        {"disease": "leaf_curl",   "severity": "moderate", "growth_stage": "flowering",  "soil_type": "sandy_loam"},
        {"disease": "mites",       "severity": "mild",     "growth_stage": "vegetative", "soil_type": "red_laterite"},
        {"disease": "mites",       "severity": "severe",   "growth_stage": "bearing",    "soil_type": "sandy_loam"},
        {"disease": "mosaic",      "severity": "moderate", "growth_stage": "flowering",  "soil_type": "sandy_loam"},
        {"disease": "mosaic",      "severity": "severe",   "growth_stage": "fruiting",   "soil_type": "clay_loam"},
    ]

    print()
    print(f"  {'Disease':<15} {'Severity':<10} {'Stage':<14} {'Soil':<14} => Prediction (conf)")
    print(f"  {'-'*70}")
    for tc in test_cases:
        df   = pd.DataFrame([tc])
        pred = fert.predict(df)[0]
        conf = float(fert.predict_proba(df)[0].max())
        print(f"  {tc['disease']:<15} {tc['severity']:<10} {tc['growth_stage']:<14} {tc['soil_type']:<14} => {pred}  (conf={conf:.2f})")

# ── 2. Weather risk model ────────────────────────────────────────────────────
print()
print("=" * 60)
print("2. WEATHER RISK MODEL  (weather/weather_risk_model.pkl)")
print("=" * 60)

risk_path = os.path.join(BASE, "weather", "weather_risk_model.pkl")
if not os.path.exists(risk_path):
    print("  ERROR: file not found:", risk_path)
else:
    risk_model = joblib.load(risk_path)
    print(f"  Loaded OK  model type: {type(risk_model).__name__}")

    # Check meta
    meta_path = os.path.join(BASE, "weather", "weather_risk_model_meta.json")
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)
        print(f"  Meta: {json.dumps(meta, indent=4)}")

# ── 3. Full recommend pipeline (no Flask) ───────────────────────────────────
print()
print("=" * 60)
print("3. FULL RECOMMEND PIPELINE (crop_advisor.get_crop_advice)")
print("=" * 60)

# Load .env token
try:
    from dotenv import load_dotenv
    load_dotenv(os.path.join(BASE, ".env"))
    print(f"  .env loaded  GITHUB_TOKEN set: {bool(os.environ.get('GITHUB_TOKEN'))}")
except ImportError:
    print("  python-dotenv not installed – reading env directly")

from crop_advisor import get_crop_advice, FERT_LABEL_EN

result = get_crop_advice(
    disease           = "anthracnose",
    severity          = "moderate",
    growth_stage      = "flowering",
    fertilizer_action = "REDUCE_N_INCREASE_K",
    prevention_pack   = "MANCOZEB_75WP|SANITATION_PRUNE|DRAINAGE_MOISTURE_CONTROL|IPM_WARNING",
    weather_risk      = "HIGH",
    district          = "galle",
)

print()
print(f"  ai_enriched      : {result['ai_enriched']}")
print(f"  confidence       : {result.get('confidence')}")
print(f"  fertilizer_en    : {result['fertilizer_en'][:90]}...")
print(f"  prevention count : {len(result['prevention_en'])}")
print(f"  advice_en        : {result['advice_en'][:200]}...")
print(f"  advice_si        : {result['advice_si'][:120]}...")
print(f"  urgent_action_en : {result.get('urgent_action_en','')[:100]}...")
print(f"  Keys             : {list(result.keys())}")

# ── 4. /recommend endpoint simulation ───────────────────────────────────────
print()
print("=" * 60)
print("4. POSTMAN-READY SAMPLE PAYLOADS for POST http://localhost:5005/recommend")
print("=" * 60)

samples = [
    {"disease": "anthracnose", "severity": "mild",     "growth_stage": "vegetative",  "soil_type": "sandy_loam",   "district": "galle",       "include_ai_advice": True},
    {"disease": "anthracnose", "severity": "moderate", "growth_stage": "flowering",   "soil_type": "sandy_loam",   "district": "galle",       "include_ai_advice": True},
    {"disease": "anthracnose", "severity": "severe",   "growth_stage": "fruiting",    "soil_type": "clay_loam",    "district": "matara",      "include_ai_advice": True},
    {"disease": "leaf_curl",   "severity": "moderate", "growth_stage": "flowering",   "soil_type": "sandy_loam",   "district": "galle",       "include_ai_advice": True},
    {"disease": "mites",       "severity": "mild",     "growth_stage": "vegetative",  "soil_type": "red_laterite", "district": "hambantota",  "include_ai_advice": True},
    {"disease": "mosaic",      "severity": "severe",   "growth_stage": "fruiting",    "soil_type": "clay_loam",    "district": "matara",      "include_ai_advice": False},
]
for i, s in enumerate(samples, 1):
    print(f"\n  Sample {i}:")
    print(f"    {json.dumps(s)}")

print()
print("  Also test /health  (GET http://localhost:5005/health)")

print()
print("=" * 60)
print("ALL TESTS COMPLETE")
print("=" * 60)
