import requests
import os

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/"
    "models/gemini-2.5-flash-lite:generateContent"
)

def generate_market_suggestion(payload, temperature=0.45):
    """
    Gemini is responsible ONLY for human-level reasoning & advice.
    """

    prompt = build_prompt(payload)

    body = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {
            "temperature": temperature,
            "maxOutputTokens": 220
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

