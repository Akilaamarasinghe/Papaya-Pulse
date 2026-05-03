import requests
import json
import os

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_URL ="https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent"


def generate_final_suggestion(
    *,
    color_ratios,
    weather_last_7_days,
    predictions,
    xai_explanations,
    temperature_for_taste: float,
    lang: str = 'en'
):
    """
    temperature_for_taste:
        low  (0.2–0.3) → conservative taste
        mid  (0.4–0.5) → balanced
        high (0.6–0.7) → bold / richer taste
    """

    prompt = build_prompt(
        color_ratios=color_ratios,
        weather=weather_last_7_days,
        preds=predictions,
        xai=xai_explanations,
        lang=lang
    )

    body = {
        "contents": [
            {
                "parts": [{"text": prompt}]
            }
        ],
        "generationConfig": {
            "temperature": temperature_for_taste,
            "maxOutputTokens": 180
        }
    }

    response = requests.post(
        f"{GEMINI_URL}?key={GEMINI_API_KEY}",
        headers={"Content-Type": "application/json"},
        json=body,
        timeout=30
    )

    if response.status_code != 200:
        raise RuntimeError(
            f"Gemini error {response.status_code}: {response.text}"
        )

    data = response.json()
    return data["candidates"][0]["content"]["parts"][0]["text"]


def build_prompt(*, color_ratios, weather, preds, xai, lang='en'):
    """
    This is the secret sauce 🧠🔥
    """
    lang_instruction = ""
    if lang == 'si':
        lang_instruction = "\nIMPORTANT: You MUST respond entirely in Sinhala (සිංහල) language only. Do not use any English words in your response.\n"

    return f"""You are an expert agricultural food-quality advisor.
{lang_instruction}
Your task:
Generate a FINAL consumer-friendly recommendation
based ONLY on the provided data.
Do NOT mention probabilities, SHAP, or machine learning explicitly.

DATA INPUTS:

1) Papaya surface color ratios:
- Green: {color_ratios['green']}
- Yellow: {color_ratios['yellow']}
- Orange: {color_ratios['orange']}

2) Weather conditions during last 7 days:
- Average temperature: {weather['avg_temp']} °C
- Maximum temperature: {weather['max_temp']} °C
- Minimum temperature: {weather['min_temp']} °C

3) Model predictions:
- Ripeness stage: {preds['ripeness_stage']}
- Expected taste: {preds['taste']}
- Quality grade: {preds['quality_grade']}
- Buying recommendation: {preds['buying_recommendation']}

4) Key influencing factors (importance-ranked):
{format_xai(xai)}

OUTPUT RULES:
- 3–5 short sentences
- Clear, confident, practical advice
- Mention ripeness, taste expectation, and buying advice
- Sound natural and helpful (like a fruit expert)
- Avoid technical language
- Respond in {'Sinhala (සිංහල)' if lang == 'si' else 'English'}

Now generate the final recommendation:
"""


def format_xai(xai):
    lines = []
    for model, data in xai.items():
        if "top_factors" in data:
            factors = ", ".join(
                f"{f['feature']} ({f['direction']})"
                for f in data["top_factors"]
            )
            lines.append(f"- {model}: {factors}")
    return "\n".join(lines)
