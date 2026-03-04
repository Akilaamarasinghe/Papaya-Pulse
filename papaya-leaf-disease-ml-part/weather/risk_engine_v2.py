"""
risk_engine_v2.py
=================
Weather-based disease risk engine for Sri Lanka papaya.

Uses a trained ML classifier (weather_risk_model.pkl) as primary scorer.
Falls back to rule-based scoring if model is unavailable.

Outputs risk_level: LOW | MEDIUM | HIGH | CRITICAL
"""

from __future__ import annotations
import os
import math
import statistics
import pandas as pd

_MODEL_PATH = os.path.join(os.path.dirname(__file__), "weather_risk_model.pkl")

# ---------------------------------------------------------------------------
# Lazy-load the trained ML model
# ---------------------------------------------------------------------------
_risk_model = None

def _get_model():
    global _risk_model
    if _risk_model is not None:
        return _risk_model
    try:
        import joblib
        _risk_model = joblib.load(_MODEL_PATH)
        return _risk_model
    except Exception as e:
        print(f"[risk_engine_v2] WARNING: Cannot load weather_risk_model.pkl: {e}")
        return None


# ---------------------------------------------------------------------------
# Humanitarian advice strings (English)
# ---------------------------------------------------------------------------
DISEASE_EXPLAIN = {
    "anthracnose": (
        "Anthracnose (Colletotrichum gloeosporioides) spreads rapidly in warm, "
        "humid and rainy conditions. Fruit rot and leaf blight worsen significantly "
        "when rain stays above 20 mm/week and temperature is 25–30 °C. "
        "Improve air circulation and drainage to slow progression."
    ),
    "mosaic": (
        "Papaya Mosaic Virus (PapMV) is spread by aphid vectors. "
        "Dry and warm spells increase aphid activity and virus spread. "
        "There is no chemical cure — vector management and removal of infected plants "
        "are the most effective control strategies."
    ),
    "mites": (
        "Spider mites (Tetranychus urticae) thrive in hot, dry weather. "
        "Low rainfall (<5 mm/week) and temperatures above 28 °C cause rapid population "
        "explosions. Heavy rain naturally reduces mite numbers by dislodging them."
    ),
    "leaf_curl": (
        "Papaya Leaf Curl Virus is transmitted by whiteflies and thrips. "
        "Vectors are most active in warm conditions with moderate humidity "
        "(after light rains). Dry spells concentrate insect populations near water "
        "sources including your plantation."
    ),
}

RISK_ACTION_GUIDE = {
    "LOW": {
        "action": "routine_monitoring",
        "urgency": "Low urgency — continue regular farm inspection.",
        "urgency_si": "අඩු හදිසියාව — සාමාන්‍ය ගොවිතැන් පරීක්ෂාව දිගටම කරගෙන යන්න.",
        "frequency": "Check plants every 7 days.",
        "frequency_si": "දින 7 කට වරක් ශාක පරීක්ෂා කරන්න.",
    },
    "MEDIUM": {
        "action": "preventive_spray",
        "urgency": "Moderate urgency — apply preventive treatment within 3–5 days.",
        "urgency_si": "මධ්‍යම හදිසියාව — දින 3–5 ඇතුළත වැළකීමේ ප්‍රතිකාරය ආරම්භ කරන්න.",
        "frequency": "Increase inspection to every 3–4 days.",
        "frequency_si": "දින 3–4 කට වරක් ශාක පරීක්ෂා කරන්න.",
    },
    "HIGH": {
        "action": "immediate_treatment",
        "urgency": "High urgency — begin treatment within 24–48 hours.",
        "urgency_si": "ඉහළ හදිසියාව — පැය 24–48 ඇතුළත ප්‍රතිකාරය ආරම්භ කරන්න.",
        "frequency": "Daily monitoring required.",
        "frequency_si": "දෛනිකව නිරීක්ෂණය අවශ්‍යයි.",
    },
    "CRITICAL": {
        "action": "emergency_intervention",
        "urgency": "CRITICAL — contact your nearest DoA extension officer immediately. "
                   "Emergency treatment and potentially quarantine of affected area needed.",
        "urgency_si": "හදිසි තත්ත්වය — ළඟම කෘෂිකර්ම සම්ප්‍රසාරණ නිලධාරියා හමු වන්න. "
                      "හදිසි ප්‍රතිකාරය සහ ප්‍රදේශ හුදෙකලා කිරීම අවශ්‍ය විය හැකිය.",
        "frequency": "Twice-daily monitoring. Do not delay.",
        "frequency_si": "දිනකට දෙවරක් නිරීක්ෂණය කරන්න. ප්‍රමාද නොකරන්න.",
    },
}

