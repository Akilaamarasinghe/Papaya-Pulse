def clamp01(x: float) -> float:
    return max(0.0, min(1.0, x))

DISEASE_PROFILES = {
    "anthracnose": {
        "temp_opt": (25, 30),
        "rain_behavior": "high_increases",
        "explain": "Anthracnose spreads rapidly in wet conditions; frequent rain and moisture increase infections."
    },
    "mosaic": {
        "temp_opt": (25, 35),
        "rain_behavior": "dry_worse",
        "explain": "Mosaic is often vector-related; dry spells can worsen outbreaks. Moderate rain may reduce spread in some cases."
    },
    "mites": {
        "temp_opt": (27, 35),
        "rain_behavior": "heavy_rain_decreases",
        "explain": "Mites prefer warm and dry weather; heavy rain can reduce populations by washing them off leaves."
    },
    "leaf_curl": {
        "temp_opt": (20, 33),
        "rain_behavior": "after_rains_increases",
        "explain": "Leaf curl often increases after rains due to higher humidity and favorable conditions for vectors/pathogens."
    }
}

SEVERITY_WEIGHT = {"mild": 0.8, "moderate": 1.0, "severe": 1.2}

def temp_score(tmean: float, opt_low: float, opt_high: float) -> float:
    if opt_low <= tmean <= opt_high:
        return 1.0
    if tmean < opt_low:
        return clamp01(1 - (opt_low - tmean) / 10.0)
    return clamp01(1 - (tmean - opt_high) / 10.0)

def rain_score(rain_mm: float, behavior: str) -> float:
    low = rain_mm < 2.0
    med = 2.0 <= rain_mm <= 10.0
    high = rain_mm > 10.0

    if behavior == "high_increases":
        return 0.2 if low else (0.6 if med else 1.0)
    if behavior == "after_rains_increases":
        return 0.3 if low else (0.8 if med else 1.0)
    if behavior == "heavy_rain_decreases":
        return 1.0 if low else (0.6 if med else 0.2)
    if behavior == "dry_worse":
        return 1.0 if low else (0.6 if med else 0.4)
    return 0.5

def normalize_key(name: str) -> str:
    # normalize model outputs like "Leaf Curl" -> "leaf_curl"
    return name.strip().lower().replace(" ", "_")

def compute_weather_risk(disease_name: str, severity: str, forecast_days: list):
    key = normalize_key(disease_name)
    prof = DISEASE_PROFILES.get(key)

    if prof is None:
        return {
            "risk_score": 0.5,
            "alert": "YELLOW",
            "message": "Weather-risk rules not available for this disease yet.",
            "daily_risk": []
        }

    opt_low, opt_high = prof["temp_opt"]
    behavior = prof["rain_behavior"]

    daily = []
    for d in forecast_days:
        ts = temp_score(d["tmean"], opt_low, opt_high)
        rs = rain_score(d["rain_mm"], behavior)
        day_risk = 0.6 * ts + 0.4 * rs
        daily.append({
            **d,
            "temp_score": round(ts, 3),
            "rain_score": round(rs, 3),
            "risk": round(day_risk, 3)
        })

    base_risk = sum(x["risk"] for x in daily) / len(daily)
    sev_w = SEVERITY_WEIGHT.get(severity.strip().lower(), 1.0)
    final_risk = clamp01(base_risk * sev_w)

    if severity.strip().lower() == "severe" and final_risk >= 0.65:
        alert = "RED"
    elif final_risk >= 0.5:
        alert = "YELLOW"
    else:
        alert = "GREEN"

    return {
        "risk_score": round(final_risk, 3),
        "alert": alert,
        "message": prof["explain"],
        "daily_risk": daily
    }
