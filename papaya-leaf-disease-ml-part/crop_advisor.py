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
# Prevention step metadata — structured info per step code
# Used to give farmers precise dosage / timing / safety / type information.
# category: "fungicide" | "acaricide" | "insecticide" | "biological" |
#           "organic"   | "cultural"  | "monitoring"   | "ppe"
# type:     "chemical_inorganic" | "chemical_organic" | "biological" | "cultural"
# ---------------------------------------------------------------------------
PREV_META: dict[str, dict] = {
    "MANCOZEB_75WP": {
        "category": "fungicide",
        "type": "chemical_inorganic",
        "product_name": "Mancozeb 75% WP (e.g. Dithane M-45, Indofil M-45)",
        "dosage": "2.5 g per 1 litre of water",
        "frequency": "Every 10–14 days",
        "phi_days": 7,
        "timing": "Early morning or evening (avoid midday heat)",
        "how_to_mix": "Add 2.5 g of Mancozeb powder to 1 L clean water. Stir well until dissolved. Use within the same day.",
        "how_to_apply": "Use a knapsack or motorised sprayer. Cover both upper and lower leaf surfaces thoroughly until just dripping. Start from the outermost canopy and work inward.",
        "safety": "Wear gloves, mask, and goggles. Do not eat, drink or smoke while spraying. Wash hands and face after use.",
        "doa_approved": True,
        "organic": False,
    },
    "CHLOROTHALONIL_SPRAY": {
        "category": "fungicide",
        "type": "chemical_inorganic",
        "product_name": "Chlorothalonil 500 SC (e.g. Daconil)",
        "dosage": "2 mL per 1 litre of water",
        "frequency": "Every 10–14 days",
        "phi_days": 14,
        "timing": "Early morning or evening",
        "how_to_mix": "Measure 2 mL of Chlorothalonil 500 SC concentrate into 1 L of water. Shake/stir well.",
        "how_to_apply": "Spray evenly on all leaf surfaces including undersides. Avoid run-off. Alternate with Mancozeb to prevent fungicide resistance.",
        "safety": "Wear full protective clothing. Avoid breathing spray mist. Keep away from water bodies (toxic to fish).",
        "doa_approved": True,
        "organic": False,
    },
    "NEEM_OIL_SPRAY": {
        "category": "insecticide",
        "type": "chemical_organic",
        "product_name": "Neem Oil (cold-pressed, 1500 ppm azadirachtin or higher)",
        "dosage": "5 mL neem oil + 1–2 drops liquid dishwash soap per 1 litre of water",
        "frequency": "Every 7 days",
        "phi_days": 0,
        "timing": "Late evening (after 5 PM) — neem degrades in direct sunlight",
        "how_to_mix": "Add soap first to water, then slowly add neem oil while stirring continuously. This creates an emulsion. Mix fresh each time — do not store prepared solution.",
        "how_to_apply": "Spray on all leaf surfaces (top and bottom). Also spray on stem base. Use within 8 hours of mixing.",
        "safety": "Generally safe. Avoid spraying near bee hives. Wear basic gloves. Safe during flowering stage.",
        "doa_approved": True,
        "organic": True,
    },
    "TRICHODERMA_APPLICATION": {
        "category": "biological",
        "type": "biological",
        "product_name": "Trichoderma harzianum bio-fungicide (e.g. Bioway, Tricho-Gold)",
        "dosage": "50 g per plant, mixed into compost or soil",
        "frequency": "Once a month or after heavy rain",
        "phi_days": 0,
        "timing": "After rain or irrigation when soil is moist",
        "how_to_mix": "Mix 50 g of Trichoderma powder into 1 kg of well-rotted compost. Let the mixture rest for 24 hours before applying.",
        "how_to_apply": "Apply the compost-Trichoderma mix around the base of each plant (root zone). Lightly water after application. Keep away from direct sunlight after mixing.",
        "safety": "Non-toxic. Safe for humans, animals and beneficial insects. Store in a cool, dry place.",
        "doa_approved": True,
        "organic": True,
    },
    "SANITATION_PRUNE": {
        "category": "cultural",
        "type": "cultural",
        "product_name": "Pruning + Bleach disinfection",
        "dosage": "1 part bleach to 9 parts water for tool disinfection",
        "frequency": "Weekly or whenever diseased material is seen",
        "phi_days": None,
        "timing": "Early morning (reduces stress on plants)",
        "how_to_mix": "Mix 1 cup of household bleach into 9 cups of water for tool dipping solution.",
        "how_to_apply": "Use clean, sharp pruning shears. Remove all infected leaves, branches and fruit. Dip the blade in bleach solution after each cut. Collect all removed material in a bag and burn far from the field — never compost diseased material.",
        "safety": "Wear gloves. Bleach is corrosive — avoid contact with eyes. Wash tools with clean water after disinfection to prevent rusting.",
        "doa_approved": True,
        "organic": True,
    },
    "DRAINAGE_MOISTURE_CONTROL": {
        "category": "cultural",
        "type": "cultural",
        "product_name": "Field drainage improvement",
        "dosage": None,
        "frequency": "Ongoing (especially from May–November monsoon season)",
        "phi_days": None,
        "timing": "Before and during rainy season",
        "how_to_mix": None,
        "how_to_apply": "Create shallow drainage channels between plant rows. If waterlogging occurs, make raised beds 30–45 cm high. Maintain at least 2.5 m plant spacing. Avoid over-irrigation — check soil moisture before irrigating.",
        "safety": "No chemical hazard.",
        "doa_approved": True,
        "organic": True,
    },
    "FRUIT_BAGGING": {
        "category": "cultural",
        "type": "cultural",
        "product_name": "Paper or polythene fruit bags",
        "dosage": "One bag per fruit at marble-size stage (approx. 2–3 cm diameter)",
        "frequency": "Once per fruit at marble-size; leave on until harvest",
        "phi_days": None,
        "timing": "When fruits are marble-sized (early fruiting stage)",
        "how_to_mix": None,
        "how_to_apply": "Gently slip a paper bag or clean polythene bag over each small fruit. Secure the open end loosely around the stem with a rubber band or twist tie. Do not seal completely — allow some air flow. Remove 1 week before harvest for colour development.",
        "safety": "No chemical hazard.",
        "doa_approved": True,
        "organic": True,
    },
    "VECTOR_CONTROL_MINERAL_OIL": {
        "category": "insecticide",
        "type": "chemical_organic",
        "product_name": "Mineral/Petroleum oil spray (e.g. Citrole C96, Sunspray)",
        "dosage": "10 mL petroleum oil per 1 litre of water (1% solution)",
        "frequency": "Every 7–10 days",
        "phi_days": 0,
        "timing": "Early morning or late evening",
        "how_to_mix": "Measure 10 mL of mineral oil into 1 L of water. Add 1–2 drops of liquid soap as an emulsifier. Shake or stir vigorously before and during spraying.",
        "how_to_apply": "Spray on leaf undersides (where aphids and whiteflies hide). Cover the entire plant including stem. Shake the sprayer frequently to keep the oil emulsified.",
        "safety": "Low toxicity. Avoid spraying during high temperature (above 35°C) — may cause leaf burn. Safe near beneficial insects.",
        "doa_approved": True,
        "organic": True,
    },
    "REMOVE_INFECTED_PLANTS": {
        "category": "cultural",
        "type": "cultural",
        "product_name": "Plant roguing (physical removal)",
        "dosage": "Remove 100% of severely infected plants",
        "frequency": "Immediately when severe infection is confirmed",
        "phi_days": None,
        "timing": "As soon as possible — do not delay",
        "how_to_mix": None,
        "how_to_apply": "Uproot the entire plant including roots. Place immediately into a thick plastic bag. Remove from the field and burn far away. Do NOT compost these plants. Mark the location and monitor surrounding plants daily for 2 weeks.",
        "safety": "Wear gloves. Wash hands after handling diseased plants.",
        "doa_approved": True,
        "organic": True,
    },
    "REFLECTIVE_MULCH": {
        "category": "cultural",
        "type": "cultural",
        "product_name": "Silver/reflective plastic mulch film",
        "dosage": "Cover full ground area between plant rows",
        "frequency": "Apply at planting or at first sign of vector infestation",
        "phi_days": None,
        "timing": "Before or during early growth stage for best effect",
        "how_to_mix": None,
        "how_to_apply": "Lay silver-side-up reflective mulch between plant rows. Secure edges with soil or pegs. The reflected UV light confuses and repels aphids, thrips and whiteflies from landing on lower leaf surfaces.",
        "safety": "No chemical hazard. Replace when mulch becomes dirty or non-reflective.",
        "doa_approved": True,
        "organic": True,
    },
    "APHID_CONTROL_DIMETHOATE": {
        "category": "insecticide",
        "type": "chemical_inorganic",
        "product_name": "Dimethoate 40 EC (systemic insecticide)",
        "dosage": "1.5 mL per 1 litre of water",
        "frequency": "Only when aphid infestation is confirmed — maximum 2 times per season",
        "phi_days": 21,
        "timing": "Early morning only. Do NOT spray during flowering.",
        "how_to_mix": "Measure exactly 1.5 mL Dimethoate into 1 L of water. Do not mix with other pesticides.",
        "how_to_apply": "Spray directly onto aphid colonies (usually on young shoots and leaf undersides). Apply once and wait 5 days before reassessing. Use as a last resort after organic methods fail.",
        "safety": "HIGHLY TOXIC — wear full PPE (gloves, goggles, coveralls, respirator). Do not enter treated area for 24 hours. Very long PHI of 21 days. Toxic to bees and fish.",
        "doa_approved": True,
        "organic": False,
    },
    "WEED_MANAGEMENT": {
        "category": "cultural",
        "type": "cultural",
        "product_name": "Manual or mechanical weed removal",
        "dosage": None,
        "frequency": "Every 2–3 weeks or as weeds appear",
        "phi_days": None,
        "timing": "Anytime — do not let weeds flower and seed",
        "how_to_mix": None,
        "how_to_apply": "Hand-pull or hoe all weeds within and around the plantation. Pay special attention to grassy weeds which host thrips and aphid populations. Mulch between rows to suppress regrowth.",
        "safety": "No chemical hazard.",
        "doa_approved": True,
        "organic": True,
    },
    "ABAMECTIN_1.8EC": {
        "category": "acaricide",
        "type": "chemical_inorganic",
        "product_name": "Abamectin 1.8 EC (e.g. Vertimec, Agrimec)",
        "dosage": "0.5 mL per 1 litre of water",
        "frequency": "Every 14 days. Rotate with Propargite to prevent resistance.",
        "phi_days": 7,
        "timing": "Early morning or late evening. Do NOT spray in wind.",
        "how_to_mix": "Measure exactly 0.5 mL of Abamectin 1.8 EC per 1 L of water. Do not exceed recommended dose — higher doses cause phytotoxicity.",
        "how_to_apply": "Spray directly onto both sides of leaves where mites are visible. Thorough coverage of leaf undersides is essential as mites live there. Repeat after 14 days with a different acaricide (alternate with Propargite).",
        "safety": "Toxic to bees and aquatic life. Wear full PPE. Keep away from water bodies. Do not spray near beehives.",
        "doa_approved": True,
        "organic": False,
    },
    "PROPARGITE_SPRAY": {
        "category": "acaricide",
        "type": "chemical_inorganic",
        "product_name": "Propargite 57 EC (e.g. Omite)",
        "dosage": "2 mL per 1 litre of water",
        "frequency": "Every 14 days, alternating with Abamectin",
        "phi_days": 14,
        "timing": "Early morning. Do NOT spray during flowering — harmful to pollinators.",
        "how_to_mix": "Measure 2 mL of Propargite concentrate per 1 L of water. Wear gloves when measuring.",
        "how_to_apply": "Apply to leaf undersides thoroughly. Use as a rotation partner with Abamectin to prevent mite resistance. Do not apply more than twice consecutively.",
        "safety": "Moderately toxic. Wear gloves, goggles and mask. Avoid contact with skin and eyes.",
        "doa_approved": True,
        "organic": False,
    },
    "SULPHUR_DUST_APPLICATION": {
        "category": "fungicide",
        "type": "chemical_organic",
        "product_name": "Wettable Sulphur (Sulfex 80 WP)",
        "dosage": "2.5 g per 1 litre of water (for spray) OR dust directly at 20–30 g per plant",
        "frequency": "Every 7–10 days",
        "phi_days": 3,
        "timing": "Very early morning when dew is present (improves adhesion)",
        "how_to_mix": "For spray: dissolve 2.5 g Sulfex in 1 L water. For dust: apply powder directly onto plant using a duster in early morning.",
        "how_to_apply": "Cover all leaf surfaces including undersides with a thin sulfur film. Do NOT apply when temperature exceeds 35°C — causes phytotoxicity (leaf burn). Effective against both mites and powdery mildew.",
        "safety": "Wear a dust mask when applying as powder — sulphur dust irritates lungs. Avoid contact with eyes.",
        "doa_approved": True,
        "organic": True,
    },
    "WATER_SPRAY_TO_DISLODGE": {
        "category": "cultural",
        "type": "cultural",
        "product_name": "Pressurised water spray",
        "dosage": "Strong jet, covering all leaf undersides",
        "frequency": "Daily during active mite infestation",
        "phi_days": None,
        "timing": "Early morning (before 9 AM)",
        "how_to_mix": None,
        "how_to_apply": "Using a garden hose or sprayer set to a strong jet, spray upward onto the undersides of all leaves. Mites cannot fly and many drown or cannot reattach after being washed off. Follow immediately with a chemical or neem spray.",
        "safety": "No chemical hazard. Avoid wetting stem base excessively (risk of root rot if overdone).",
        "doa_approved": True,
        "organic": True,
    },
    "REMOVE_HEAVILY_INFESTED_LEAVES": {
        "category": "cultural",
        "type": "cultural",
        "product_name": "Manual leaf removal",
        "dosage": "Remove leaves with > 50% infestation or disease coverage",
        "frequency": "Immediately, then check every 2–3 days",
        "phi_days": None,
        "timing": "Morning",
        "how_to_mix": None,
        "how_to_apply": "Wear gloves. Using clean scissors or a knife, cut off heavily infested leaves at the petiole (stalk). Place directly into a sealed bag — do not shake or carry openly as this spreads mites or spores to other plants. Burn or bury the removed leaves away from the field.",
        "safety": "Wear gloves. Wash hands well after handling infested leaves.",
        "doa_approved": True,
        "organic": True,
    },
    "THRIPS_CONTROL_SPINOSAD": {
        "category": "insecticide",
        "type": "chemical_organic",
        "product_name": "Spinosad (Tracer 45 SC, SpinTor)",
        "dosage": "0.3–0.5 mL per 1 litre of water",
        "frequency": "Every 7–10 days (maximum 4 applications per season)",
        "phi_days": 3,
        "timing": "Late evening (Spinosad is photodegradable — degrades in sunlight)",
        "how_to_mix": "Add 0.3 to 0.5 mL of Tracer 45 SC into 1 L clean water. Mix gently. Do not mix with copper-based fungicides.",
        "how_to_apply": "Spray on all plant surfaces — especially young leaves and flower buds where thrips feed. Rotate with a different insecticide class after every 2 applications to prevent resistance.",
        "safety": "Low mammalian toxicity. Safe for most beneficial insects when dry. Avoid spraying directly on open flowers or near beehives.",
        "doa_approved": True,
        "organic": True,
    },
    "WHITEFLY_CONTROL_IMIDACLOPRID": {
        "category": "insecticide",
        "type": "chemical_inorganic",
        "product_name": "Imidacloprid 200 SL (e.g. Confidor, Admire)",
        "dosage": "0.3 mL per 1 litre of water",
        "frequency": "Every 14–21 days. Maximum 2 applications per season.",
        "phi_days": 7,
        "timing": "Early morning. NEVER spray during flowering — highly toxic to bees.",
        "how_to_mix": "Measure 0.3 mL Imidacloprid into 1 L of water. Mix well. Can also be applied as a soil drench at 1 mL/L if foliar spray is not possible.",
        "how_to_apply": "Spray on leaf undersides where whiteflies congregate. For systemic uptake, apply as a soil drench near root zone (plants absorb through roots). Effect lasts 3–4 weeks via systemic action.",
        "safety": "TOXIC TO BEES — never spray on flowers or when bees are active. Wear full PPE. Keep children and animals away from sprayed area for 24 hours.",
        "doa_approved": True,
        "organic": False,
    },
    "CONSULT_EXTENSION_OFFICER": {
        "category": "monitoring",
        "type": "cultural",
        "product_name": "Department of Agriculture Extension Service",
        "dosage": None,
        "frequency": "When in doubt or when situation is escalating",
        "phi_days": None,
        "timing": "As soon as possible",
        "how_to_mix": None,
        "how_to_apply": "Contact your nearest District Department of Agriculture (DoA) office. In Southern Province: Galle (0912222252), Matara (0412222253), Hambantota (0472220031). Field officers provide free on-site visits.",
        "safety": "N/A",
        "doa_approved": True,
        "organic": True,
    },
    "INCREASE_SPRAY_FREQUENCY": {
        "category": "monitoring",
        "type": "cultural",
        "product_name": "Intensified spray schedule",
        "dosage": "Same dosage — increase to every 7 days instead of 10–14",
        "frequency": "Every 7 days during severe outbreak",
        "phi_days": None,
        "timing": "Same as the primary chemical being applied",
        "how_to_mix": None,
        "how_to_apply": "Continue with the same chemical at the same dose but reduce the interval to 7 days. After 3 applications, reassess and revert to 10–14 day intervals if disease is controlled. Always respect the PHI of the chemical used.",
        "safety": "Always check PHI before harvesting — more frequent spray = be more careful about harvest timing.",
        "doa_approved": True,
        "organic": False,
    },
    "MONITOR_CLOSELY_3DAYS": {
        "category": "monitoring",
        "type": "cultural",
        "product_name": "Intensive crop monitoring",
        "dosage": None,
        "frequency": "Every 2–3 days",
        "phi_days": None,
        "timing": "Early morning (best light to spot disease signs)",
        "how_to_mix": None,
        "how_to_apply": "Walk through the entire plantation. Inspect at least 10% of plants in each row. Check young leaves for new symptoms. Note any spread pattern (one area vs scattered). Take photos with your phone to track progression. Contact DoA if situation worsens.",
        "safety": "No chemical hazard.",
        "doa_approved": True,
        "organic": True,
    },
    "PREVENTIVE_SPRAY_SCHEDULE": {
        "category": "monitoring",
        "type": "cultural",
        "product_name": "Preventive spray programme",
        "dosage": "Refer to the primary chemical dosage in your prevention pack",
        "frequency": "Every 14 days during high-risk periods (rainy season, high humidity)",
        "phi_days": None,
        "timing": "Early morning or evening",
        "how_to_mix": None,
        "how_to_apply": "Begin a calendar-based spray routine even before symptoms appear. Alternate between two chemicals to prevent resistance (e.g. Mancozeb one application, Chlorothalonil next). Keep a spray diary with date, product, dose and weather.",
        "safety": "Always maintain PHI. Do not double-dose thinking 'more is better' — it increases costs and resistance risk.",
        "doa_approved": True,
        "organic": False,
    },
    "IPM_WARNING": {
        "category": "monitoring",
        "type": "cultural",
        "product_name": "Integrated Pest Management (IPM)",
        "dosage": None,
        "frequency": "Ongoing principle — not a one-time action",
        "phi_days": None,
        "timing": "Always",
        "how_to_mix": None,
        "how_to_apply": "IPM means combining: (1) Cultural controls first — sanitation, spacing, drainage; (2) Biological controls — Trichoderma, neem; (3) Chemical controls LAST — only when thresholds are crossed. This reduces costs, protects beneficial insects, and prevents pesticide resistance.",
        "safety": "Following IPM protects your health, your family, and the environment. Avoid overuse of chemicals.",
        "doa_approved": True,
        "organic": True,
    },
}

