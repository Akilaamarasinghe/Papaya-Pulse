"""
crop_advisor.py
===============
AI-powered crop disease advisory engine for Southern Province Sri Lanka papaya farmers.
Target districts: Galle, Matara, Hambantota.

Provides:
  - Detailed farmer-friendly explanations in English and Sinhala (සිංහල)
  - Government (DoA) approved chemical and organic recommendations with PHI warnings
  - IPM-based prevention step library
  - Weather-based disease outlook narratives

Environment variables:
  GITHUB_TOKEN   – Personal Access Token for GitHub Models inference (required for AI enrichment)
  ADVISOR_MODEL  – Override model name (default: openai/gpt-4.1-mini)
"""

from __future__ import annotations

from llm_client import generate_advice_json, is_available as _llm_available

# ---------------------------------------------------------------------------
# Fertilizer label → human-readable (EN + SI)
# ---------------------------------------------------------------------------
FERT_LABEL_EN = {
    "BALANCED_NPK":              "Apply balanced NPK fertilizer (e.g. 12:12:12 or Muriate of Potash + Urea + TSP in equal proportion) as per DoA schedule.",
    "BALANCED_NPK_PLUS_ORGANIC": "Apply balanced NPK + 10 kg well-rotted compost or cow dung per plant. Organic matter improves soil water retention and plant immunity.",
    "REDUCE_N_INCREASE_K":       "Reduce nitrogen (Urea/Ammonium Sulphate) by 30–40%. Increase potassium (Muriate of Potash – MOP) to strengthen cell walls and improve disease resistance.",
    "POTASSIUM_BOOST":           "Apply an extra dose of Muriate of Potash (MOP – 60% K₂O) at 200–250 g/plant. Potassium improves fruit quality and disease tolerance.",
    "MICRONUTRIENT_FOLIAR_SPRAY":"Apply foliar micronutrient spray: Boron (Borax 0.2%), Zinc (ZnSO₄ 0.5%), Magnesium (MgSO₄ 1%) mixed together. Spray in early morning or evening.",
    "SKIP_FERTILIZER_TREAT_FIRST":"Do NOT apply fertiliser at this stage. Diseased plants cannot absorb nutrients efficiently. Focus all effort on disease treatment first. Resume fertilisation after recovery.",
}

FERT_LABEL_SI = {
    "BALANCED_NPK":              "සමතුලිත NPK පොහොර (12:12:12 හෝ ඉඳිකිරිය පොහොර + යූරියා + TSP සමාන ප්‍රමාණවලින්) DoA කාලසටහනකට අනුව යොදන්න.",
    "BALANCED_NPK_PLUS_ORGANIC": "සමතුලිත NPK + ශාකයකට kg 10 ක් හොඳින් දිරූ කම්පෝස්ට් ලෙස හෝ ගොනු දලදා යොදන්න. ජෛව ද්‍රව්‍ය ජල රඳවාගැනීම හා ශාක ප්‍රතිශක්තිකරණය වැඩිදියුණු කරයි.",
    "REDUCE_N_INCREASE_K":       "නයිට්‍රජන් (යූරියා/ඇමෝනියම් සල්ෆේට්) 30–40% කින් අඩු කරන්න. රෝග ප්‍රතිරෝධය ශක්තිමත් කිරීමට MOP පොහොර වැඩිකරන්න.",
    "POTASSIUM_BOOST":           "MOP (60% K₂O) ශාකයකට ග්‍රෑම් 200–250 ක් අතිරේකව යොදන්න. පොටෑසියම් ගෙඩිවල ගුණාත්මකභාවය හා රෝග ඉවසිලිවන්ත බව වැඩිදියුණු කරයි.",
    "MICRONUTRIENT_FOLIAR_SPRAY":"ගිනිතෙල් ද්‍රාවණ ඉසීම: Borax 0.2%, ZnSO₄ 0.5%, MgSO₄ 1% මිශ්‍ර කර අලූයම හෝ සවස ඉසින්න.",
    "SKIP_FERTILIZER_TREAT_FIRST":"මෙම අවස්ථාවේ පොහොර යොදන්න එපා. රෝගී ශාකවලට පෝෂකයන් ශෝෂණය කළ නොහැක. ශාකය සුව වූ පසු පොහොර දිගටම ලබාදෙන්න.",
}

