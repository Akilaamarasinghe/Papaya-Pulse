# 🍈 Papaya Pulse - Complete Project Index

Welcome to **Papaya Pulse**, your AI-powered assistant for papaya farming in Sri Lanka!

## 📚 Documentation Quick Links

### Start Here
1. 📖 **[IMPORTANT_READ_FIRST.md](IMPORTANT_READ_FIRST.md)** - Must read before starting (explains TypeScript errors)
2. 🚀 **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - Step-by-step installation instructions
3. 📦 **[CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md)** - What has been generated

### Detailed Documentation
- 📘 **[PROJECT_README.md](PROJECT_README.md)** - Complete project documentation
- 🔌 **[backend/README.md](backend/README.md)** - Backend API documentation

### Setup Scripts
- 💻 **setup.bat** - Windows automated setup
- 🐧 **setup.sh** - macOS/Linux automated setup

## 🗂️ Project Structure

```
Papaya-Pulse/
│
├── 📱 papayapulse/                    # React Native Frontend
│   ├── app/                           # All screens (Expo Router)
│   │   ├── (tabs)/                   # Tab navigation
│   │   │   └── index.tsx             # Home screen ⭐
│   │   ├── growth/                   # Module 1: Growth & Harvest
│   │   │   ├── index.tsx
│   │   │   ├── stage-check.tsx
│   │   │   ├── harvest-form.tsx
│   │   │   └── harvest-result.tsx
│   │   ├── quality/                  # Module 2: Quality Grader
│   │   │   ├── index.tsx
│   │   │   ├── farmer-input.tsx
│   │   │   ├── farmer-result.tsx
│   │   │   ├── customer-input.tsx
│   │   │   └── customer-result.tsx
│   │   ├── market/                   # Module 3: Market Price
│   │   │   ├── index.tsx
│   │   │   └── result.tsx
│   │   ├── leaf/                     # Module 4: Leaf Disease
│   │   │   ├── index.tsx
│   │   │   ├── scan.tsx
│   │   │   ├── result.tsx
│   │   │   └── history.tsx
│   │   ├── login.tsx                 # Authentication
│   │   ├── signup.tsx
│   │   └── _layout.tsx               # Root layout with AuthProvider
│   ├── components/
│   │   └── shared/                   # Reusable UI components
│   │       ├── PrimaryButton.tsx
│   │       ├── Card.tsx
│   │       ├── Dropdown.tsx
│   │       ├── LabeledInput.tsx
│   │       └── ScreenContainer.tsx
│   ├── config/                       # Configuration
│   │   ├── firebase.ts               # Firebase init ⚙️
│   │   └── api.ts                    # Axios setup ⚙️
│   ├── context/
│   │   └── AuthContext.tsx           # Authentication context
│   ├── types/
│   │   └── index.ts                  # TypeScript definitions
│   └── package.json                  # Dependencies
│
├── 🔌 backend/                        # Node.js Backend
│   ├── config/
│   │   ├── db.js                     # MongoDB connection
│   │   ├── firebaseAdmin.js          # Firebase Admin SDK
│   │   └── firebase-service-account.json  # ⚙️ Add your file here
│   ├── middleware/
│   │   └── auth.js                   # JWT authentication
│   ├── models/
│   │   ├── User.js                   # User schema
│   │   └── PredictionLog.js          # Prediction history
│   ├── routes/                       # API endpoints
│   │   ├── userRoutes.js             # POST /api/users, GET /api/users/me
│   │   ├── growthRoutes.js           # POST /api/growth/*
│   │   ├── qualityRoutes.js          # POST /api/quality/*
│   │   ├── marketRoutes.js           # POST /api/market/predict
│   │   └── leafRoutes.js             # POST /api/leaf/predict
│   ├── .env                          # ⚙️ Environment variables (create from .env.example)
│   ├── .env.example                  # Template
│   ├── server.js                     # Main server ⭐
│   └── package.json                  # Dependencies
│
└── 📚 Documentation Files
    ├── IMPORTANT_READ_FIRST.md       # ⭐ Start here!
    ├── SETUP_GUIDE.md                # Installation guide
    ├── PROJECT_README.md             # Full documentation
    ├── CODEBASE_SUMMARY.md           # Generated files list
    ├── setup.bat                     # Windows setup script
    └── setup.sh                      # Unix setup script
```

## 🎯 Quick Start Guide

### Prerequisites
- ✅ Node.js (v16+)
- ✅ MongoDB (v5+)
- ✅ Firebase account
- ✅ Expo CLI
- ✅ iOS/Android emulator or physical device

### Installation (5 minutes)

**Step 1: Install Dependencies**
```bash
# Frontend
cd papayapulse
npm install

# Backend
cd ../backend
npm install
```

**Step 2: Configure**
- Edit `papayapulse/config/firebase.ts` with your Firebase web config
- Edit `papayapulse/config/api.ts` with your backend URL
- Copy `backend/.env.example` to `backend/.env`
- Add Firebase Admin SDK JSON to `backend/config/`