# ---------------------------------------------------------------------------
# Sinhala translations for risk levels (static)
# ---------------------------------------------------------------------------
RISK_SINHALA = {
    "LOW":      "අඩු අවදානම",
    "MEDIUM":   "මධ්‍යම අවදානම",
    "HIGH":     "ඉහළ අවදානම",
    "CRITICAL": "අවදානමේ අවසාන අදියර (හදිසි ක්‍රියාව අවශ්‍යයි)",
}

ACTION_SINHALA = {
    "routine_monitoring":    "සාමාන්‍ය නිරීක්ෂණය",
    "preventive_spray":      "වැළකීමේ ඖෂධ ඉසීම",
    "immediate_treatment":   "ඉක්මන් ප්‍රතිකාරය",
    "emergency_intervention":"හදිසි මැදිහත් වීම",
}

# ---------------------------------------------------------------------------
# Sinhala disease explanations
# ---------------------------------------------------------------------------
DISEASE_EXPLAIN_SI = {
    "anthracnose": (
        "ඇන්ත්‍රැක්නෝස් (Colletotrichum gloeosporioides) රෝගය උෂ්ණ, තෙත් සහ වැසි "
        "කාළගුණයේ ඉක්මනින් පැතිර යයි. සතිය ඇතුළත 20 mm ඉක්මවූ වර්ෂාපතනය සහ "
        "උෂ්ණත්වය 25–30 °C ඇත්නම් ගෙඩි කුණු වීම සහ කොළ දිරාපත් වීම තීව්‍ර වේ. "
        "වාතය ධාවනය සහ ජල ඉවතලීම වැඩිදියුණු කිරීම රෝගය සෙමෙන් ව්‍යාප්ත කරයි."
    ),
    "mosaic": (
        "පැපෝල් මොසේයික් වයිරසය (PapMV) ඇෆිඩ් කෘමීන් මගින් පැතිරේ. "
        "වියළි සහ උෂ්ණ කාළගුණය ඇෆිඩ් ක්‍රියාකාරීත්වය සහ වයිරස් පැතිරීම වැඩි කරයි. "
        "රසායනික ප්‍රතිකාරයක් නොමැත — රෝගී ශාක ඉවත් කිරීම සහ කෘමි පාලනය "
        "ඵලදායීම ක්‍රමෝපායයන් ය."
    ),
    "mites": (
        "කාළ මකුළුවන් (Tetranychus urticae) උෂ්ණ, වියළි කාළගුණයේ ශීඝ්‍රයෙන් වැඩිවේ. "
        "සතිය ඇතුළත 5 mm ට අඩු වර්ෂාව සහ 28 °C ට ඉහළ උෂ්ණත්වය ජනගහනය "
        "ඉහළ දැමීමට හේතු වේ. ගිනිවර්ෂාව ස්වාභාවිකව ඒවා ශාකවලින් ඉවත් කරයි."
    ),
    "leaf_curl": (
        "පැපෝල් ලිෆ් කර්ල් වයිරසය සුදු මැස්සන් (whitefly) සහ ත්‍රිප් (thrips) "
        "කෘමීන් මගින් සංක්‍රමණය වේ. මෘදු වර්ෂාවෙන් පසු සාමාන්‍ය ආර්ද්‍රතාව ඇති "
        "උෂ්ණ කාළගුණයේ මෙම කෘමීන් වඩාත් ක්‍රියාශීලී වේ. ශාකතල ආවරණ (mulch) "
        "සහ කෘමි ජාල කෘමි පාලනයට ඵලදායී ය."
    ),
}

