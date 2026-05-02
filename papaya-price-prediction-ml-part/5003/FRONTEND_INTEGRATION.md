# Frontend Integration - Market Price Prediction

## API Endpoint Details

### Endpoint: POST /martket_data_predict

**Base URL:** `http://localhost:5003` (during development)

**Required Request Fields:**
```json
{
  "district": "Hambanthota",           // String - Sri Lanka district name
  "variety": "Red Lady",               // String - Papaya variety
  "cultivation_methode": "Organic",    // String - Cultivation method
  "quality": "I",                      // String - Quality grade (I, II, or B)
  "total_harvest_papaya_units_count": 200,  // Number - Count of fruits
  "avg_weight_kg": 1,                  // Number - Average fruit weight in KG
  "expect_selling_week": 1,            // Number - Week to sell (1-4)
  "month": "May"                       // String - Month name (optional, uses current if missing)
}
```

**Optional Fields:**
```json
{
  "last7_days_rainfall": 150.5,        // Number - Rainfall in mm (optional, fetches from API if missing)
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "predictions": {
    "best_selling_day": "Today",
    "price_per_kg": 45.50,
    "total_harvest_value": 9100.00
  },
  "summary": "Recent rainfall and quality make this [variety] excellent today at Rs. 45.50/kg",
  "xai_factors": [
    {"feature": "rainfall_impact_score", "impact": 0.85},
    {"feature": "quality_encoded", "impact": 0.45}
    // ... up to 5 factors
  ],
  "context": {
    "month_used": "May",
    "rainfall_used": 150.5
  },
  "timestamp": "2026-05-02T14:30:00"
}
```

**Error Response (500 Server Error):**
```json
{
  "success": false,
  "error": "Detailed error message",
  "traceback": "Full Python traceback for debugging"
}
```

## Implementation Checklist

- [ ] Endpoint URL is correct (http://localhost:5003 for dev)
- [ ] All required fields are being sent
- [ ] Field values match expected types (strings, numbers)
- [ ] Quality grade is one of: I, II, or B
- [ ] District name matches Sri Lanka district names
- [ ] expect_selling_week is 1, 2, 3, or 4

## Example React Native Code

```typescript
const predictMarketPrice = async (formData: PriceFormData) => {
  try {
    const response = await fetch('http://localhost:5003/martket_data_predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        district: formData.district,
        variety: formData.variety,
        cultivation_methode: formData.cultivationMethod,
        quality: formData.qualityGrade,
        total_harvest_papaya_units_count: Number(formData.totalHarvest),
        avg_weight_kg: Number(formData.avgWeight),
        expect_selling_week: Number(formData.sellingWeek),
        month: formData.month || undefined, // Optional
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('API Error:', errorData.error);
      throw new Error(errorData.error);
    }

    const prediction = await response.json();
    console.log('Price Prediction:', prediction);
    return prediction;
  } catch (error) {
    console.error('Market price prediction failed:', error);
    throw error;
  }
};
```

## Debugging Tips

1. **Check response status code:** 
   - 200 = Success
   - 500 = Server error (check Python console logs)
   - Other = Network issue

2. **If you get detailed error in response:**
   - The `error` field now includes the specific problem
   - The `traceback` field shows the exact line that failed

3. **Test with curl first:**
   ```bash
   curl -X POST http://localhost:5003/martket_data_predict \
     -H "Content-Type: application/json" \
     -d '{"district":"Hambanthota","variety":"Red Lady","cultivation_methode":"Organic","quality":"I","total_harvest_papaya_units_count":200,"avg_weight_kg":1,"expect_selling_week":1}'
   ```

## Service Health Check

Before deploying, verify the service is ready:

**Endpoint:** GET /health

**Expected Response:**
```json
{
  "status": "healthy",
  "models_loaded": true,
  "best_model_features": [list of feature names],
  "factory_model_features": [list of feature names],
  "encoders_best": [list of encoder names],
  "encoders_factory": [list of encoder names],
  "timestamp": "2026-05-02T14:30:00"
}
```

This confirms:
- ✓ Service is running
- ✓ Models loaded successfully
- ✓ All encoders are initialized
