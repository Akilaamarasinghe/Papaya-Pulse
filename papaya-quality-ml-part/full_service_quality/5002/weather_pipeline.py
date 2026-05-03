import requests
import pandas as pd
from datetime import datetime, timedelta
import json
import os

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

def fetch_past_weather(lat, lon, start_date, end_date):
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date.strftime("%Y-%m-%d"),
        "end_date": end_date.strftime("%Y-%m-%d"),
        "daily": "temperature_2m_mean,precipitation_sum",
        "timezone": "UTC",
    }

    resp = requests.get(url, params=params).json()

    if "daily" not in resp:
        return pd.DataFrame()

    df = pd.DataFrame({
        "date": resp["daily"]["time"],
        "temp": resp["daily"]["temperature_2m_mean"],
        "precip": resp["daily"]["precipitation_sum"]
    })

    df["date"] = pd.to_datetime(df["date"])
    return df


def fetch_forecast_weather(lat, lon):
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "daily": "temperature_2m_mean,precipitation_sum",
        "forecast_days": 250,
        "timezone": "UTC",
    }

    resp = requests.get(url, params=params).json()

    if "daily" not in resp:
        return pd.DataFrame()

    df = pd.DataFrame({
        "date": resp["daily"]["time"],
        "temp": resp["daily"]["temperature_2m_mean"],
        "precip": resp["daily"]["precipitation_sum"],
    })

    df["date"] = pd.to_datetime(df["date"])
    return df

def get_weather_features(district, planted_month):
    lat, lon = geocode_district(district)

    planted_date = datetime(datetime.now().year, planted_month, 1)
    end_date = planted_date + timedelta(days=250)  # crop duration example
    today = datetime.utcnow().date()

    df_total = []


    #  Past real weather
    if planted_date.date() < today:
        past_df = fetch_past_weather(
            lat, lon,
            planted_date,
            min(end_date, datetime.utcnow())
        )
        if len(past_df) > 0:
            df_total.append(past_df)

    
    # Real 250-day forecast
    
    if end_date.date() > today:
        forecast_df = fetch_forecast_weather(lat, lon)
        if len(forecast_df) > 0:
            df_total.append(forecast_df)

    
    if len(df_total) == 0:
        raise Exception("No real weather data available for this district")

    df = pd.concat(df_total, ignore_index=True)

    return {
        "avg_temp": round(df["temp"].mean(), 2),
        "total_rain": round(df["precip"].sum(), 2),
        "rainy_days": int((df["precip"] > 1).sum())
    }


if __name__ == "__main__":
    print("Fetching weather…")
    out = get_weather_features("Hambanthota, Sri Lanka", planted_month=11)
    print("\n✔ FINAL WEATHER FEATURES:")
    print(out)
