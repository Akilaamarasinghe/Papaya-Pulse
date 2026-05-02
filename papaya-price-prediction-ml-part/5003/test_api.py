#!/usr/bin/env python3
"""
Quick test script for market price prediction API.
Run this to verify the service is working correctly.

Usage:
    python test_api.py
"""

import requests
import json
import sys
from datetime import datetime

# Service configuration
SERVICE_URL = "http://localhost:5003"
HEALTH_ENDPOINT = f"{SERVICE_URL}/health"
MARKET_PREDICT_ENDPOINT = f"{SERVICE_URL}/martket_data_predict"

# Sample test data
SAMPLE_REQUEST = {
    "district": "Hambanthota",
    "variety": "Red Lady",
    "cultivation_methode": "Organic",
    "quality": "I",
    "total_harvest_papaya_units_count": 200,
    "avg_weight_kg": 1,
    "expect_selling_week": 1,
    "month": "May"
}


def test_health():
    """Test if the service is running and models are loaded."""
    print("\n" + "=" * 60)
    print("Testing Health Endpoint")
    print("=" * 60)
    print(f"GET {HEALTH_ENDPOINT}")
    
    try:
        response = requests.get(HEALTH_ENDPOINT, timeout=10)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✓ Service is HEALTHY\n")
            print("Response:")
            print(json.dumps(data, indent=2))
            return True
        else:
            print(f"\n✗ Service returned status {response.status_code}\n")
            print("Response:")
            print(json.dumps(response.json(), indent=2))
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n✗ Cannot connect to service!")
        print(f"Make sure the service is running on {SERVICE_URL}")
        return False
    except requests.exceptions.Timeout:
        print("\n✗ Request timed out!")
        return False
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        return False


def test_market_prediction():
    """Test the market price prediction endpoint."""
    print("\n" + "=" * 60)
    print("Testing Market Price Prediction")
    print("=" * 60)
    print(f"POST {MARKET_PREDICT_ENDPOINT}")
    print("\nRequest Body:")
    print(json.dumps(SAMPLE_REQUEST, indent=2))
    
    try:
        response = requests.post(
            MARKET_PREDICT_ENDPOINT,
            json=SAMPLE_REQUEST,
            timeout=10
        )
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\n✓ Prediction SUCCESSFUL\n")
            print("Response:")
            print(json.dumps(data, indent=2))
            return True
        else:
            print(f"\n✗ Prediction failed with status {response.status_code}\n")
            print("Response:")
            try:
                print(json.dumps(response.json(), indent=2))
            except:
                print(response.text)
            return False
            
    except requests.exceptions.ConnectionError:
        print("\n✗ Cannot connect to service!")
        print(f"Make sure the service is running on {SERVICE_URL}")
        return False
    except requests.exceptions.Timeout:
        print("\n✗ Request timed out!")
        return False
    except Exception as e:
        print(f"\n✗ Error: {str(e)}")
        return False


def main():
    print("\n" + "=" * 60)
    print("MARKET PRICE PREDICTION API - TEST SUITE")
    print("=" * 60)
    print(f"Time: {datetime.now().isoformat()}")
    print(f"Service URL: {SERVICE_URL}")
    
    # Test 1: Health check
    health_ok = test_health()
    
    if not health_ok:
        print("\n" + "=" * 60)
        print("TESTS FAILED - Service not responding")
        print("=" * 60)
        print("\nFix checklist:")
        print("1. Make sure service is running: python app_for_farmer_market.py")
        print("2. Check Python console for model loading errors")
        print("3. Verify requirements are installed: pip install -r requirements.txt")
        return False
    
    # Test 2: Prediction
    prediction_ok = test_market_prediction()
    
    print("\n" + "=" * 60)
    if prediction_ok:
        print("ALL TESTS PASSED ✓")
    else:
        print("TESTS FAILED ✗")
        print("\nCheck Python console for detailed error messages")
    print("=" * 60 + "\n")
    
    return prediction_ok


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