# ---------------------------------------------------------------------------
# Prevention pack item → human-readable (EN + SI)
# ---------------------------------------------------------------------------
PREV_ITEM_EN = {
    "MANCOZEB_75WP":                  "Spray Mancozeb 75% WP at 2.5 g/L water. Apply every 10–14 days. Pre-harvest interval (PHI): 7 days. (DoA approved fungicide.)",
    "CHLOROTHALONIL_SPRAY":           "Apply Chlorothalonil 500 SC at 2 mL/L. Effective against anthracnose. PHI: 14 days.",
    "NEEM_OIL_SPRAY":                 "Spray neem oil (5 mL/L + few drops of dishwash soap as emulsifier). Safe organic option; apply weekly in the evening.",
    "TRICHODERMA_APPLICATION":        "Apply Trichoderma harzianum bio-fungicide to soil near the root zone (50 g/plant mixed in compost). Suppresses soil-borne fungal diseases.",
    "SANITATION_PRUNE":               "Prune and remove all infected leaves, branches and fruits. Burn or bury the removed material far from the plot. Disinfect pruning tools with bleach (1:9 dilution).",
    "DRAINAGE_MOISTURE_CONTROL":      "Ensure good field drainage; avoid waterlogging. Create raised beds if necessary. Maintain proper plant spacing for air circulation.",
    "FRUIT_BAGGING":                  "Bag fruits in paper or polythene bags from marble size onward to prevent anthracnose infection on fruit.",
    "VECTOR_CONTROL_MINERAL_OIL":     "Spray mineral (petroleum) oil at 1% concentration to deter aphids/whitefly without killing beneficial insects.",
    "REMOVE_INFECTED_PLANTS":         "Uproot and remove severely infected plants immediately. This is called 'roguing'. Bag and burn or bury removed plants well away from the field.",
    "REFLECTIVE_MULCH":               "Use silver/reflective plastic mulch between rows to confuse and repel aphid and thrips vectors.",
    "APHID_CONTROL_DIMETHOATE":       "If aphid infestation is confirmed, spray Dimethoate 40 EC at 1.5 mL/L (DoA approved). PHI: 21 days.",
    "WEED_MANAGEMENT":                "Remove all weeds around the plants — they serve as hosts for aphid and thrips populations.",
    "ABAMECTIN_1.8EC":                "Spray Abamectin 1.8 EC at 0.5 mL/L for mite control (DoA approved acaricide). PHI: 7 days. Rotate with another acaricide to prevent resistance.",
    "PROPARGITE_SPRAY":               "Apply Propargite 57 EC at 2 mL/L as an alternative acaricide. Do not spray during flowering.",
    "SULPHUR_DUST_APPLICATION":       "Dust wettable sulphur (Sulfex 80 WP at 2.5 g/L) early morning when dew is present. Effective against mites and powdery mildew.",
    "WATER_SPRAY_TO_DISLODGE":        "Use a strong jet of water spray (bottom-up on leaves) to dislodge mite colonies. Do this in the early morning.",
    "REMOVE_HEAVILY_INFESTED_LEAVES": "Cut and remove leaves with heavy mite or disease infestation to limit spread.",
    "THRIPS_CONTROL_SPINOSAD":        "Spray Spinosad (Tracer 45 SC at 0.3–0.5 mL/L) for thrips control (DoA approved, low mammalian toxicity). PHI: 3 days.",
    "WHITEFLY_CONTROL_IMIDACLOPRID":  "Apply Imidacloprid 200 SL at 0.3 mL/L for whitefly control (DoA registered). PHI: 7 days. Avoid spraying on flowers.",
    "CONSULT_EXTENSION_OFFICER":      "Contact your nearest Department of Agriculture (DoA) District Extension Officer for expert on-site assessment.",
    "INCREASE_SPRAY_FREQUENCY":       "In severe cases, increase spray frequency to every 7 days instead of the standard 10–14 days.",
    "MONITOR_CLOSELY_3DAYS":          "Re-inspect your plants every 2–3 days to track disease progression.",
    "PREVENTIVE_SPRAY_SCHEDULE":      "Begin a preventive spray schedule (even before symptoms appear) during high-risk weather periods.",
    "PREHARVEST_INTERVAL_CHECK":      "Always check the Pre-Harvest Interval (PHI) of any chemical used before allowing harvest.",
    "AVOID_SPRAY_DURING_FLOWERING":   "Do not spray pesticides during the flowering stage to protect pollinating insects.",
    "IPM_WARNING":                    "Follow Integrated Pest Management (IPM) principles — combine chemical, biological and cultural controls.",
}

