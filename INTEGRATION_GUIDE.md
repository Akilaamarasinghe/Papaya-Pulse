# Papaya Quality ML Integration Guide

## Overview

The papaya quality grading system has been integrated with machine learning services. The system uses two ML models:

1. **Image Analysis Model (IM)** - Analyzes papaya images to detect type (Type A/B)
2. **Quality Grading Model (ML)** - Predicts quality grade based on features

## Architecture

```
Frontend (React Native)
    ↓
Backend (Express.js) - Port 3000
    ↓
    ├─→ ML Grading Service - Port 5000
    └─→ Image Analysis Service - Port 5001
```

## Setup Steps

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

This will install the newly added `form-data` package required for ML integration.

### 2. Configure Environment Variables

Create a `.env` file in the `backend` folder (use `.env.example` as template):

```env
PORT=3000
ML_GRADING_SERVICE=http://localhost:5000
ML_IMAGE_SERVICE=http://localhost:5001
MONGODB_URI=your_mongodb_connection_string
```

### 3. Start ML Services

#### ML Grading Service (Required)

```bash
cd papaya-quality-ml-part/ML
python app.py
```

Runs on port 5000. This service is essential for quality grading.

#### Image Analysis Service (Optional)

```bash
cd papaya-quality-ml-part/IM
python app.py
```

Runs on port 5001. If unavailable, the system uses fallback values.

**Note:** IM service requires `papaya_model_best.pth` file.

### 4. Start Backend Server

```bash
cd backend
npm start
# or for development with auto-reload
npm run dev
```

### 5. Start Frontend

```bash
cd frontend
npm start
```

## How It Works

### Data Flow

1. **Farmer submits form** with:
   - District (Hambanthota, Galle, Matara)
   - Variety (RedLady, Solo, Tenim)
   - Maturity Level (unmature, half-mature, mature)
   - Quality Category (Best Quality, factory outlet)
   - Days Since Picked
   - Photo of papaya

2. **Backend receives request** and:
   - Sends image to IM service for analysis
   - Maps form data to ML service format
   - Sends features to ML grading service
   - Combines results and returns grade (I, II, or III)

3. **Frontend displays results**:
   - Quality Grade (I, II, III)
   - Damage Probability
   - Detailed Explanation

### Mapping Logic

#### Grade Mapping
- **Grade I** (Best) ← ML "Grade 1 (Best)"
- **Grade II** (Good) ← ML "Grade 2 (Medium)"
- **Grade III** (Acceptable) ← ML "Grade 3 (Lowest)"

#### District Mapping
- Hambanthota → 0
- Galle → 1
- Matara → 2

#### Variety Mapping
- RedLady → 0
- Solo → 1
- Tenim → 1 (mapped to Solo)

#### Maturity Mapping
- unmature → 50.0
- half-mature → 75.0
- mature → 90.0

## Fallback Behavior

The system is designed to be resilient:

- **If Image Service fails**: Uses default Type A with 75% confidence
- **If ML Grading Service fails**: Uses rule-based grading based on maturity and days since picked
- **If both fail**: System still provides quality estimates

## Testing the Integration

### 1. Test ML Services Independently

Test ML Grading Service:
```bash
curl -X POST http://localhost:5000/papaya_grade_predict \
  -H "Content-Type: application/json" \
  -d '{
    "district": 1,
    "variety": 0,
    "color": "#f09439",
    "texture": "75.0",
    "maturity": 75.0,
    "damage": 1.0
  }'
```

Test Image Service:
```bash
curl -X POST http://localhost:5001/predict \
  -F "image=@path/to/papaya.jpg"
```

### 2. Test Backend Integration

Use Postman or curl to test the backend endpoint:

```bash
curl -X POST http://localhost:3000/api/quality/farmer \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@path/to/papaya.jpg" \
  -F "farmer_id=test123" \
  -F "district=Galle" \
  -F "variety=RedLady" \
  -F "maturity=mature" \
  -F "quality_category=Best Quality" \
  -F "days_since_picked=2"
```

### 3. Test from Frontend

Use the mobile app to submit a quality grading request and verify the results.

## Troubleshooting

### ML Services Not Starting

1. Check Python dependencies:
```bash
pip install flask joblib numpy pandas requests shap scikit-learn
```

2. Verify model files exist:
   - `ML/ml_models/model.joblib`
   - `ML/ml_models/encoders.joblib`
   - `ML/ml_models/shap_background.npy`
   - `ML/data_mapping.json`

### Backend Cannot Connect to ML Services

1. Verify ML services are running:
```bash
curl http://localhost:5000/papaya_grade_predict
curl http://localhost:5001/predict
```

2. Check `.env` file configuration
3. Check firewall settings

### Frontend Not Receiving Results

1. Check backend logs for errors
2. Verify authentication token is valid
3. Ensure all form fields are filled correctly
4. Check network connectivity

## API Response Format

### Success Response

```json
{
  "grade": "I",
  "damage_probability": 0.12,
  "explanation": [
    "These factors improved the fruit quality: maturity, color, texture.",
    "Image Analysis: Type A detected with high confidence",
    "Confidence: 87.5%",
    "Selected for best quality market segment.",
    "Average temperature considered: 24.5°C"
  ]
}
```

### Error Response

```json
{
  "error": "Failed to grade papaya quality"
}
```

## Files Modified

1. **Backend:**
   - `routes/qualityRoutes.js` - Added ML service integration
   - `package.json` - Added form-data dependency
   - `.env.example` - Added ML service URLs

2. **Frontend:**
   - `types/index.ts` - Updated types (QualityCategory, removed temperature)
   - `app/quality/farmer-input.tsx` - Added quality_category field, removed temperature

3. **ML Service:**
   - `papaya-quality-ml-part/ML/app.py` - Added maturity text mapping, fixed labels path

4. **Documentation:**
   - `papaya-quality-ml-part/README.md` - ML services setup guide
   - `INTEGRATION_GUIDE.md` - This file

## Next Steps

1. ✅ Install backend dependencies: `npm install`
2. ✅ Configure environment variables
3. ✅ Start ML services
4. ✅ Start backend server
5. ✅ Test the integration
6. 🔄 Train and deploy Image Analysis model (if needed)
7. 🔄 Monitor and optimize ML model performance

## Support

For issues or questions, check:
- Backend logs: `backend/` folder
- ML service logs: Console output
- Frontend logs: React Native debugger
