import requests
import os

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/gemini-2.5-flash-lite:generateContent"
)

# ═══════════════════════════════════════════════════════════
# PAPAYA GROWTH STAGE KNOWLEDGE BASE
# ═══════════════════════════════════════════════════════════

STAGE_INFO = {
    "a": {  # Stage A
        "name": "Stage A",
        "name_si": "A අවධිය",
        "duration": "0-2 months",
        "duration_si": "මාස 0-2",
        "height": "15-30 cm",
        "height_si": "සෙ.මී. 15-30",
        "characteristics": "4-8 true leaves, thin tender stems, light green leaves, developing taproot",
        "characteristics_si": "සැබෑ කොළ 4-8, සිහින් මෘදු කඳ, ළා හරිත කොළ, ගැඹුරු මූල වර්ධනය",
        "next_stage": "Stage B (in 1-2 months)",
        "next_stage_si": "B අවධිය (මාස 1-2 තුළ)",
        "next_stage_signs": "stems thickening, reaching 30-40 cm height, 8-10 weeks old",
        "next_stage_signs_si": "කඳ ඝන වීම, උස සෙ.මී. 30-40 ළඟා වීම, සති 8-10 වයස",
        "care": {
            "watering": "Daily light watering (200-300ml per plant), keep moist not waterlogged, morning/evening",
            "watering_si": "දිනපතා ලිහිල් ජල සම්පාදනය (ශාකයකට මිලි 200-300), තෙතමනය නමුත් ජලය රැඳී නොතැබිය යුතු, උදේ/සවස",
            "fertilizer": "NPK 15-15-15 at 10-15g every 2 weeks (start at 3-4 weeks), weekly seaweed foliar spray",
            "fertilizer_si": "NPK 15-15-15 ග්‍රෑ. 10-15 සති 2 කට වරක් (සති 3-4 සිට ආරම්භ කරන්න), සතිපතා මුහුදු පැළ ෆෝලියර් ස්ප්‍රේ",
            "protection": "50-70% shade cloth, protect from strong wind and heavy rain",
            "protection_si": "50-70% සෙවණ රෙදි, ශක්තිමත් සුළං සහ අධික වර්ෂාපාතයෙන් ආරක්ෂා කරන්න",
            "soil": "pH 6.0-6.5, well-drained with organic mulch",
            "soil_si": "pH 6.0-6.5, කාබනික පලඟ සහිත හොඳ ජල බැස්සුම",
            "spacing": "10-15 cm in nursery, use 15x20 cm polybags",
            "spacing_si": "රෝපණාගාරයේ සෙ.මී. 10-15, සෙ.මී. 15x20 බහු-බෑග් භාවිතා කරන්න"
        },
        "transition_focus": "Focus on protection and establishing strong roots. Prepare for transplanting when conditions are right.",
        "transition_focus_si": "ආරක්ෂාව සහ ශක්තිමත් මූල ස්ථාපිත කිරීම කෙරෙහි අවධානය යොමු කරන්න. තත්ත්වයන් නිවැරදි වූ විට රෝපනයට සූදානම් වන්න."
    },
    "b": {  # Stage B
        "name": "Stage B",
        "name_si": "B අවධිය",
        "duration": "2-5 months",
        "duration_si": "මාස 2-5",
        "height": "40-100 cm",
        "height_si": "සෙ.මී. 40-100",
        "characteristics": "15-25 leaves, stem 3-5 cm diameter, darker green leaves, active vegetative growth, no flowers yet",
        "characteristics_si": "කොළ 15-25, කඳ විෂ්කම්භය සෙ.මී. 3-5, තද හරිත කොළ, ක්‍රියාශීලී නිර්මල වර්ධනය, මල් නොමැත",
        "next_stage": "Pre-Stage D (in 1-3 months)",
        "next_stage_si": "C අවධිය (මාස 1-3 තුළ)",
        "next_stage_signs": "flower buds appearing at leaf axils, height 80-100 cm, 4.5-5 months age",
        "next_stage_signs_si": "කොළ ඉළ ෙකොටස්වල මල් පොහොට්ටු දිස්වීම, උස සෙ.මී. 80-100, මාස 4.5-5 වයස",
        "care": {
            "watering": "Every 2-3 days (2-5 liters per plant), deep watering for root development, reduce in rainy season",
            "watering_si": "දින 2-3 කට වරක් (ශාකයකට ලීටර් 2-5), මූල වර්ධනය සඳහා ගැඹුරු ජල සම්පාදනය, වර්ෂා කාලයේ අඩු කරන්න",
            "fertilizer": "NPK 14-14-14 at 50-75g every 3 weeks, monthly magnesium sulfate (25g), calcium if acidic soil",
            "fertilizer_si": "NPK 14-14-14 ග්‍රෑ. 50-75 සති 3 කට වරක්, මාසිකව මැග්නීසියම් සල්පේට් (ග්‍රෑ. 25), ආම්ලික පසට කැල්සියම්",
            "protection": "Full sunlight required now, control aphids aggressively (PRSV vectors), regular field monitoring",
            "protection_si": "දැන් සම්පූර්ණ හිරු එළිය අවශ්‍යයි, ඒෆිඩ් (PRSV රෝගාණු) ක්‍රියාශීලීව පාලනය කරන්න, නිතිපතා ක්ෂේත්‍ර නිරීක්ෂණ",
            "soil": "Apply 5-8 cm organic mulch, ensure good drainage",
            "soil_si": "සෙ.මී. 5-8 කාබනික පලඟ යොදන්න, හොඳ ජල බැස්සුම සහතික කරන්න",
            "spacing": "Field spacing 2x2m (2500 plants/ha) or 2.5x2.5m for better air circulation",
            "spacing_si": "ක්ෂේත්‍ර ඈතින් 2x2 මී. (හෙක්ටයාරයකට 2500 ශාක) හෝ වඩා හොඳ වාතාශ්‍රය සඳහා 2.5x2.5 මී."
        },
        "transition_focus": "Build strong plant structure and prevent diseases. Watch for flower buds to appear - that signals readiness for Stage C.",
        "transition_focus_si": "ශක්තිමත් ශාක ව්‍යූහය ගොඩනඟා රෝග වළකින්න. මල් පොහොට්ටු දිස්වීම ගැන සැලකිලිමත් වන්න - එය C අවධියට සූදානම් බව සංඥා කරයි."
    },
    "c": {  # Pre-Stage D
        "name": "Stage C",
        "name_si": "C අවධිය",
        "duration": "5-7 months",
        "duration_si": "මාස 5-7",
        "height": "100-150 cm",
        "height_si": "සෙ.මී. 100-150",
        "characteristics": "25-35 leaves, flowers at leaf axils, trunk 5-8 cm diameter, sex determination visible",
        "characteristics_si": "කොළ 25-35, කොළ ඉළ ෙකොටස්වල මල්, කඳ විෂ්කම්භය සෙ.මී. 5-8, ලිංගිකත්වය දෘශ්‍ය",
        "next_stage": "Stage D (in 4-8 weeks)",
        "next_stage_si": "D අවධිය (සති 4-8 තුළ)",
        "next_stage_signs": "fruits setting and enlarging to 5-10 cm, typically 6.5-7 months after germination",
        "next_stage_signs_si": "ඵල ස්ථාපිත වී සෙ.මී. 5-10 දක්වා විශාල වීම, සාමාන්‍යයෙන් ප්‍රරෝහණයෙන් මාස 6.5-7 පසු",
        "care": {
            "watering": "Critical! 5-10 liters every 2-3 days, consistent moisture essential, drip irrigation ideal",
            "watering_si": "ඉතා වැදගත්! දින 2-3 කට ලීටර් 5-10, ස්ථිර තෙතමනය අත්‍යවශ්‍ය, බිංදු ජලාව පාලනය කෙරෙහි",
            "fertilizer": "NPK 12-12-17 (high potassium) at 100-150g every 3 weeks, boron 5-10g monthly, calcium 50g monthly",
            "fertilizer_si": "NPK 12-12-17 (ඉහළ පොටෑසියම්) ග්‍රෑ. 100-150 සති 3 කට වරක්, මාසිකව බොරෝන් ග්‍රෑ. 5-10, කැල්සියම් ග්‍රෑ. 50",
            "protection": "Install pheromone traps for fruit flies, apply fruit fly bait sprays, maintain air circulation",
            "protection_si": "ගෙවතු ඈඳ් සඳහා ෆෙරමොන් 罠 ස්ථාපිත කරන්න, ගෙවතු ඈඳ් ඒකාකාරී ස්ප්‍රේ යොදන්න, වාත සංසරණය පවත්වා ගන්න",
            "soil": "Mulch heavily to retain moisture, ensure 6-8 hours daily sunlight",
            "soil_si": "තෙතමනය රඳවා ගැනීමට ඝන ලෙස පලඟ යොදන්න, දිනපතා සූර්ය ආලෝකය පැය 6-8 සහතික කරන්න",
            "spacing": "Already established (2-2.5m), ensure good air circulation",
            "spacing_si": "දැනටමත් ස්ථාපිතයි (2-2.5 මී.), හොඳ වාත සංසරණය සහතික කරන්න"
        },
        "transition_focus": "Protect flowers and conduct sex roguing now. Proper care ensures healthy fruit development in Stage D.",
        "transition_focus_si": "දැන් මල් ආරක්ෂා කර ලිංගික ක්ෂේත්‍ර ව්‍යාපාර සිදු කරන්න. නිවැරදි සත්කාරය D අවධියේ සෞඛ්‍ය සම්පන්න ඵල වර්ධනය සහතික කරයි."
    },
    "d": {  # Stage D
        "name": "Stage D",
        "name_si": "D අවධිය",
        "duration": "7-8 months onwards (continues 2-3 years)",
        "duration_si": "මාස 7-8 සිට (අවුරුදු 2-3 දිගටම)",
        "height": "150-300+ cm",
        "height_si": "සෙ.මී. 150-300+",
        "characteristics": "Fruits at various stages, continuous flowering, 20-30 crown leaves, trunk 8-15 cm, first harvest 8-10 months",
        "characteristics_si": "විවිධ අවධිවල ඵල, අඛණ්ඩ මල් පැතිරීම, ශීර්ෂ කොළ 20-30, කඳ සෙ.මී. 8-15, මුල් අස්වනු මාස 8-10",
        "next_stage": "Continuous production for 2-3 years, then replace",
        "next_stage_si": "අවුරුදු 2-3 ක් අඛණ්ඩ නිෂ්පාදනය, ඉන්පසු ප්‍රතිස්ථාපනය",
        "next_stage_signs": "Production declines after Year 3, establish new plantations for continuous supply",
        "next_stage_signs_si": "3 වන වසරෙන් පසු නිෂ්පාදනය අඩු වේ, අඛණ්ඩ සැපයුම සඳහා නව වගාවන් ස්ථාපිත කරන්න",
        "care": {
            "watering": "10-20 liters every 2-3 days, increase in dry season, reduce slightly 1 week before harvest",
            "watering_si": "දින 2-3 කට ලීටර් 10-20, වියළි කාලයේ වැඩි කරන්න, අස්වනු සතියකට පෙර ටිකක් අඩු කරන්න",
            "fertilizer": "NPK 8-10-13 (high potassium) at 150-250g every 3-4 weeks, organic compost 10-15kg/3 months",
            "fertilizer_si": "NPK 8-10-13 (ඉහළ පොටෑසියම්) ග්‍රෑ. 150-250 සති 3-4 කට වරක්, කාබනික කොම්පෝස්ට් කිලෝ 10-15 / 3 මාස",
            "protection": "Active fruit fly management, PRSV monitoring, regular sanitation",
            "protection_si": "ක්‍රියාශීලී ගෙවතු ඈඳ් කළමනාකරණය, PRSV නිරීක්ෂණය, නිතිපතා සනීපාරක්ෂාව",
            "soil": "Maintain mulch, excellent drainage crucial",
            "soil_si": "පලඟ නඩත්තු කරන්න, විශිෂ්ට ජල බැස්සුම ඉතා වැදගත්",
            "spacing": "Maintain 2-2.5m spacing, thin if too dense",
            "spacing_si": "2-2.5 මී. ඈතින් නඩත්තු කරන්න, ඉතාමත් ඝන නම් තනු කරන්න"
        },
        "transition_focus": "Harvest when fruit shows 10-15% yellow for market. Pick every 3-5 days for continuous production.",
        "transition_focus_si": "වෙළඳපල සඳහා ඵලය 10-15% කහ දිස් වූ විට අස්වනු නෙළන්න. අඛණ්ඩ නිෂ්පාදනය සඳහා දින 3-5 කට වරක් නෙළන්න."
    }
}