PREV_ITEM_SI = {
    "MANCOZEB_75WP":                  "Mancozeb 75% WP ග්‍රෑම් 2.5/L ජලයට මිශ්‍ර කර ඉසින්න. දින 10–14ට වරක් ඉසීම කරන්න. PHI: දින 7. (කෘෂිකර්ම දෙපාර්තමේන්තු අනුමත කීටනාශකයකි.)",
    "CHLOROTHALONIL_SPRAY":           "Chlorothalonil 500 SC mL 2/L ජලයට මිශ්‍ර කර ඉසින්න. PHI: දින 14.",
    "NEEM_OIL_SPRAY":                 "නිම් තෙල් (mL 5/L + ස්වල්ප දිය සබන්) ඉසින්න. ජෛව ක්‍රමය; සතිය පාසා සවස ඉසීම කරන්න.",
    "TRICHODERMA_APPLICATION":        "Trichoderma harzianum ජෛව දිලීර නාශකය (g 50/ශාකය) කම්පෝස්ට් සමග මුල් ප්‍රදේශයේ යොදන්න.",
    "SANITATION_PRUNE":               "ආසාදිත කොළ, අතු, ගෙඩි ඉවත් කර ගිණිදමන්න. කප්පාදු මෙවලම් බ්ලීච් (1:9) දියේ විෂදේශ කරන්න.",
    "DRAINAGE_MOISTURE_CONTROL":      "හොඳ ජල ගැලීමක් ක්ෂේත්‍රයේ ඇති බව සහතික කරන්න. ජල ගැල්ම වළකින්න. ඉදිරි සැකිලිති ඇති කළ හැකිය.",
    "FRUIT_BAGGING":                  "ශාකමාල ප්‍රමාණ ගෙඩිවලට කාගිත හෝ බ්ලාස්ටික් මලු දමා ආසාදනය ඩැහැගැනීම වළකින්න.",
    "VECTOR_CONTROL_MINERAL_OIL":     "ඛනිජ තෙල් 1% ද්‍රාවණය ඉසීමෙන් කෘමි-ගෙන-එන (aphid/whitefly) කෘමීන් ඉවතලන්න.",
    "REMOVE_INFECTED_PLANTS":         "දරුණු ලෙස ආසාදිත ශාක ඉවත් කර (roguing) ඔය කෙළවරේ ගිණිදමන්න. ශාකය ක්ෂේත්‍රයෙන් ඈත් කරන්න.",
    "REFLECTIVE_MULCH":               "රිදී ශ්‍රේෂ්ඨ ප්ලාස්ටික් ආවරණ (reflective mulch) ශාක රේඛා අතර යොදා ගොංකා/thrips තාරාදී කරන්න.",
    "APHID_CONTROL_DIMETHOATE":       "ගොංකා ආසාදනයක් ඇතිවුණොත්, Dimethoate 40 EC mL 1.5/L (DoA අනුමත) ඉසින්න. PHI: දින 21.",
    "WEED_MANAGEMENT":                "ශාකවල අවට සියලු වල් ඉවත් කරන්න — ඒවා කෘමි ගොදුරු ලෙස ක්‍රියා කරයි.",
    "ABAMECTIN_1.8EC":                "Abamectin 1.8 EC mL 0.5/L (DoA අනුමත) ඉසින්න. PHI: දින 7.",
    "PROPARGITE_SPRAY":               "Propargite 57 EC mL 2/L ගෙනෙල් මාරු ලෙස ඉසින්න. මල් පිපෙන අවස්ථාවේ ඉසීම නොකරන්න.",
    "SULPHUR_DUST_APPLICATION":       "Sulfex 80 WP g 2.5/L ජලයට විසිකර ඉසීමෙන් ගෙනෙල් හා දිලීර ආසාදන පාලනය කරන්න.",
    "WATER_SPRAY_TO_DISLODGE":        "ශක්තිමත් ජල ඉසිවරයක් (කොළ යට සිට) ගෙනෙල් ගොනු ඉවතලන්න. උදේ කාලයේ කරන්න.",
    "REMOVE_HEAVILY_INFESTED_LEAVES": "රෝගයෙන් බෙහෙවින් ආසාදිත කොළ ඉවත් කර ව්‍යාප්තිය සීමා කරන්න.",
    "THRIPS_CONTROL_SPINOSAD":        "Spinosad (Tracer 45 SC mL 0.3–0.5/L, DoA අනුමත) thrips පාලනය කරන්න. PHI: දින 3.",
    "WHITEFLY_CONTROL_IMIDACLOPRID":  "Imidacloprid 200 SL mL 0.3/L (DoA ලියාපදිංචි) සුදු මැස්සන් පාලනය කරන්න. PHI: දින 7. මල් ස්ථානවල ඉසීම වළකින්න.",
    "CONSULT_EXTENSION_OFFICER":      "ඔබේ ආසන්නතම කෘෂිකර්ම දෙපාර්තමේන්තු දිස්ත්‍රික් දිගු නිලධාරියාව හමු වන්න.",
    "INCREASE_SPRAY_FREQUENCY":       "දරුණු අවස්ථාවලදී ඉසිවිම සෑම දින 7 කට වරක් කරන්න.",
    "MONITOR_CLOSELY_3DAYS":          "ශාකය දින 2–3 ට වරක් නැවත පරීක්ෂා කරන්න.",
    "PREVENTIVE_SPRAY_SCHEDULE":      "ඉහළ අවදානම් කාලගුණ කාලපරිච්ඡේදවලදී රෝග ලක්ෂණ නොමැතිව වුවද වැළකීමේ ඉසිවිම ආරම්භ කරන්න.",
    "PREHARVEST_INTERVAL_CHECK":      "ගෙඩි නෙළීමට පෙර යොදා ගත් රසායනවල PHI (සාළු-කාල) සැමවිටම පරීක්ෂා කරන්න.",
    "AVOID_SPRAY_DURING_FLOWERING":   "මල් කාලයේ කෘමිනාශක ඉසිවිම නොකරන්න. මලකරු කෘමීන් ආරක්ෂා කරන්න.",
    "IPM_WARNING":                    "IPM (ඒකාබද්ධ කෘමිනාශ කළමනාකරණ) මූලධර්ම අනුව – රසායනික, ජීවීය හා සංස්කෘතික ක්‍රම ඒකාබද්ධ කරන්න.",
}


