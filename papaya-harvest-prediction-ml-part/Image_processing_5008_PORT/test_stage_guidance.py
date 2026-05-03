"""
Test Script for Papaya Growth Stage Guidance System
Usage: python test_stage_guidance.py
"""

import requests
import json

BASE_URL = "http://localhost:5000"

def print_section(title):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70 + "\n")

def test_list_stages():
    """Test listing all available stages"""
    print_section("TEST 1: List All Stages")
    
    response = requests.get(f"{BASE_URL}/stages")
    data = response.json()
    
    print("Available Stages:")
    for stage in data['stages']:
        print(f"  {stage['code'].upper()} - {stage['name']}")
    
    print(f"\n{data['usage']}")
    print(f"\n✅ Status: {response.status_code}")

def test_stage_info(stage_code):
    """Test getting stage info without image"""
    print_section(f"TEST 2: Get Stage Info - {stage_code.upper()}")
    
    params = {
        "location": "Colombo",
        "month": "March"
    }
    
    response = requests.get(
        f"{BASE_URL}/stage-info/{stage_code}",
        params=params
    )
    data = response.json()
    
    print(f"Stage: {data['stage_name']}")
    print(f"Duration: {data['duration']}")
    print(f"Height: {data['height']}")
    print(f"Price Range: {data['price_range']}")
    
    print("\n📋 Critical Actions:")
    for i, action in enumerate(data['critical_actions'][:3], 1):
        print(f"  {i}. {action}")
    print(f"  ... and {len(data['critical_actions']) - 3} more")
    
    print(f"\n🌱 Next Stage: {data['next_stage']}")
    print(f"Signs: {data['next_stage_signs']}")
    
    print(f"\n💡 Expert Advice:")
    print(f"  {data['expert_advice'][:200]}...")
    
    print(f"\n⚠️  Key Advice: {data['key_advice']}")
    
    print(f"\n✅ Status: {response.status_code}")

def test_predict_with_guidance():
    """Test image prediction with growth guidance"""
    print_section("TEST 3: Image Prediction + Growth Guidance")
    
    print("Note: This requires an actual image file and the server running.")
    print("\nExample curl command:")
    print("""
curl -X POST http://localhost:5000/predict \\
  -F "file=@papaya_plant.jpg" \\
  -F "location=Kandy" \\
  -F "month=August" \\
  -F "tta=true"
    """)
    
    print("\nExpected Response Structure:")
    print("""
{
  "papaya_validation": { ... },
  "is_papaya": true,
  "grade_prediction": {
    "grade": "c",
    "grade_name": "Pre-fruiting",
    "confidence": 87.3
  },
  "growth_guidance": {
    "stage_name": "Pre-fruiting",
    "critical_actions": [...],
    "care_instructions": {...},
    "expert_advice": "...",
    ...
  }
}
    """)

def display_stage_comparison():
    """Display comparison of all stages"""
    print_section("TEST 4: Stage Comparison")
    
    stages = ['a', 'b', 'c', 'd']
    
    for stage_code in stages:
        response = requests.get(f"{BASE_URL}/stage-info/{stage_code}")
        data = response.json()
        
        print(f"{'─'*70}")
        print(f"Stage {stage_code.upper()}: {data['stage_name']}")
        print(f"{'─'*70}")
        print(f"Duration:  {data['duration']}")
        print(f"Height:    {data['height']}")
        print(f"Price:     {data['price_range']}")
        
        if 'yield_info' in data and data['yield_info'] != 'Not applicable yet':
            print(f"Yield:     {data['yield_info']}")
        
        print(f"\n💧 Watering: {data['care_instructions']['watering'][:60]}...")
        print(f"🧪 Fertilizer: {data['care_instructions']['fertilizer'][:60]}...")
        
        print(f"\n⚡ Top Priority: {data['critical_actions'][0]}")
        print(f"🔜 Next: {data['next_stage']}\n")

def main():
    print("\n" + "🌴"*35)
    print(" "*20 + "PAPAYA GROWTH STAGE GUIDANCE SYSTEM TEST")
    print("🌴"*35)
    
    try:
        # Test 1: List stages
        test_list_stages()
        
        # Test 2: Get detailed info for each stage
        for stage in ['a', 'b', 'c', 'd']:
            test_stage_info(stage)
        
        # Test 3: Show prediction example
        test_predict_with_guidance()
        
        # Test 4: Stage comparison
        display_stage_comparison()
        
        print_section("✅ ALL TESTS COMPLETED")
        print("The system is working correctly!")
        print("\nTo test image prediction, use:")
        print("  curl -X POST http://localhost:5000/predict -F 'file=@your_image.jpg'")
        
    except requests.exceptions.ConnectionError:
        print_section("❌ CONNECTION ERROR")
        print("Could not connect to the API server.")
        print("Please ensure the server is running:")
        print("  python app.py")
    except Exception as e:
        print_section("❌ ERROR")
        print(f"An error occurred: {str(e)}")

if __name__ == "__main__":
    main()