def generate_market_suggestion(payload, temperature=0.45):
    """Gemini is responsible ONLY for human-level reasoning & advice."""
    prompt = build_prompt(payload)
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": temperature, "maxOutputTokens": 220}
    }
    r = requests.post(
        f"{GEMINI_URL}?key={GEMINI_API_KEY}",
        headers={"Content-Type": "application/json"},
        json=body,
        timeout=30
    )
    if r.status_code != 200:
        raise RuntimeError(f"Gemini API error: {r.text}")
    return r.json()["candidates"][0]["content"]["parts"][0]["text"]


def generate_stage_guidance(stage_code, location="Sri Lanka", current_month=None, language="en"):
    """
    Generate agricultural guidance for papaya growth stage.
    Returns bilingual structured guidance (English + Sinhala).

    Args:
        stage_code: "a", "b", "c", or "d"
        location: Location in Sri Lanka
        current_month: Current month for seasonal considerations
        language: "en" or "si" — controls which language expert_guidance is generated in

    Returns:
        Dictionary with structured guidance (both EN and SI fields) and natural language advice
    """
    if stage_code not in STAGE_INFO:
        return {"error": "Invalid stage code"}

    stage = STAGE_INFO[stage_code]
    is_sinhala = language == "si"

    # ── Gemini prompt ──────────────────────────────────────
    if is_sinhala:
        prompt = f"""
ඔබ ශ්‍රී ලංකාවේ අත්දැකීම් ඇති පැපොල් වගා උපදේශකයෙකි. ගොවියෙකුට ඔවුන්ගේ ශාක {stage['name_si']} සිට ඊළඟ අවධිය දක්වා ගෙන යාමට සහාය වෙමින් සිටිනු ලැබේ.

නීති:
- ප්‍රායෝගික සහ ක්‍රියා-කේන්ද්‍රිත වන්න
- ගොවීන්ට තේරෙන සරල සිංහල භාෂාව භාවිතා කරන්න
- සත්කාරය සහ අවධිය වෙනස් කිරීම කෙරෙහි පමණක් අවධානය යොමු කරන්න
- මිල, පිරිවැය හෝ ආර්ථිකය ගැන සඳහන් නොකරන්න
- AI හෝ තාක්ෂණික යෙදුම් ගැන සඳහන් නොකරන්න
- පළපුරුදු ගොවි නිලධාරියෙකු ආකාරයෙන් කතා කරන්න

වර්තමාන ශාක තත්ත්වය: {stage['name_si']}, උස: {stage['height_si']}, ලක්ෂණ: {stage['characteristics_si']}
ස්ථානය: {location}
{f"මාසය: {current_month}" if current_month else ""}

ජල සම්පාදනය: {stage['care']['watering_si']}
පොහොර: {stage['care']['fertilizer_si']}
ආරක්ෂාව: {stage['care']['protection_si']}
ඊළඟ අවධිය: {stage['next_stage_si']}
ලකුණු: {stage['next_stage_signs_si']}

ඔබේ කාර්යය:
ගොවියාට මෙම සතිය කළ යුතු දේ, ඊළඟ අවධියට ළඟා වන ආකාරය, නිරීක්ෂණ කළ යුතු ලකුණු, සහ එක් ප්‍රධාන ඉඟියක් ඇතුළත් වාක්‍ය 4-5 ක මාර්ගෝපදේශයක් ලියන්න.
සරල සිංහලෙන් ලියන්න.
"""
    else:
        prompt = f"""
You are an experienced papaya cultivation advisor helping a farmer transition their plants from {stage['name']} to the next growth stage.

RULES:
- Be practical and action-focused
- Use simple language farmers understand
- Focus ONLY on care instructions and stage transition
- Do NOT mention prices, costs, or economics
- Do NOT mention AI, models, or technical jargon
- Speak like an experienced agricultural extension officer

Stage: {stage['name']}, Height: {stage['height']}, Features: {stage['characteristics']}
Location: {location}
{f"Month: {current_month}" if current_month else ""}

Watering: {stage['care']['watering']}
Fertilizer: {stage['care']['fertilizer']}
Protection: {stage['care']['protection']}
Next Stage: {stage['next_stage']}
Watch for: {stage['next_stage_signs']}

YOUR TASK:
Write a 4-5 sentence guide covering what to do this week, how to transition, signs to watch, and one critical tip.
"""

    try:
        resp = requests.post(
            f"{GEMINI_URL}?key={GEMINI_API_KEY}",
            headers={"Content-Type": "application/json"},
            json={
                "contents": [{"parts": [{"text": prompt}]}],
                "generationConfig": {"temperature": 0.5, "maxOutputTokens": 350}
            },
            timeout=30
        )
        if resp.status_code == 200:
            gemini_response = resp.json()["candidates"][0]["content"]["parts"][0]["text"]
        else:
            gemini_response = "දැනට විස්තරාත්මක උපදෙස් ලබා ගැනීමට නොහැකිය." if is_sinhala else "Unable to generate detailed advice at this time."
    except Exception:
        gemini_response = "උපදෙස් ඉල්ලුම් කිරීමේ දෝෂයකි." if is_sinhala else "Advice generation temporarily unavailable."

    # ── Return bilingual guidance (no critical_actions / problems_and_solutions) ──
    return {
        "current_stage": {
            "code": stage_code,
            "name": stage['name'],
            "name_si": stage['name_si'],
            "duration": stage['duration'],
            "duration_si": stage['duration_si'],
            "height": stage['height'],
            "height_si": stage['height_si'],
            "characteristics": stage['characteristics'],
            "characteristics_si": stage['characteristics_si'],
        },
        "care_instructions": {
            "watering": stage['care']['watering'],
            "watering_si": stage['care']['watering_si'],
            "fertilizer": stage['care']['fertilizer'],
            "fertilizer_si": stage['care']['fertilizer_si'],
            "protection": stage['care']['protection'],
            "protection_si": stage['care']['protection_si'],
            "soil": stage['care']['soil'],
            "soil_si": stage['care']['soil_si'],
            "spacing": stage['care'].get('spacing', 'Maintain existing spacing'),
            "spacing_si": stage['care'].get('spacing_si', 'පවතින ඈතිනි නඩත්තු කරන්න'),
        },
        "transition_guide": {
            "next_stage": stage['next_stage'],
            "next_stage_si": stage['next_stage_si'],
            "signs_to_watch": stage['next_stage_signs'],
            "signs_to_watch_si": stage['next_stage_signs_si'],
            "transition_focus": stage.get('transition_focus', 'Continue with current care practices'),
            "transition_focus_si": stage.get('transition_focus_si', 'දැනට ක්‍රමවේදයන් දිගටම කරගෙන යන්න.'),
        },
        "expert_guidance": gemini_response,
    }


