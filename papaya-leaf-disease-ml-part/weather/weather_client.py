import requests

def get_7day_weather(lat: float, lon: float):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_max,temperature_2m_min,precipitation_sum",
        "forecast_days": 7,
        "timezone": "auto"
    }
    r = requests.get(url, params=params, timeout=10)
    r.raise_for_status()
    data = r.json()

    days = []
    d = data["daily"]
    for i in range(len(d["time"])):
        tmax = float(d["temperature_2m_max"][i])
        tmin = float(d["temperature_2m_min"][i])
        rain = float(d["precipitation_sum"][i])
        days.append({
            "date": d["time"][i],
            "tmax": tmax,
            "tmin": tmin,
            "tmean": (tmax + tmin) / 2.0,
            "rain_mm": rain
        })
    return days