# ---------------------------------------------------------------------------
# Future disease outlook — what happens if NO action is taken
# (disease, risk_level) → outcome description
# ---------------------------------------------------------------------------
DISEASE_RISK_OUTLOOK_EN = {
    ("anthracnose", "LOW"):      "Disease progression is likely slow. Minor lesions may remain stable under current conditions. Maintain routine spraying and drainage improvements.",
    ("anthracnose", "MEDIUM"):   "Anthracnose spores can germinate in humid spots. Expect water-soaked spots on fruits within 7–10 days without treatment. Apply preventive mancozeb or copper spray now.",
    ("anthracnose", "HIGH"):     "Rapid fungal spread is expected. Fruit rot may appear within 3–5 days. Leaf blight could affect 30–50% of the canopy within a week if untreated. Begin treatment immediately.",
    ("anthracnose", "CRITICAL"): "Emergency: current weather is ideal for Colletotrichum infection cycles. Without emergency treatment, 50–80% crop loss within 2 weeks is possible. Contact DoA extension officer immediately.",
    ("mosaic", "LOW"):           "Aphid vector activity is low. Disease spread is slow. Focus on removing infected plant material and eliminating weed hosts nearby.",
    ("mosaic", "MEDIUM"):        "Moderate aphid activity expected. Virus could spread to neighbouring plants within 1–2 weeks. Remove infected plants and apply reflective mulch now.",
    ("mosaic", "HIGH"):          "High aphid pressure expected. Rapid virus spread across the plantation within days. Remove all symptomatic plants immediately — there is no chemical cure for mosaic.",
    ("mosaic", "CRITICAL"):      "Aphid populations are likely spiking. Uncontrolled spread could affect entire plantation rows within 2 weeks. Emergency vector control and immediate removal of infected plants required.",
    ("mites", "LOW"):            "Mite population growth is slow under current conditions. Standard spray intervals are sufficient to keep colonies under control.",
    ("mites", "MEDIUM"):         "Mite colonies may double within 5–7 days under current warmth and low humidity. Apply neem oil or sulphur dust spray now to slow reproduction.",
    ("mites", "HIGH"):           "Rapid mite population explosion expected within 3–4 days. Leaf bronzing and silvering will spread quickly. Apply abamectin immediately.",
    ("mites", "CRITICAL"):       "Extreme mite outbreak conditions. Hot and dry weather allows populations to triple every 3 days. Defoliation of infested branches possible within 1 week without emergency action.",
    ("leaf_curl", "LOW"):        "Whitefly and thrips activity is low. Minimal new infection risk. Continue monitoring and use yellow sticky traps.",
    ("leaf_curl", "MEDIUM"):     "Moderate vector activity expected. New leaf curl infections may appear on young shoots within 1–2 weeks. Apply spinosad or imidacloprid preventively.",
    ("leaf_curl", "HIGH"):       "High whitefly/thrips pressure expected. Rapid infection of new shoots within days. Begin immediate insecticide application and remove heavily infected plants.",
    ("leaf_curl", "CRITICAL"):   "Severe vector outbreak conditions. Within 1–2 weeks, all new growth throughout the plantation may be infected. Emergency insecticide protocol required.",
}

