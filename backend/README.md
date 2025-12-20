# Papaya Pulse Backend API

Node.js + Express + MongoDB backend for the Papaya Pulse mobile application.

## 🚀 Features

- **User Authentication**: Firebase Admin SDK integration
- **Growth Stage Detection**: AI-powered plant growth analysis
- **Harvest Prediction**: ML-based yield and timing prediction
- **Quality Grading**: Farmer and customer quality assessment
- **Market Price Prediction**: Price forecasting for optimal selling
- **Leaf Disease Scanner**: Disease identification and treatment advisory

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- Firebase Admin SDK service account

## 🛠️ Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/papaya_pulse
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
```

4. Download Firebase Admin SDK:
   - Go to Firebase Console > Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save as `config/firebase-service-account.json`

5. Start MongoDB:
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

## 🏃 Running the Server

Development mode (with auto-reload):
```bash
npm run dev
```

Production mode:
```bash
npm start
```

The server will start at `http://localhost:3000`

## 📡 API Endpoints

### User Management
- `POST /api/users` - Create user profile
- `GET /api/users/me` - Get current user

### Growth & Harvest
- `POST /api/growth/stage` - Analyze growth stage (with image)
- `POST /api/growth/harvest` - Predict harvest time and yield

### Quality Grading
- `POST /api/quality/farmer` - Farmer quality grading (with image)
- `GET /api/quality/farmer/history` - Get farmer grading history
- `POST /api/quality/customer` - Customer quality check (with image)
- `GET /api/quality/customer/history` - Get customer check history

### Market Price
- `POST /api/market/predict` - Predict market price (farmers only)

### Leaf Disease
- `POST /api/leaf/predict` - Detect leaf disease (with image)
- `GET /api/leaf/history` - Get disease scan history

## 🔐 Authentication

All endpoints (except `/` and `/health`) require a Firebase ID token:

```
Authorization: Bearer <firebase-id-token>
```

## 🧪 Testing

Test the API with curl:

```bash
# Health check
curl http://localhost:3000/health

# Create user (requires auth token)
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"uid":"123","email":"test@example.com","name":"Test User","role":"farmer","district":"Galle"}'
```

## 🤖 ML Model Integration

The current implementation returns mock data. To integrate actual ML models:

1. **Growth Stage Model**: Update `/routes/growthRoutes.js` - `POST /stage`
2. **Harvest Prediction Model**: Update `/routes/growthRoutes.js` - `POST /harvest`
3. **Quality Grading Model**: Update `/routes/qualityRoutes.js` - `POST /farmer` and `/customer`
4. **Market Price Model**: Update `/routes/marketRoutes.js` - `POST /predict`
5. **Leaf Disease Model**: Update `/routes/leafRoutes.js` - `POST /predict`

Each `// TODO` comment marks where ML integration is needed.

## 📁 Project Structure

```
backend/
├── config/
│   ├── db.js                    # MongoDB connection
│   ├── firebaseAdmin.js         # Firebase Admin SDK setup
│   └── firebase-service-account.json  # (not in repo)
├── middleware/
│   └── auth.js                  # JWT authentication middleware
├── models/
│   ├── User.js                  # User model
│   └── PredictionLog.js         # Prediction history model
├── routes/
│   ├── userRoutes.js            # User endpoints
│   ├── growthRoutes.js          # Growth & harvest endpoints
│   ├── qualityRoutes.js         # Quality grading endpoints
│   ├── marketRoutes.js          # Market price endpoints
│   └── leafRoutes.js            # Leaf disease endpoints
├── .env                         # Environment variables (not in repo)
├── .env.example                 # Example environment file
├── server.js                    # Main server file
└── package.json                 # Dependencies
```

## 🔧 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/papaya_pulse` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Path to Firebase service account JSON | `./config/firebase-service-account.json` |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `*` |
| `NODE_ENV` | Environment (development/production) | `development` |

## 📝 License

ISC