**Step 3: Run**
```bash
# Terminal 1: Start MongoDB
mongod  # or: net start MongoDB (Windows)

# Terminal 2: Start Backend
cd backend
npm run dev

# Terminal 3: Start Frontend
cd papayapulse
npm start
```

## ✨ Features Overview

### 🌱 Module 1: Growth Stage & Harvest Prediction
- Take plant photo → Get growth stage (A-D)
- Enter farm details → Predict harvest time & yield

### 🍏 Module 2: Papaya Quality Grader
- **Farmer Mode**: Grade papayas before selling (A/B/C)
- **Customer Mode**: Check quality before buying

### 💰 Module 3: Market Price Predictor (Farmers Only)
- Get price prediction per kg
- Calculate total income
- Find best selling time

### 🍃 Module 4: Leaf Disease Scanner
- Scan leaf → Identify disease
- Get treatment recommendations
- View scan history

## 🔐 Authentication

- Firebase email/password authentication
- Role-based access (Farmer/Customer)
- District selection (Hambanthota/Matara/Galle)
- Secure JWT token validation

## 🤖 ML Integration Points

All marked with `// TODO` comments in backend:
1. Growth stage detection (`routes/growthRoutes.js`)
2. Harvest prediction (`routes/growthRoutes.js`)
3. Quality grading (`routes/qualityRoutes.js`)
4. Market price prediction (`routes/marketRoutes.js`)
5. Leaf disease detection (`routes/leafRoutes.js`)

Currently using **mock data** for testing.

## 📡 API Endpoints

Base URL: `http://localhost:3000/api`

### User
- `POST /users` - Create profile
- `GET /users/me` - Get current user

### Growth
- `POST /growth/stage` - Analyze stage (image)
- `POST /growth/harvest` - Predict harvest

### Quality
- `POST /quality/farmer` - Farmer grading (image)
- `POST /quality/customer` - Customer check (image)
- `GET /quality/farmer/history` - History
- `GET /quality/customer/history` - History

### Market
- `POST /market/predict` - Price prediction

### Leaf
- `POST /leaf/predict` - Disease detection (image)
- `GET /leaf/history` - Scan history

## 🎨 Tech Stack

### Frontend
- React Native + Expo SDK 54
- Expo Router (file-based routing)
- TypeScript
- Firebase Authentication
- Axios for API calls
- AsyncStorage for offline data

### Backend
- Node.js + Express
- MongoDB + Mongoose
- Firebase Admin SDK
- Multer (file uploads)
- CORS enabled

## 📱 Supported Platforms
- ✅ iOS (Simulator + Device)
- ✅ Android (Emulator + Device)
- ✅ Web (limited features)

## 🔧 Configuration Files to Edit

Before running, configure these files:

### Frontend
1. **`papayapulse/config/firebase.ts`**
   ```typescript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     // ... rest of config
   };
   ```

2. **`papayapulse/config/api.ts`**
   ```typescript
   const API_BASE_URL = 'http://YOUR_IP:3000/api';
   ```

### Backend
1. **`backend/.env`**
   ```env
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/papaya_pulse
   FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
   ```

2. **`backend/config/firebase-service-account.json`**
   - Download from Firebase Console
   - Place in config folder

## 🐛 Troubleshooting

### Seeing TypeScript Errors?
**Normal!** Run `npm install` in `papayapulse` folder. See [IMPORTANT_READ_FIRST.md](IMPORTANT_READ_FIRST.md)

### Cannot Connect to Backend?
- Check backend is running on port 3000
- Use your computer's IP (not localhost) for physical devices
- Ensure MongoDB is running

### Firebase Errors?
- Verify firebase.ts configuration
- Check service account JSON is in place
- Enable Email/Password auth in Firebase Console

## 📞 Support

- 📖 Check [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed instructions
- 📚 Read [PROJECT_README.md](PROJECT_README.md) for full documentation
- 🔍 See [CODEBASE_SUMMARY.md](CODEBASE_SUMMARY.md) for file details

## 🎓 What You Can Do Now

✅ Run the complete application
✅ Sign up and authenticate users
✅ Test all 4 modules
✅ Take and upload photos
✅ View predictions and results
✅ Customize UI and features
✅ Integrate real ML models
✅ Deploy to production

## 🚀 Deployment

### Frontend
- Use Expo EAS Build
- Submit to App Store / Play Store
- Or use Expo Go for testing

### Backend
- Deploy to Heroku, Railway, Render, or AWS
- Use MongoDB Atlas for cloud database
- Set environment variables on hosting platform

## 📄 License

ISC

## 👨‍💻 Development

### Frontend Dev Commands
```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
```

### Backend Dev Commands
```bash
npm run dev        # Development (with auto-reload)
npm start          # Production
```

## ✨ Highlights

- 🏗️ Production-ready architecture
- 🔒 Secure authentication
- 📱 User-friendly UI/UX
- 🎨 Modern design
- 🧪 Ready for testing
- 📝 Well-documented
- 🚀 Easy to deploy

---

**Built with ❤️ for Sri Lankan papaya farmers**

🍈 **Papaya Pulse** - Growing Better Together
