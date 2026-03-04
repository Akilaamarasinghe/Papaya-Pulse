# =============================================================================
# Southern Province Sri Lanka – Papaya Disease Advisory System
# Target districts: Galle, Matara, Hambantota
# =============================================================================

# Supported districts (Southern Province only)
SUPPORTED_DISTRICTS = ["galle", "matara", "hambantota"]

DISTRICT_CENTROIDS = {
    "galle":      (6.0535, 80.2210),   # Wet zone – highest annual rainfall
    "matara":     (5.9485, 80.5353),   # Wet/intermediate – moderate humidity
    "hambantota": (6.1241, 81.1185),   # Dry zone – lower rainfall, hotter
}

# Sinhala district names
DISTRICT_SINHALA = {
    "galle":      "ගාල්ල",
    "matara":     "මාතර",
    "hambantota": "හම්බන්තොට",
}

# Agro-ecological zone (affects disease risk and fertilizer advice)
DISTRICT_ZONE = {
    "galle":      "wet",          # Annual rainfall ~2300 mm, high humidity
    "matara":     "wet",          # Annual rainfall ~1900 mm, coastal humidity
    "hambantota": "dry",          # Annual rainfall ~1000 mm, semi-arid
}

# Southern Province papaya growing context
DISTRICT_CONTEXT = {
    "galle": {
        "rainfall_note_en":  "Galle receives heavy rainfall year-round (Wet Zone). High humidity significantly increases anthracnose and leaf curl risk.",
        "rainfall_note_si":  "ගාල්ල දිස්ත්‍රික්කය වර්ෂ පුරාම අධික වර්ෂාපාතයක් ලබයි. ඉහළ ආර්ද්‍රතාව anthracnose සහ leaf curl රෝග ඉතා වේගයෙන් ව්‍යාප්ත කරයි.",
        "doa_office":        "Galle District Agriculture Office – Galle Fort Road, Galle (Tel: 091-2222247)",
        "doa_office_si":     "ගාල්ල දිස්ත්‍රික් කෘෂිකර්ම කාර්යාලය – ගාල්ල කොටුව පාර, ගාල්ල (දු.අ: 091-2222247)",
    },
    "matara": {
        "rainfall_note_en":  "Matara is a coastal Wet Zone district. Warm temperatures and moderate-to-high humidity support fungal and vector-borne diseases.",
        "rainfall_note_si":  "මාතර වෙරළාසන්න ආර්ද්‍ර කලාපීය දිස්ත්‍රික්කයකි. උණුසුම් කාලගුණය සහ මධ්‍යස්ථ-ඉහළ ආර්ද්‍රතාව දිලීර සහ ව්‍යාධිජනක රෝග ව්‍යාප්ත කරයි.",
        "doa_office":        "Matara District Agriculture Office – Rahula Road, Matara (Tel: 041-2222245)",
        "doa_office_si":     "මාතර දිස්ත්‍රික් කෘෂිකර්ම කාර්යාලය – රාහුල මාවත, මාතර (දු.අ: 041-2222245)",
    },
    "hambantota": {
        "rainfall_note_en":  "Hambantota is a Dry Zone district with low annual rainfall and high temperatures. Spider mite and mosaic virus risks are highest here during dry months.",
        "rainfall_note_si":  "හම්බන්තොට ශුෂ්ක කලාපීය දිස්ත්‍රික්කයකි. අඩු වර්ෂාපාතය සහ ඉහළ උෂ්ණත්වය හේතුවෙන් spider mite සහ mosaic virus රෝග ඉහළ අවදානමක් බව දැකිය හැකිය.",
        "doa_office":        "Hambantota District Agriculture Office – Hambantota Road, Hambantota (Tel: 047-2220045)",
        "doa_office_si":     "හම්බන්තොට දිස්ත්‍රික් කෘෂිකර්ම කාර්යාලය – හම්බන්තොට පාර, හම්බන්තොට (දු.අ: 047-2220045)",
    },
}


def validate_district(district: str) -> tuple[bool, str]:
    """
    Validate that the district is within Southern Province.
    Returns (is_valid, normalised_key).
    """
    if not district:
        return False, ""
    key = district.strip().lower().replace(" ", "").replace("_", "")
    if key in SUPPORTED_DISTRICTS:
        return True, key
    # friendly partial match within supported list
    for d in SUPPORTED_DISTRICTS:
        if key in d or d in key:
            return True, d
    return False, key


def get_lat_lon_from_district(district: str):
    valid, key = validate_district(district)
    return DISTRICT_CENTROIDS.get(key) if valid else None


def get_district_info(district: str) -> dict:
    """Return full Southern Province district metadata."""
    valid, key = validate_district(district)
    coords = DISTRICT_CENTROIDS.get(key)
    context = DISTRICT_CONTEXT.get(key, {})
    return {
        "district_en":       key,
        "district_si":       DISTRICT_SINHALA.get(key, key),
        "lat":               coords[0] if coords else None,
        "lon":               coords[1] if coords else None,
        "zone":              DISTRICT_ZONE.get(key, "unknown"),
        "province":          "Southern Province",
        "province_si":       "දකුණු පළාත",
        "rainfall_note_en":  context.get("rainfall_note_en", ""),
        "rainfall_note_si":  context.get("rainfall_note_si", ""),
        "doa_office":        context.get("doa_office", ""),
        "doa_office_si":     context.get("doa_office_si", ""),
        "valid":             valid,
    }

