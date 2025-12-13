# 🍈 Papaya Pulse

AI-powered assistant for Sri Lankan papaya farmers and customers, following Department of Agriculture (DoA) protocols.

## 📱 Features

### 🌱 Growth Stage & Harvest Prediction
- **Growth Stage Check**: Take a photo to identify plant growth stage (A-D)
- **Harvest Prediction**: Calculate expected harvest time and yield per tree based on:
  - Number of trees
  - Planting month
  - Watering method (Drip/Sprinkler/Manual)
  - Soil type
  - District

### 🍏 Papaya Quality Grader
- **Farmer Side**: Grade papayas before selling with damage assessment
- **Customer Side**: Check papaya quality and ripeness before buying
- Quality grades: A, B, C
- Ripeness prediction and taste estimation

### 💰 Market Price Predictor (Farmers Only)
- Predict optimal selling price per kg
- Calculate total expected income
- Get best selling time recommendations
- Based on:
  - District
  - Variety (Red Lady, Solo, Tainung)
  - Cultivation method (Organic/Inorganic)
  - Quality grade

### 🍃 Leaf Disease Scanner
- Identify papaya leaf diseases:
  - Anthracnose
  - Curl
  - Mite disease
  - Ringspot
  - Healthy leaves
- Severity assessment (mild/moderate/severe)
- Treatment recommendations
- Scan history with local storage

## 🏗️ Tech Stack

### Frontend
- **Framework**: React Native + Expo
- **Routing**: Expo Router (file-based routing)
- **Language**: TypeScript
- **Authentication**: Firebase Authentication
- **HTTP Client**: Axios
- **Image Handling**: expo-image-picker
- **Storage**: AsyncStorage
- **UI**: Custom components with responsive design

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB with Mongoose
- **Authentication**: Firebase Admin SDK
- **File Upload**: Multer
- **Logging**: Morgan

## 🚀 Getting Started

### Prerequisites
- Node.js (v16+)
- npm or yarn
- MongoDB (v5+)
- Expo CLI
- Firebase project
- iOS Simulator or Android Emulator (or physical device)

### 1. Clone the Repository
```bash
git clone https://github.com/Akilaamarasinghe/Papaya-Pulse.git
cd Papaya-Pulse
```

### 2. Setup Frontend

```bash
cd papayapulse
npm install
```

#### Configure Firebase
Edit `papayapulse/config/firebase.ts` with your Firebase credentials:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_STORAGE_BUCKET",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

#### Configure API Endpoint
Edit `papayapulse/config/api.ts`:
```typescript
const API_BASE_URL = 'http://YOUR_IP:3000/api'; // Use your machine's IP for physical devices
```

#### Run the App
```bash
npm start
```

Scan the QR code with:
- Expo Go app (iOS/Android)
- Press `i` for iOS simulator
- Press `a` for Android emulator

### 3. Setup Backend

```bash
cd backend
npm install
```

#### Setup Environment
```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/papaya_pulse
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
```

#### Firebase Admin SDK
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Project Settings > Service Accounts
3. Generate New Private Key
4. Save as `backend/config/firebase-service-account.json`

#### Start MongoDB
```bash
# Windows
net start MongoDB

# macOS/Linux
sudo systemctl start mongod
```

#### Run the Server
```bash
npm run dev
```

Server runs at `http://localhost:3000`

## 📖 User Guide

### Sign Up
1. Open the app
2. Click "Don't have an account? Sign Up"
3. Fill in:
   - Full name
   - Email
   - Password
   - Role (Farmer/Customer)
   - District

### Modules

#### Growth Stage & Harvest
1. From home, tap "Growth Stage & Harvest"
2. Choose:
   - **Stage Check**: Take photo → Get growth stage
   - **Harvest Prediction**: Enter details → Get yield & days

#### Quality Grader
1. Tap "Papaya Quality Grader"
2. Choose your role:
   - **Farmer**: Enter details + photo → Get grade
   - **Customer**: Photo + weight → Get quality info

#### Market Price (Farmers)
1. Tap "Market Price Predictor"
2. Enter harvest details
3. Get price prediction and selling advice

#### Leaf Disease Scanner
1. Tap "Leaf Disease Scanner"
2. **Scan Leaf**: Take photo → Get disease + treatment
3. **History**: View past scans