# ---------------------------------------------------------------------------
# Internal prompt builder (not exposed externally)
# ---------------------------------------------------------------------------
def _build_advisory_prompt(disease: str, severity: str, growth_stage: str,
                            fertilizer_action: str, prevention_pack: str,
                            weather_risk: str, district: str | None) -> str:
    district_str = district if district else "Southern Province, Sri Lanka"
    prev_items   = prevention_pack.split("|") if prevention_pack else []
    fert_en      = FERT_LABEL_EN.get(fertilizer_action, fertilizer_action)
    prev_en      = "\n".join(f"  • {PREV_ITEM_EN.get(p, p)}" for p in prev_items)

    return f"""You are an expert agricultural advisor for papaya farmers in the Southern Province of Sri Lanka (Galle, Matara, Hambantota districts).
A farmer in {district_str} has detected the following on their papaya plantation:

Disease        : {disease}
Severity Level : {severity}
Growth Stage   : {growth_stage}
Weather Risk   : {weather_risk}
Fertilizer Rec : {fert_en}
Prevention Steps:
{prev_en}

RULES (MUST follow — no exceptions):
  1. You MUST NOT recommend any chemical, product, or dosage that is not explicitly listed in the Prevention Steps above.
  2. You MUST NOT change or invent Pre-Harvest Interval (PHI) values. If PHI is listed in a step, use it exactly. If not listed, say "Check the label PHI."
  3. You MUST respond ONLY with a valid JSON object — no markdown fences, no extra text before or after the JSON.
  4. If you are unsure about any recommendation, advise the farmer to contact the DoA extension officer.

Your task:
1. Write a concise, farmer-friendly paragraph in ENGLISH explaining:
   - What this disease is in simple terms
   - Why the weather risk is {weather_risk}
   - What the farmer should do FIRST (most urgent action)
   - One key thing to AVOID

2. Write the EXACT SAME advice in clear SINHALA (සිංහල).
   Use everyday farming words, not scientific terms.

3. Add a "Future Outlook (7 days)" section in both languages:
   - What might happen if conditions don't change?
   - When should the farmer contact the DoA extension officer?

Respond ONLY with a valid JSON object with these exact keys:
  "advice_en"        : English full advice text
  "advice_si"        : Sinhala full advice text
  "outlook_en"       : 7-day outlook in English
  "outlook_si"       : 7-day outlook in Sinhala
  "urgent_action_en" : ONE most urgent action (English, max 2 sentences)
  "urgent_action_si" : ONE most urgent action (Sinhala, max 2 sentences)
  "confidence"       : confidence level in this advice (0.0 to 1.0)"""


