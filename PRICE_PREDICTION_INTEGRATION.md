# Price Prediction ML Integration

This document explains how the Price Prediction ML model is integrated with the frontend.

## Architecture

```
Frontend (React Native/Web)
    ↓ HTTP Request
Backend (Node.js/Express) - Port 3000
    ↓ HTTP Request  
ML Service (Python/Flask) - Port 5000
    ↓ Returns Prediction
```

## Setup Instructions

### 1. Install Python Dependencies

```bash
cd papaya-price-prediction-ml-part
pip install -r requirements.txt
```

Or if using conda:
```bash
conda activate sachini
pip install -r requirements.txt
```

### 2. Start the ML Service

**Option A: Using the batch file**
```bash
cd papaya-price-prediction-ml-part
start-ml-service.bat
```

**Option B: Manually**
```bash
cd papaya-price-prediction-ml-part
python final.py
```

The service will start on `http://localhost:5000`

### 3. Start the Backend

```bash
cd backend
npm start
```

The backend will start on `http://localhost:3000`

### 4. Start the Frontend

```bash
cd frontend
npm start
```

## API Flow

### Frontend Request
When a farmer fills the price prediction form and clicks "Predict Price", the frontend sends:

```json
{
  "district": "Galle",
  "variety": "RedLady",
  "cultivation_method": "Organic",
  "quality_grade": "I",
  "total_harvest_count": 100,
  "avg_weight_per_fruit": 1.5,
  "expected_selling_date": "today"
}
```

### Backend Processing
The backend (`routes/marketRoutes.js`):
1. Validates user is a farmer
2. Transforms data for ML service
3. Calls appropriate ML endpoint:
   - `/martket_data_predict` for best quality (Grade I, II, III)
   - `/factory_outlet_price_predict` for factory outlet (Grade A, B)

### ML Service Processing
The Python ML service (`final.py`):
1. Gets current weather data (rainfall)
2. Engineers features from input
3. Runs trained ML models for:
   - Price prediction
   - Best selling day prediction
4. Generates explainable AI (XAI) insights
5. Returns predictions with explanations

### Response to Frontend
```json
{
  "predicted_price_per_kg": 225.50,
  "predicted_total_income": 33825.00,
  "suggested_selling_day": "In_2_days",
  "explanation": [
    "Your price is boosted by recent weather conditions, seasonal market cycle, harvest size..."
  ],
  "xai_factors": [...]
}
```

## Data Mapping

| Frontend Field | Backend Field | ML Service Field |
|----------------|---------------|------------------|
| district | district | district |
| variety | variety | variety |
| cultivation_method | cultivation_method | cultivation_methode |
| quality_grade | quality_grade | quality |
| total_harvest_count | total_harvest_count | total_harvest_papaya_units_count |
| avg_weight_per_fruit | avg_weight_per_fruit | avg_weight_kg |
| expected_selling_date | expected_selling_date | expect_selling_week |

### Selling Date to Week Mapping
- `today`, `1day` → Week 0
- `2day`, `3day` → Week 1
- `4day`, `5day` → Week 2

## ML Models

The service loads two separate model sets:

### Best Quality Models
- Path: `best_qulity_ml_models/papaya_price_model_complete.pkl`
- Grades: I, II, III
- Endpoint: `/martket_data_predict`

### Factory Outlet Models
- Path: `factory_outlet_ml_models/papaya_price_model_complete.pkl`
- Grades: A, B
- Endpoint: `/factory_outlet_price_predict`

Each model set includes:
- Price prediction model (Random Forest)
- Best selling day prediction model
- Feature scalers
- Label encoders

## Troubleshooting

### ML Service Connection Error
**Error**: "ML service is not available"

**Solution**:
1. Check if Python ML service is running on port 5000
2. Run: `cd papaya-price-prediction-ml-part && python final.py`
3. Check for errors in the Python console

### Model Loading Error
**Error**: "No module named 'numpy._core'" or version mismatch

**Solution**:
```bash
pip install --upgrade numpy>=2.0
pip install --upgrade scikit-learn>=1.7.2
```

### Weather API Error
If weather data fetch fails, the service should still work with default rainfall values.

## Testing

### Test ML Service Directly
```bash
curl -X POST http://localhost:5000/martket_data_predict \
  -H "Content-Type: application/json" \
  -d '{
    "district": "Galle",
    "variety": "RedLady",
    "cultivation_methode": "Organic",
    "quality": "I",
    "total_harvest_papaya_units_count": 100,
    "avg_weight_kg": 1.5,
    "expect_selling_week": 0
  }'
```

### Test Backend API
Login first to get JWT token, then:
```bash
curl -X POST http://localhost:3000/api/market/predict \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "district": "Galle",
    "variety": "RedLady",
    "cultivation_method": "Organic",
    "quality_grade": "I",
    "total_harvest_count": 100,
    "avg_weight_per_fruit": 1.5,
    "expected_selling_date": "today"
  }'
```

## Notes

- The ML service uses actual trained models (not dummy data)
- Weather data is fetched in real-time from Open-Meteo API
- XAI (Explainable AI) factors provide insights into prediction reasoning
- All predictions are logged in MongoDB for analytics