# Convenience: category display labels
CATEGORY_LABEL_EN = {
    "fungicide":          "Fungicide",
    "acaricide":          "Acaricide (Mite Control)",
    "insecticide":        "Insecticide",
    "biological":         "Biological Control",
    "cultural":           "Cultural / Farm Practice",
    "monitoring":         "Monitoring / Management",
}
CATEGORY_LABEL_SI = {
    "fungicide":          "දිලීර නාශකය",
    "acaricide":          "ගෙනෙල් නාශකය",
    "insecticide":        "කෘමිනාශකය",
    "biological":         "ජීවීය පාලනය",
    "cultural":           "ගොවිතැන් ක්‍රමවේදය",
    "monitoring":         "නිරීක්ෂණ / කළමනාකරණ",
}
TYPE_LABEL_EN = {
    "chemical_inorganic": "Inorganic Chemical",
    "chemical_organic":   "Organic-based Chemical",
    "biological":         "Biological",
    "cultural":           "Cultural Practice",
}
TYPE_LABEL_SI = {
    "chemical_inorganic": "අකාබනික රසායනය",
    "chemical_organic":   "කාබනික රසායනය",
    "biological":         "ජීවීය",
    "cultural":           "ගොවිතැන් ක්‍රමවේදය",
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
    prev_en      = "\n".join(f"  • [{p}] {PREV_ITEM_EN.get(p, p)}" for p in prev_items)
    step_codes   = ", ".join(f'"{p}"' for p in prev_items)

    return f"""You are an expert agricultural advisor for papaya farmers in the Southern Province of Sri Lanka (Galle, Matara, Hambantota districts).
A farmer in {district_str} has detected the following on their papaya plantation:

Disease        : {disease}
Severity Level : {severity}
Growth Stage   : {growth_stage}
Weather Risk   : {weather_risk}
Fertilizer Rec : {fert_en}
Prevention Steps (each prefixed with its CODE in brackets):
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

4. For each prevention step code ({step_codes}), write a concise farmer-friendly "How to Use" guide (2–4 sentences each) covering:
   - Exactly when and how to apply it
   - Key safety reminder
   - One common mistake to avoid
   Write each guide in both English and Sinhala.

Respond ONLY with a valid JSON object with these exact keys:
  "advice_en"        : English full advice text
  "advice_si"        : Sinhala full advice text
  "outlook_en"       : 7-day outlook in English
  "outlook_si"       : 7-day outlook in Sinhala
  "urgent_action_en" : ONE most urgent action (English, max 2 sentences)
  "urgent_action_si" : ONE most urgent action (Sinhala, max 2 sentences)
  "confidence"       : confidence level in this advice (0.0 to 1.0)
  "per_step_guide"   : array of objects, one per prevention step code, each with:
                         "code"       : the step code string exactly as provided
                         "how_to_en"  : 2-4 sentence application guide in English
                         "how_to_si"  : same guide in Sinhala
                         "warning_en" : one key safety/mistake warning in English
                         "warning_si" : same warning in Sinhala"""


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
        prevention_detailed (list of step objects with metadata + AI guide),
        fertilizer_en, fertilizer_si

    Falls back to structured static content if AI enrichment is unavailable.
    """
    fert_en      = FERT_LABEL_EN.get(fertilizer_action, fertilizer_action)
    fert_si      = FERT_LABEL_SI.get(fertilizer_action, fertilizer_action)
    prev_items   = prevention_pack.split("|") if prevention_pack else []
    prev_en_list = [PREV_ITEM_EN.get(p, p) for p in prev_items]
    prev_si_list = [PREV_ITEM_SI.get(p, p) for p in prev_items]

    def _build_prevention_detailed(per_step_guide: list | None) -> list:
        """Merge static PREV_META + text with AI per-step guides."""
        # Build lookup: code -> ai guide entry
        guide_map: dict[str, dict] = {}
        if per_step_guide:
            for entry in per_step_guide:
                if isinstance(entry, dict) and "code" in entry:
                    guide_map[entry["code"]] = entry

        detailed = []
        for idx, code in enumerate(prev_items):
            meta    = PREV_META.get(code, {})
            ai_step = guide_map.get(code, {})
            cat     = meta.get("category", "cultural")
            tp      = meta.get("type", "cultural")
            detailed.append({
                "step":            idx + 1,
                "code":            code,
                "name_en":         meta.get("product_name") or PREV_ITEM_EN.get(code, code),
                "description_en":  PREV_ITEM_EN.get(code, code),
                "description_si":  PREV_ITEM_SI.get(code, code),
                # type / category
                "type":            tp,
                "type_label_en":   TYPE_LABEL_EN.get(tp, tp),
                "type_label_si":   TYPE_LABEL_SI.get(tp, tp),
                "category":        cat,
                "category_label_en": CATEGORY_LABEL_EN.get(cat, cat),
                "category_label_si": CATEGORY_LABEL_SI.get(cat, cat),
                "organic":         meta.get("organic", True),
                # dosage / scheduling
                "dosage":          meta.get("dosage"),
                "frequency":       meta.get("frequency"),
                "phi_days":        meta.get("phi_days"),
                "timing":          meta.get("timing"),
                # static how-to from PREV_META
                "how_to_mix":      meta.get("how_to_mix"),
                "how_to_apply":    meta.get("how_to_apply"),
                "safety":          meta.get("safety"),
                # AI-generated how-to (may be None if AI unavailable)
                "ai_how_to_en":    ai_step.get("how_to_en"),
                "ai_how_to_si":    ai_step.get("how_to_si"),
                "ai_warning_en":   ai_step.get("warning_en"),
                "ai_warning_si":   ai_step.get("warning_si"),
                "doa_approved":    meta.get("doa_approved", True),
            })
        return detailed

    fallback = {
        "advice_en":           f"Your papaya plant shows {severity} {disease}. {fert_en}",
        "advice_si":           f"ඔබේ ගස් {severity} {disease} රෝගයෙන් පෙළෙනවා. {fert_si}",
        "outlook_en":          "Monitor closely over the next 7 days. If symptoms worsen, contact the DoA extension officer.",
        "outlook_si":          "ළඟ දින 7 ශාකය හොඳින් නිරීක්ෂණය කරන්න. ලක්ෂණ ගිහිවුනොත් DoA නිලධාරියාව ඇමතීම කරන්න.",
        "urgent_action_en":    prev_en_list[0] if prev_en_list else "Inspect plants daily and apply preventive treatment.",
        "urgent_action_si":    prev_si_list[0] if prev_si_list else "දිනපතා ශාක පරීක්ෂා කර වැළකීමේ ප්‍රතිකාරය යොදන්න.",
        "confidence":          0.75,
        "ai_enriched":         False,
        "prevention_en":       prev_en_list,
        "prevention_si":       prev_si_list,
        "prevention_detailed": _build_prevention_detailed(None),
        "fertilizer_en":       fert_en,
        "fertilizer_si":       fert_si,
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

    # Success – merge static lists + detailed into parsed result
    result["ai_enriched"]         = True
    result["prevention_en"]       = prev_en_list
    result["prevention_si"]       = prev_si_list
    result["prevention_detailed"] = _build_prevention_detailed(result.get("per_step_guide"))
    result["fertilizer_en"]       = fert_en
    result["fertilizer_si"]       = fert_si
    # Don't expose raw per_step_guide — it's now merged into prevention_detailed
    result.pop("per_step_guide", None)
    return result