# ---------------------------------------------------------------------------
# Main public function
# ---------------------------------------------------------------------------
def get_crop_advice(
    disease: str,
    severity: str,
    growth_stage: str,
    fertilizer_action: str,
    prevention_pack: str,
    weather_risk: str = "MEDIUM",
    district: str | None = None,
    retries: int = 2,
) -> dict:
    """
    Generate enriched, farmer-friendly disease management advice.

    Returns dict with keys:
        advice_en, advice_si, outlook_en, outlook_si,
        urgent_action_en, urgent_action_si, confidence,
        ai_enriched (bool), prevention_en, prevention_si,
        fertilizer_en, fertilizer_si

    Falls back to structured static content if AI enrichment is unavailable.
    """
    fert_en      = FERT_LABEL_EN.get(fertilizer_action, fertilizer_action)
    fert_si      = FERT_LABEL_SI.get(fertilizer_action, fertilizer_action)
    prev_items   = prevention_pack.split("|") if prevention_pack else []
    prev_en_list = [PREV_ITEM_EN.get(p, p) for p in prev_items]
    prev_si_list = [PREV_ITEM_SI.get(p, p) for p in prev_items]

    fallback = {
        "advice_en":        f"Your papaya plant shows {severity} {disease}. {fert_en}",
        "advice_si":        f"ඔබේ ගස් {severity} {disease} රෝගයෙන් පෙළෙනවා. {fert_si}",
        "outlook_en":       "Monitor closely over the next 7 days. If symptoms worsen, contact the DoA extension officer.",
        "outlook_si":       "ළඟ දින 7 ශාකය හොඳින් නිරීක්ෂණය කරන්න. ලක්ෂණ ගිහිවුනොත් DoA නිලධාරියාව ඇමතීම කරන්න.",
        "urgent_action_en": prev_en_list[0] if prev_en_list else "Inspect plants daily and apply preventive treatment.",
        "urgent_action_si": prev_si_list[0] if prev_si_list else "දිනපතා ශාක පරීක්ෂා කර වැළකීමේ ප්‍රතිකාරය යොදන්න.",
        "confidence":       0.75,
        "ai_enriched":      False,
        "prevention_en":    prev_en_list,
        "prevention_si":    prev_si_list,
        "fertilizer_en":    fert_en,
        "fertilizer_si":    fert_si,
    }

    if not _llm_available():
        return fallback

    prompt = _build_advisory_prompt(
        disease, severity, growth_stage, fertilizer_action,
        prevention_pack, weather_risk, district
    )

    result = generate_advice_json(prompt, retries=retries)

    if not result:
        # Total failure – all retries exhausted
        return fallback

    if "_raw" in result:
        # JSON decode failed; surface raw text in advice_en
        fallback["advice_en"]   = result["_raw"]
        fallback["ai_enriched"] = True
        return fallback

    # Success – merge static lists into parsed result
    result["ai_enriched"]   = True
    result["prevention_en"] = prev_en_list
    result["prevention_si"] = prev_si_list
    result["fertilizer_en"] = fert_en
    result["fertilizer_si"] = fert_si
    return result
