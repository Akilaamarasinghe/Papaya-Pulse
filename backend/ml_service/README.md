# ML Service for Papaya Pulse Harvest Prediction

This service provides machine learning predictions for papaya harvest timing and yield.

## Setup

1. **Install Python Dependencies**
   ```bash
   cd backend/ml_service
   pip install -r requirements.txt
   ```

2. **Run the ML Service**
   ```bash
   python app.py
   ```

   The service will start on `http://localhost:5000`

## API Endpoint

### POST /growth_predict

Predicts harvest timing and yield based on farming conditions.

**Request Body:**
```json
{
    "district": "hambanthota",
    "soil_type": "laterite_soil",
    "watering_method": "drip",
    "watering_frequency": 2,
    "trees_count": 190,
    "plant_month": 11
}
```

**Response:**
```json
{
    "farmer_explanation": [
        "Your papaya trees are expected to produce about 35.2 kg per tree.",
        "Here is why:",
        "- Rainfall (1050.5 mm) was within the ideal range for papaya...",
        "...",
        "The estimated harvest time is around 245 days."
    ],
    "predictions": {
        "yield_per_tree": 35.23,
        "harvest_days_total": 245,
        "harvest_days_remaining": 180
    }
}
```

## Parameters

- **district**: District name (hambanthota, galle, kurunegala, matara)
- **soil_type**: Soil type (laterite_soil, sandy_loam, loam)
- **watering_method**: Irrigation method (drip, sprinkler, manual)
- **watering_frequency**: Times per week (number)
- **trees_count**: Number of papaya trees (number)
- **plant_month**: Month planted (1-12)

## Models

The service uses pre-trained models:
- `yield_model.pkl` - Predicts kg per tree
- `harvest_model.pkl` - Predicts days to harvest
- `scaler.pkl` - Feature scaling
- `shap_yield.pkl` & `shap_harvest.pkl` - Model explainability

## Weather Integration

The service fetches real-time weather data from Open-Meteo API for accurate predictions based on local climate conditions.