DISEASE_RISK_OUTLOOK_SI = {
    ("anthracnose", "LOW"):      "රෝගය සෙමෙන් ව්‍යාප්ත වේ. කුඩා ලප ස්ථාවරව පවතිති. සාමාන්‍ය ඉසීම හා ජල ඉවතලීම දිගටම කරගෙන යන්න.",
    ("anthracnose", "MEDIUM"):   "ඇන්ත්‍රැක්නෝස් ස්පෝරා තෙත් ස්ථානවල ප්‍රජනනය විය හැකිය. ප්‍රතිකාරයකින් තොරව දින 7–10 ඇතුළත ගෙඩිවල ජල-ලප ඇතිවිය හැකිය. Mancozeb හෝ තඹ ද්‍රාවණය දැන් ඉසීය යුතුය.",
    ("anthracnose", "HIGH"):     "දිලීර ව්‍යාප්තිය ඉක්මනින් සිදු විය හැකිය. දින 3–5 ඇතුළත ගෙඩි කුණු වීම ආරම්භ විය හැකිය. දැන්ම ප්‍රතිකාරය ආරම්භ කිරීම ඉතා වැදගත්.",
    ("anthracnose", "CRITICAL"): "හදිසි තත්ත්වය: දිලීර ආසාදනයට වර්තමාන කාළගුණය ඉතා හිතකරය. හදිසි ප්‍රතිකාරයකින් තොරව සති 2 ඇතුළත අස්වැන්නෙන් 50–80% ක් හානි විය හැකිය. කෘෂිකර්ම නිලධාරියා හමු වන්න.",
    ("mosaic", "LOW"):           "ඇෆිඩ් ක්‍රියාකාරීත්වය අඩුයි. රෝගය ස්ථාවරය. රෝගී ශාක ඉවත් කිරීම සහ වල් පැල පාලනය කරන්න.",
    ("mosaic", "MEDIUM"):        "ඇෆිඩ් ක්‍රියාකාරීත්වය සාමාන්‍ය. සති 1–2 ඇතුළත අසල ශාකවලට වයිරසය පැතිරිය හැකිය. රෝගී ශාක ඉවත් කර ආලෝකය පරාවර්තන ආවරණ (mulch) යොදන්න.",
    ("mosaic", "HIGH"):          "ඇෆිඩ් ජනගහනය ඉහළ. වයිරසය ශීඝ්‍රයෙන් ව්‍යාප්ත වේ. රෝගී ශාක ඉවත් කිරීම ඉතා ඉක්මනින් කළ යුතුය.",
    ("mosaic", "CRITICAL"):      "ඇෆිඩ් ජනගහනය ඉතා ඉහළ. සති 2 ඇතුළත ශාක පේළිවලම රෝගය ව්‍යාප්ත විය හැකිය. රෝගී ශාක වහාම ඉවත් කරන්න.",
    ("mites", "LOW"):            "මකුළු ජනගහනය ක්‍රමෙන් වෙනස් වේ. සාමාන්‍ය ශ්‍රේණිගත ඉසීම ප්‍රමාණවත්.",
    ("mites", "MEDIUM"):         "දින 5–7 ඇතුළත මකුළු ජනගහනය දෙගුණ විය හැකිය. Neem oil හෝ Sulphur dust ඉසී ශාක ආරක්ෂා කරන්න.",
    ("mites", "HIGH"):           "දිනකි 3–4 ඇතුළත ශීඝ්‍ර ව්‍යාප්තිය. කොළ රතු-රන්වන් (bronzing) ලකුණු ඉශ්‍රීය ලෙස පැතිරේ. Abamectin ඉසීම දැනම ආරම්භ කරන්න.",
    ("mites", "CRITICAL"):       "අධිතීව්‍ර මකුළු (mite) අර්බුදය. සෑම දිනකට ජනගහනය 3 ගුණ වේ. සතියක් ඇතුළත ආසාදිත ශාඛාවල කොළ ගැලවී යාම සිදු විය හැකිය.",
    ("leaf_curl", "LOW"):        "ශාකාහාරී ක්‍රියාකාරිත්වය අඩු. ශාක නිරීක්ෂණය සාමාන්‍ය ලෙස දිගටම කරගෙන යන්න.",
    ("leaf_curl", "MEDIUM"):     "සාමාන්‍ය ශාකාහාරී (whitefly/thrips) ක්‍රියාකාරිත්වය. සති 1–2 ඇතුළත නව කොළ ආසාදනය ඇතිවිය හැකිය. Spinosad හෝ Imidacloprid ඉසීම ආරම්භ කරන්න.",
    ("leaf_curl", "HIGH"):       "ශාකාහාරී ජනගහනය ඉහළ. නව ලිස (shoots) ශීඝ්‍රයෙන් ආසාදිත වේ. ක්ෂණිකව කෘමිනාශකය ඉසිය යුතුය.",
    ("leaf_curl", "CRITICAL"):   "ශාකාහාරී ජනගහනය ශීඝ්‍රයෙන් ඉහළ යයි. සති 1–2 ඇතුළත සියලු නව ලිස ආසාදිත විය හැකිය. හදිසි ක්‍රමෝපාය ක්‍රියාත්මක කළ යුතුය.",
}