def build_prompt(data):
    return f"""
You are an agricultural market expert helping farmers and buyers
make smart papaya selling and buying decisions in Sri Lanka.

RULES (VERY IMPORTANT):
- Use ONLY the provided data
- Do NOT mention AI, ML, SHAP, models, probabilities
- Do NOT invent prices or facts
- Be clear, practical, and confident
- Speak like a real market advisor

INPUT DATA:

LOCATION: {data['location']}
MONTH: {data['month']}
LAST 7 DAYS RAINFALL: {data['rainfall_mm']} mm

PAPAYA STATUS:
- Ripeness stage: {data['ripeness']}
- Confidence: {data['confidence_percent']}%

COLOR ANALYSIS:
- Green: {data['color_ratios']['green']:.2f}
- Yellow: {data['color_ratios']['yellow']:.2f}
- Orange/Red: {data['color_ratios']['orange']:.2f}

VARIETY PRICE ESTIMATES (LKR per kg):
{data['price_table']}

SELLER ASKING PRICE:
{data['seller_price'] if data['seller_price'] else "Not provided"}

TASKS:
1. Explain ripeness and eating/selling readiness
2. Explain how weather and color affect price
3. Compare varieties clearly
4. If seller price exists → say FAIR / OVERPRICED / GOOD DEAL

OUTPUT FORMAT:
- 4–6 short sentences
- No bullet points
- Clear final advice at the end
"""

