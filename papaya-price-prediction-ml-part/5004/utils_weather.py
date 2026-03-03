from datetime import datetime, timedelta
import json
import os
import requests

CITY_JSON_PATH = os.path.join(
    os.path.dirname(__file__),
    "sri_lanka_southern_cities.json"
)

def normalize_city(city: str) -> str:
    return city.lower().replace(",", "").replace(" sri lanka", "").strip()

def geocode_district(city: str, country_hint: str = "Sri Lanka"):
    city_key = normalize_city(city)

    # TRY LOCAL JSON ----------
    if os.path.exists(CITY_JSON_PATH):
        with open(CITY_JSON_PATH, "r", encoding="utf-8") as f:
            city_map = json.load(f)

        if city_key in city_map:
            loc = city_map[city_key]
            return loc["lat"], loc["lon"]

    # FALLBACK TO NOMINATIM ----------
    q = f"{city}, {country_hint}"
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": q, "format": "json", "limit": 1}
    headers = {"User-Agent": "PapayaPriceApp/1.0"}

    r = requests.get(url, params=params, headers=headers, timeout=10)
    r.raise_for_status()
    data = r.json()

    if not data:
        raise ValueError(f"Could not geocode district: {city}")

    return float(data[0]["lat"]), float(data[0]["lon"])

def get_last7_days_rainfall(lat: float, lon: float):
    print(f"Fetching rainfall for lat={lat}, lon={lon}")
    end = datetime.utcnow().date()
    start = end - timedelta(days=6)
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "daily": "precipitation_sum",
        "timezone": "UTC"
    }
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()
    if "daily" not in data or "precipitation_sum" not in data["daily"]:
        raise ValueError("Unexpected weather response format.")
    rains = data["daily"]["precipitation_sum"]
    total = sum(rains)
    print(f"Total rainfall over last 7 days: {total} mm")
    return float(total)


def get_current_month():
    """Get current month name."""
    month_names = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return month_names[datetime.now().month - 1]