# ---------------------------------------------------------------------------
# XAI helpers — explain WHICH weather factors drove the risk classification
# ---------------------------------------------------------------------------
def _explain_why_risk_en(disease: str, severity: str,
                          tmean: float, rain7d: float,
                          humidity: float, risk_level: str) -> str:
    """Return a plain-English sentence explaining the ML model's risk decision."""
    factors = []
    if disease == "anthracnose":
        if rain7d > 20:
            factors.append(f"high 7-day rainfall ({rain7d:.0f} mm) promotes spore germination and spread")
        if humidity > 75:
            factors.append(f"estimated humidity ({humidity:.0f}%) accelerates fungal colony growth")
        if 24 <= tmean <= 32:
            factors.append(f"mean temperature ({tmean:.1f} °C) is ideal for Colletotrichum infection cycles")
        elif tmean > 32:
            factors.append(f"temperature ({tmean:.1f} °C) is slightly above optimal, which may moderate fungal spread")
        if rain7d < 5:
            factors.append(f"very low rainfall ({rain7d:.0f} mm) is reducing spore dispersal for now")
    elif disease == "mosaic":
        if rain7d < 10:
            factors.append(f"very low rainfall ({rain7d:.0f} mm) keeps aphid colonies active and mobile")
        if 25 <= tmean <= 35:
            factors.append(f"temperature ({tmean:.1f} °C) is ideal for aphid vector population growth")
        if humidity < 60:
            factors.append(f"low humidity ({humidity:.0f}%) encourages aphid movement between plants")
        if rain7d > 40:
            factors.append(f"heavy rains ({rain7d:.0f} mm) may temporarily slow aphid activity")
    elif disease == "mites":
        if rain7d < 5:
            factors.append(f"very low rainfall ({rain7d:.0f} mm) gives mites no natural knock-down, allowing rapid build-up")
        if tmean >= 28:
            factors.append(f"high temperature ({tmean:.1f} °C) shortens the mite reproductive cycle")
        if humidity < 55:
            factors.append(f"low humidity ({humidity:.0f}%) is optimal for spider mite survival and egg hatching")
        if rain7d > 20:
            factors.append(f"rainfall ({rain7d:.0f} mm) may help wash mites off leaves, partially controlling numbers")
    elif disease == "leaf_curl":
        if 10 <= rain7d <= 40:
            factors.append(f"moderate rainfall ({rain7d:.0f} mm) maintains vector activity without dispersing insects")
        if 22 <= tmean <= 33:
            factors.append(f"temperature ({tmean:.1f} °C) is favorable for whitefly and thrips reproduction")
        if 65 <= humidity <= 85:
            factors.append(f"humidity ({humidity:.0f}%) is in the range that supports vector breeding cycles")
        if rain7d < 5:
            factors.append(f"dry conditions ({rain7d:.0f} mm rain) concentrate insect vectors near water sources like your plantation")

    if severity == "severe":
        factors.append("the existing severe disease severity amplifies vulnerability to weather-driven spread")
    elif severity == "moderate":
        factors.append("moderate disease severity means the plant's defences are already compromised")

    if not factors:
        return (f"The ML model (trained on 500+ Sri Lanka papaya records) assessed {risk_level} risk "
                f"based on the combined weather conditions and disease profile.")
    return (f"The ML model assessed {risk_level} risk because: " + "; ".join(factors) + ". "
            f"Model confidence is based on a Random Forest classifier trained on local disease-weather data.")


