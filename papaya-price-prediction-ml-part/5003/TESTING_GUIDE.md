# Price Prediction Service - Quick Setup & Testing Guide

## Step 1: Install Dependencies

Run this command from the project root:
```bash
pip install -r papaya-price-prediction-ml-part/5003/requirements.txt
```

## Step 2: Start the Service

Use your existing batch file or start manually:
```bash
cd papaya-price-prediction-ml-part/5003
python app_for_farmer_market.py
```

You should see output like:
```
======================================================
Model loading completed successfully!
BEST model features: [...feature list...]
FACTORY model features: [...feature list...]
======================================================
```

## Step 3: Verify Models Are Loaded

Open a new terminal and test the health endpoint:
```bash
curl http://localhost:5003/health
```

**Expected response (200 OK):**
```json
{
  "status": "healthy",
  "models_loaded": true,
  "best_model_features": [...],
  "factory_model_features": [...],
  "encoders_best": [...],
  "encoders_factory": [...],
  "timestamp": "2026-05-02T..."
}
```

**If you get an error:** Check the Python console for error messages. The logs will show:
- Which models failed to load and why
- Which model file paths are being used
- What features each model expects

## Step 4: Test Market Price Prediction

```bash
curl -X POST http://localhost:5003/martket_data_predict \
  -H "Content-Type: application/json" \
  -d '{
    "district": "Hambanthota",
    "variety": "Red Lady",
    "cultivation_methode": "Organic",
    "quality": "I",
    "total_harvest_papaya_units_count": 200,
    "avg_weight_kg": 1,
    "expect_selling_week": 1,
    "month": "May"
  }'
```

## Common Issues & Solutions

### Issue: "ModuleNotFoundError: No module named 'flask'"
**Solution:** Run `pip install -r papaya-price-prediction-ml-part/5003/requirements.txt`

### Issue: "Model file not found" or "No such file or directory"
**Solution:** Make sure you're running from the `/5003/` directory:
```bash
cd papaya-price-prediction-ml-part/5003
python app_for_farmer_market.py
```

### Issue: "Feature mismatch" or "Unknown label"
**Solution:** Your new models might have different features. Check:
1. The terminal logs show actual feature names and encoders
2. Compare with what the mobile app is sending

### Issue: Still getting 500 error on mobile app
**Solution:** 
1. Run the health check to confirm service is working
2. Check the Python console for error messages
3. The error response now includes the full traceback for debugging

## Next Steps

If the health check passes but mobile app still fails:
1. Check the Python console logs for detailed error messages
2. The error response from the API now includes full tracebacks
3. Common issues: missing fields in request or feature mismatches with new models
