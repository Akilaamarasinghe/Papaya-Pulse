import requests
import os

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/gemini-2.5-flash-lite:generateContent"
)

def generate_market_suggestion(payload, language="en", temperature=0.45):
    """
    Gemini is responsible ONLY for human-level reasoning & advice.
    When language='si', generates advice in Sinhala.
    Returns a dict with 'en' and 'si' keys, or a plain string for backward compatibility.
    """
    if language == "si":
        # Generate only Sinhala advice
        prompt = build_prompt_si(payload)
        si_text = _call_gemini(prompt, temperature)
        return {"en": "", "si": si_text}
    else:
        # Generate English advice
        prompt = build_prompt(payload)
        en_text = _call_gemini(prompt, temperature)
        return {"en": en_text, "si": ""}


def _call_gemini(prompt, temperature=0.45):
    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": 250
        }
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
5. Give a final actionable recommendation

OUTPUT FORMAT:
- 4–6 short sentences
- No bullet points
- Clear final advice at the end
"""


def build_prompt_si(data):
    return f"""
ඔබ ශ්‍රී ලංකාවේ ගොවීන් සහ ගැනුම්කරුවන්ට පැපොල් විකිනීම සහ මිලදී ගැනීමේ ස්මාර්ට් තීරණ ගැනීමට
සහාය කරන කෘෂිකාර්මික වෙළඳ විශේෂඥ කෙනෙකි. **සිංහලෙන් පමණක් පිළිතුරු දෙන්න.**

නීති (ඉතා වැදගත්):
- ලබා දී ඇති දත්ත පමණක් භාවිතා කරන්න
- AI, ML, ආදර්ශක, සම්භාවිතා ගැන සඳහනක් නොකරන්න
- මිල හෝ කරුණු නොනිර්මාණය කරන්න
- පැහැදිලිව, ප්‍රායෝගිකව, විශ්වාසයෙන් කතා කරන්න
- සැබෑ වෙළඳ උපදේශකයෙකු ලෙස කතා කරන්න

ආදාන දත්ත:

ස්ථානය: {data['location']}
මාසය: {data['month']}
පසුගිය දින 7 ක වර්ෂාපතනය: {data['rainfall_mm']} mm

පැපොල් තත්ත්වය:
- ශීර්ෂත්ව අවධිය: {data.get('ripeness_si', data['ripeness'])}

වර්ණ විශ්ලේෂණය:
- කොළ: {data['color_ratios']['green']:.2f}
- කහ: {data['color_ratios']['yellow']:.2f}
- තැඹිලි/රතු: {data['color_ratios']['orange']:.2f}

ප්‍රභේදය අනුව අනුමාන මිල (LKR per kg):
{data['price_table']}

අලෙවිකරු ඉල්ලන මිල:
{f"LKR {data['seller_price']}/kg" if data['seller_price'] else "ලබා දී නොමැත"}

කාර්යයන්:
1. ශීර්ෂත්වය සහ ආහාරයට/විකිනීමට සූදානම් බව පැහැදිලි කරන්න
2. කාලගුණය සහ වර්ණය මිලට බලපාන ආකාරය පැහැදිලි කරන්න
3. ප්‍රභේද පැහැදිලිව සංසන්දනය කරන්න
4. අලෙවිකරු මිල ලබා දී ඇත්නම් → සාධාරණ / ඉහළ / හොඳ ගනුදෙනුවක් ලෙස ප්‍රකාශ කරන්න
5. අවසාන ක්‍රියාත්මක නිර්දේශයක් දෙන්න

ප්‍රතිදාන ආකෘතිය:
- කෙටි වාක්‍ය 4-6 ක්
- ලැයිස්තු ලකුණු නොයොදන්න
- අවසානයේ පැහැදිලි අවසාන උපදෙස් ඇතුළත් කරන්න
- **සිංහල භාෂාවෙන් පමණක්**
"""