def _explain_why_risk_si(disease: str, severity: str,
                          tmean: float, rain7d: float,
                          humidity: float, risk_level: str) -> str:
    """Return a Sinhala sentence explaining the risk classification."""
    factors = []
    if disease == "anthracnose":
        if rain7d > 20:
            factors.append(f"ඉහළ වර්ෂාව ({rain7d:.0f} mm) ස්පෝරා ප්‍රජනනයට හිතකරය")
        if humidity > 75:
            factors.append(f"ආර්ද්‍රතාවය ({humidity:.0f}%) දිලීර ව්‍යාප්තිය ත්වරණය කරයි")
        if 24 <= tmean <= 32:
            factors.append(f"උෂ්ණත්වය ({tmean:.1f} °C) Colletotrichum ශාකාහාරීයට ස්ථාවරය")
    elif disease == "mosaic":
        if rain7d < 10:
            factors.append(f"ඉතා අඩු වර්ෂාව ({rain7d:.0f} mm) ඇෆිඩ් ක්‍රියාශීලිය")
        if 25 <= tmean <= 35:
            factors.append(f"උෂ්ණත්වය ({tmean:.1f} °C) ඇෆිඩ් ජනගහනයට හිතකරය")
        if humidity < 60:
            factors.append(f"අඩු ආර්ද්‍රතාවය ({humidity:.0f}%) ආෆිඩ් ව්‍යාප්තිය ත්වරණය කරයි")
    elif disease == "mites":
        if rain7d < 5:
            factors.append(f"ඉතා අඩු වර්ෂාව ({rain7d:.0f} mm) — මකුළු ජනගහනය ස්වාභාවිකව ඉවත් නොවේ")
        if tmean >= 28:
            factors.append(f"ඉහළ උෂ්ණත්වය ({tmean:.1f} °C) මකුළු ප්‍රජනනය ත්වරණය කරයි")
        if humidity < 55:
            factors.append(f"අඩු ආර්ද්‍රතාවය ({humidity:.0f}%) මකුළු ජීවිතාශ්‍ය ඉහළ යයි")
    elif disease == "leaf_curl":
        if 22 <= tmean <= 33:
            factors.append(f"උෂ්ණත්වය ({tmean:.1f} °C) whitefly/thrips ප්‍රජනනයට හිතකරය")
        if 65 <= humidity <= 85:
            factors.append(f"ආර්ද්‍රතාවය ({humidity:.0f}%) ශාකාහාරී ශ්‍රේණිකරණය ත්වරණය කරයි")
        if rain7d < 5:
            factors.append(f"වියළි කාළගුණය ({rain7d:.0f} mm) ජල ප්‍රභවය අසල ශාකාහාරී සංකේන්ද්‍රණය කරයි")

    if severity == "severe":
        factors.append("දැනටමත් ඉහළ රෝගී බව (severe) කාළගුණ බලපෑම ඉහළ යයි")
    elif severity == "moderate":
        factors.append("මධ්‍යම රෝගී බව (moderate) ශාකය ආරක්ෂාව දුර්වල කරයි")

    if not factors:
        return (f"ML ආකෘතිය {risk_level} අවදානමක් ශ්‍රේණිගත කළේ ඒකාබද්ධ කාළගුණ හා රෝග "
                f"දත්ත මත ය.")
    return f"ML ආකෘතිය {risk_level} අවදානම ශ්‍රේණිගත කළේ: " + "; ".join(factors) + "."

