from datetime import datetime, timedelta
import requests

def geocode_district(district: str, country_hint: str = "Sri Lanka"):
    q = f"{district}, {country_hint}"
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": q, "format": "json", "limit": 1}
    headers = {"User-Agent": "PapayaPriceApp/1.0 (+https://example.org)"}
    r = requests.get(url, params=params, headers=headers, timeout=10)
    r.raise_for_status()
    data = r.json()
    if not data:
        raise ValueError("Could not geocode district: " + district)
    lat = float(data[0]["lat"])
    lon = float(data[0]["lon"])
    return lat, lon

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