## 🔐 Authentication Flow

1. User signs up with email/password
2. Firebase creates authentication account
3. Frontend gets ID token
4. Backend creates user profile in MongoDB
5. All API requests include Bearer token
6. Backend validates token with Firebase Admin SDK

## 📡 API Documentation

### Base URL
```
http://localhost:3000/api
```

### Authentication
All endpoints require header:
```
Authorization: Bearer <firebase-id-token>
```

### Endpoints

#### Users
- `POST /users` - Create user profile
- `GET /users/me` - Get current user

#### Growth
- `POST /growth/stage` - Analyze growth stage (multipart/form-data)
- `POST /growth/harvest` - Predict harvest

#### Quality
- `POST /quality/farmer` - Farmer grading (multipart/form-data)
- `POST /quality/customer` - Customer check (multipart/form-data)
- `GET /quality/farmer/history` - Farmer history
- `GET /quality/customer/history` - Customer history

#### Market
- `POST /market/predict` - Price prediction (farmers only)

#### Leaf
- `POST /leaf/predict` - Disease detection (multipart/form-data)
- `GET /leaf/history` - Scan history

## 🤖 ML Model Integration

Current implementation uses **mock data**. To integrate real ML models:

1. **Host ML models** (Flask/FastAPI server or cloud service)
2. **Update backend routes** (marked with `// TODO` comments):
   - `routes/growthRoutes.js` - Growth stage & harvest
   - `routes/qualityRoutes.js` - Quality grading
   - `routes/marketRoutes.js` - Price prediction
   - `routes/leafRoutes.js` - Disease detection
3. **Call ML API** from backend using HTTP/gRPC
4. **Return predictions** to frontend

Example integration:
```javascript
// In leafRoutes.js
const axios = require('axios');

const mlResponse = await axios.post('http://ml-server:5000/predict', {
  image: req.file.buffer.toString('base64')
});

const response = {
  disease: mlResponse.data.disease,
  disease_confidence: mlResponse.data.confidence,
  // ...
};
```

## 📁 Project Structure

```
Papaya-Pulse/
├── papayapulse/              # React Native Frontend
│   ├── app/                  # Expo Router screens
│   │   ├── (tabs)/          # Tab navigation
│   │   ├── growth/          # Growth module
│   │   ├── quality/         # Quality module
│   │   ├── market/          # Market module
│   │   ├── leaf/            # Leaf disease module
│   │   ├── login.tsx        # Login screen
│   │   ├── signup.tsx       # Sign up screen
│   │   └── _layout.tsx      # Root layout
│   ├── components/
│   │   └── shared/          # Reusable components
│   ├── config/              # Firebase & API config
│   ├── context/             # React Context (Auth)
│   ├── types/               # TypeScript types
│   └── package.json
│
└── backend/                  # Node.js Backend
    ├── config/              # DB & Firebase Admin
    ├── middleware/          # Auth middleware
    ├── models/              # Mongoose models
    ├── routes/              # API routes
    ├── server.js            # Main server
    └── package.json
```

## 🎨 UI/UX Design

- **Large touch targets** for easy navigation
- **Simple, clean interface** suitable for farmers
- **Sinhala-friendly layout** (extendable for i18n)
- **Clear visual feedback** for all actions
- **Offline history** for leaf scans
- **Color-coded results** (grades, severity levels)

## 🌍 Districts Supported
- Hambanthota
- Matara
- Galle

## 🌾 Papaya Varieties
- Red Lady
- Solo
- Tainung (Tenim)

## 🐛 Troubleshooting

### Cannot connect to backend
- Ensure MongoDB is running
- Check backend is running on port 3000
- Use your machine's IP address (not localhost) in `api.ts` for physical devices
- Check firewall settings

### Firebase errors
- Verify Firebase config is correct
- Ensure Firebase service account JSON is in place
- Check Firebase Authentication is enabled in console

### Camera not working
- Grant camera permissions in device settings
- Use physical device if simulator has issues

## 📄 License

ISC

## 👥 Contributors

- Akila Amarasinghe (@Akilaamarasinghe)

## 🙏 Acknowledgments

- Department of Agriculture, Sri Lanka
- Sri Lankan papaya farming community
- Open source libraries and tools used

---

**Built with ❤️ for Sri Lankan farmers**