# ---------------------------------------------------------------------------
# Rule-based fallback scorer
# ---------------------------------------------------------------------------
def _rule_based_risk(disease: str, severity: str,
                     tmean: float, rain_7d: float, humidity: float) -> str:
    sev_mult = {"mild": 0.7, "moderate": 1.0, "severe": 1.35}.get(severity, 1.0)
    score = 0.0

    if disease == "anthracnose":
        score += 0.40 if rain_7d > 50 else (0.25 if rain_7d > 20 else 0.05)
        score += 0.35 if 24 <= tmean <= 32 else (0.20 if 20 <= tmean < 24 else 0.05)
        score += 0.25 if humidity >= 80 else (0.15 if humidity >= 65 else 0.05)
    elif disease == "mosaic":
        score += 0.40 if rain_7d < 10 else (0.25 if rain_7d < 30 else 0.10)
        score += 0.35 if 25 <= tmean <= 35 else (0.20 if tmean > 35 else 0.10)
        score += 0.25 if humidity < 60 else (0.15 if humidity < 75 else 0.05)
    elif disease == "mites":
        score += 0.45 if rain_7d < 5 else (0.25 if rain_7d < 15 else 0.05)
        score += 0.35 if tmean >= 28 else (0.20 if tmean >= 24 else 0.05)
        score += 0.20 if humidity < 55 else (0.10 if humidity < 70 else 0.02)
    elif disease == "leaf_curl":
        score += 0.35 if 10 <= rain_7d <= 40 else (0.20 if rain_7d > 40 else 0.30)
        score += 0.35 if 22 <= tmean <= 33 else (0.20 if tmean > 33 else 0.10)
        score += 0.30 if 65 <= humidity <= 85 else (0.15 if humidity > 85 else 0.20)
    else:
        score = 0.5

    adjusted = min(1.0, score * sev_mult)
    if adjusted >= 0.80:
        return "CRITICAL"
    elif adjusted >= 0.58:
        return "HIGH"
    elif adjusted >= 0.35:
        return "MEDIUM"
    return "LOW"


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------
def compute_weather_risk_v2(
    disease_name: str,
    severity: str,
    forecast_days: list[dict],
) -> dict:
    """
    Computes ML-backed weather risk for the next 7 days.

    Parameters
    ----------
    disease_name  : str   "anthracnose" | "mosaic" | "mites" | "leaf_curl"
    severity      : str   "mild" | "moderate" | "severe"
    forecast_days : list  from weather_client.get_7day_weather()
                    Each item: {date, tmax, tmin, tmean, rain_mm}

    Returns
    -------
    dict with keys:
        risk_level, risk_level_si, risk_score, alert_color,
        action, urgency_en, urgency_si, frequency,
        weather_summary, daily_risk, disease_explanation,
        model_used ("ml" | "rule_based")
    """
    disease_key = disease_name.strip().lower().replace(" ", "_").replace("-", "_")
    severity_key = severity.strip().lower()

    if not forecast_days:
        return {
            "risk_level":              "MEDIUM",
            "risk_level_si":           RISK_SINHALA["MEDIUM"],
            "risk_score":              0.5,
            "alert_color":             "YELLOW",
            "action":                  "preventive_spray",
            "urgency_en":              "No weather data available. Apply standard preventive measures.",
            "urgency_si":              "කාළගුණ දත්ත නොමැත. සාමාන්‍ය වැළකීමේ ක්‍රමවේද යොදන්න.",
            "frequency":               "Every 3–5 days",
            "frequency_si":            "දින 3–5 කට වරක්",
            "weather_summary":         {},
            "daily_risk":              [],
            "disease_explanation":     DISEASE_EXPLAIN.get(disease_key, ""),
            "disease_explanation_si":  DISEASE_EXPLAIN_SI.get(disease_key, ""),
            "future_outlook_en":       DISEASE_RISK_OUTLOOK_EN.get((disease_key, "MEDIUM"), "Monitor closely."),
            "future_outlook_si":       DISEASE_RISK_OUTLOOK_SI.get((disease_key, "MEDIUM"), "නිරීක්ෂණය දිගටම කරගෙන යන්න."),
            "why_this_risk_en":        "No weather data was available for detailed analysis. MEDIUM risk applied as a precaution.",
            "why_this_risk_si":        "කාළගුණ දත්ත නොමැති නිසා MEDIUM අවදානම ස්ව-ක්‍රියාව ලෙස යෙදිණ.",
            "model_used":              "none",
        }

    # Aggregate 7-day weather stats
    tmeans   = [d["tmean"]   for d in forecast_days]
    rains    = [d["rain_mm"] for d in forecast_days]
    tmean_7d = statistics.mean(tmeans)
    rain_7d  = sum(rains)
    tmax_7d  = max(d["tmax"] for d in forecast_days)
    tmin_7d  = min(d["tmin"] for d in forecast_days)

    # Estimate humidity from temp range (proxy: wider range → drier)
    temp_range_avg = statistics.mean([d["tmax"] - d["tmin"] for d in forecast_days])
    estimated_humidity = max(30.0, min(100.0, 95.0 - (temp_range_avg * 2.5)))

    model = _get_model()
    model_used = "rule_based"

    if model is not None:
        try:
            inp = pd.DataFrame([{
                "disease":      disease_key,
                "severity":     severity_key,
                "tmean_c":      round(tmean_7d, 2),
                "rain_7d_mm":   round(rain_7d, 2),
                "humidity_pct": round(estimated_humidity, 1),
            }])
            risk_level = model.predict(inp)[0]
            probs      = model.predict_proba(inp)[0]
            risk_score = float(probs.max())
            model_used = "ml"
        except Exception as e:
            print(f"[risk_engine_v2] ML predict error: {e}, using rule_based")
            risk_level = _rule_based_risk(disease_key, severity_key, tmean_7d, rain_7d, estimated_humidity)
            risk_score = {"LOW": 0.2, "MEDIUM": 0.5, "HIGH": 0.75, "CRITICAL": 0.92}.get(risk_level, 0.5)
    else:
        risk_level = _rule_based_risk(disease_key, severity_key, tmean_7d, rain_7d, estimated_humidity)
        risk_score = {"LOW": 0.2, "MEDIUM": 0.5, "HIGH": 0.75, "CRITICAL": 0.92}.get(risk_level, 0.5)

    # Daily granular risk scores (rule-based per day for display)
    daily_risk = []
    for d in forecast_days:
        day_humidity = max(30.0, min(100.0, 95.0 - ((d["tmax"] - d["tmin"]) * 2.5)))
        day_risk     = _rule_based_risk(disease_key, severity_key, d["tmean"], d["rain_mm"] * 7, day_humidity)
        daily_risk.append({
            "date":          d["date"],
            "tmean":         round(d["tmean"], 1),
            "rain_mm":       round(d["rain_mm"], 1),
            "humidity_est":  round(day_humidity, 1),
            "day_risk":      day_risk,
        })

    alert_color_map = {"LOW": "GREEN", "MEDIUM": "YELLOW", "HIGH": "ORANGE", "CRITICAL": "RED"}
    guide = RISK_ACTION_GUIDE.get(risk_level, RISK_ACTION_GUIDE["MEDIUM"])

    # XAI — future disease outlook and reason for this risk classification
    outlook_key = (disease_key, risk_level)
    future_outlook_en = DISEASE_RISK_OUTLOOK_EN.get(outlook_key, f"Monitor closely. Risk is {risk_level}.")
    future_outlook_si = DISEASE_RISK_OUTLOOK_SI.get(outlook_key, f"නිරීක්ෂණය දිගටම කරගෙන යන්න. අවදානම: {risk_level}.")
    why_en = _explain_why_risk_en(disease_key, severity_key, tmean_7d, rain_7d, estimated_humidity, risk_level)
    why_si = _explain_why_risk_si(disease_key, severity_key, tmean_7d, rain_7d, estimated_humidity, risk_level)

    return {
        "risk_level":              risk_level,
        "risk_level_si":           RISK_SINHALA.get(risk_level, risk_level),
        "risk_score":              round(risk_score, 3),
        "alert_color":             alert_color_map.get(risk_level, "YELLOW"),
        "action":                  guide["action"],
        "action_si":               ACTION_SINHALA.get(guide["action"], guide["action"]),
        "urgency_en":              guide["urgency"],
        "urgency_si":              guide.get("urgency_si", ""),
        "frequency":               guide["frequency"],
        "frequency_si":            guide.get("frequency_si", ""),
        "weather_summary": {
            "tmean_7d_avg_c":    round(tmean_7d, 1),
            "total_rain_7d_mm":  round(rain_7d, 1),
            "tmax_c":            round(tmax_7d, 1),
            "tmin_c":            round(tmin_7d, 1),
            "humidity_est_pct":  round(estimated_humidity, 1),
        },
        "daily_risk":              daily_risk,
        "disease_explanation":     DISEASE_EXPLAIN.get(disease_key, ""),
        "disease_explanation_si":  DISEASE_EXPLAIN_SI.get(disease_key, ""),
        "future_outlook_en":       future_outlook_en,
        "future_outlook_si":       future_outlook_si,
        "why_this_risk_en":        why_en,
        "why_this_risk_si":        why_si,
        "model_used":              model_used,
    }
