import requests
import pandas as pd
from datetime import datetime, timedelta

def geocode_district(district: str):
    url = "https://nominatim.openstreetmap.org/search"
    params = {"q": district, "format": "json", "limit": 1}
    headers = {"User-Agent": "PapayaProject/1.0"}

    res = requests.get(url, params=params, headers=headers).json()
    if len(res) == 0:
        raise Exception("District not found: " + district)

    return float(res[0]["lat"]), float(res[0]["lon"])

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
    """
    Get weather features for prediction
    """
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

    
    # If no real weather data, return average/default values instead of raising exception
    if len(df_total) == 0:
        print(f"Warning: No real weather data available for {district}, using default values")
        # Return typical Sri Lankan papaya growing region weather values
        default_weather = pd.DataFrame([{
            'temp_avg': 27.0,  # Average temperature in Celsius
            'humidity_avg': 75.0,  # Average humidity percentage
            'rainfall_total': 150.0,  # Monthly rainfall in mm
            'sunshine_avg': 6.5  # Average sunshine hours per day
        }])
        return default_weather.values[0]

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
