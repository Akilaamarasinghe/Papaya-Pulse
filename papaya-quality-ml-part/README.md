# Papaya Quality ML Services

This folder contains two ML services for papaya quality grading:

1. **ML Service** (Port 5000) - Quality grading based on features
2. **IM Service** (Port 5001) - Image analysis for color and texture

## Setup Instructions

### 1. Install Dependencies

For both ML and IM services, install the required Python packages:

```bash
# For ML Service
cd ML
pip install flask joblib numpy pandas requests shap scikit-learn

# For IM Service (if you have the model file)
cd ../IM
pip install flask torch torchvision pillow captum
```

### 2. Start ML Grading Service (Port 5000)

```bash
cd ML
python app.py
```

The service will start on `http://localhost:5000`

### 3. Start Image Analysis Service (Port 5001)

**Note:** The IM service requires a trained model file `papaya_model_best.pth` which is not included in the repository.

```bash
cd IM
python app.py
```

The service will start on `http://localhost:5001`

## API Endpoints

### ML Grading Service

**POST** `/papaya_grade_predict`

Request body:
```json
{
  "district": 0,        // 0=Hambanthota, 1=Galle, 2=Matara
  "variety": 0,         // 0=RedLady, 1=Solo
  "color": "#f09439",   // Hex color code
  "texture": "75.0",    // Texture value
  "maturity": 75.0,     // or "unmature", "half-mature", "mature"
  "damage": 1.0         // Damage score
}
```

Response:
```json
{
  "prediction_label": "Grade 1 (Best)",
  "prediction_confidence_percent": "87.5%",
  "temperature_used": 24.5,
  "farmer_friendly_explanation": "These factors improved..."
}
```

### Image Analysis Service

**POST** `/predict`

Request: Multipart form-data with `image` file

Response:
```json
{
  "prediction": "Type A",
  "confidence": "85.23%",
  "explanation": "Model heavily focused on texture patterns..."
}
```

## Environment Variables

Add these to your backend `.env` file:

```env
ML_GRADING_SERVICE=http://localhost:5000
ML_IMAGE_SERVICE=http://localhost:5001
```

## Integration with Backend

The backend automatically calls these ML services when processing farmer quality grading requests. If the ML services are unavailable, the backend will fallback to a mock grading system.

## Troubleshooting

### NumPy Version Issues

If you encounter NumPy version errors:

```bash
pip install "numpy<2"
pip install --upgrade pandas pyarrow numexpr bottleneck
```

### Missing Dependencies

Install all required packages:

```bash
pip install flask flask-cors joblib numpy pandas requests shap scikit-learn xgboost
pip install torch torchvision pillow captum
```

### Port Already in Use

If ports 5000 or 5001 are already in use, you can change them in the respective `app.py` files and update your backend `.env` file accordingly.
