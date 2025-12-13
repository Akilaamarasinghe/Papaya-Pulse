# 🚀 Papaya Pulse - Quick Setup Guide

Complete setup instructions for getting Papaya Pulse running on your machine.

## ⚡ Quick Start (5 minutes)

### Step 1: Install Prerequisites

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **MongoDB** (v5 or higher)
   - Download from: https://www.mongodb.com/try/download/community
   - Verify: `mongod --version`

3. **Expo CLI**
   ```bash
   npm install -g expo-cli
   ```

### Step 2: Firebase Setup (3 minutes)

1. Go to https://console.firebase.google.com/
2. Create a new project called "Papaya Pulse"
3. Enable **Email/Password** authentication:
   - Authentication > Sign-in method > Email/Password > Enable

4. Get Web Config:
   - Project Settings > General > Your apps > Web app
   - Copy the config object

5. Get Admin SDK:
   - Project Settings > Service accounts
   - Click "Generate new private key"
   - Download JSON file

### Step 3: Frontend Setup

```bash
cd papayapulse
npm install
```

**Edit** `papayapulse/config/firebase.ts`:
```typescript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

**Edit** `papayapulse/config/api.ts`:
```typescript
// For testing on physical device, use your computer's IP
const API_BASE_URL = 'http://192.168.1.XXX:3000/api'; 
// For emulator, use: http://localhost:3000/api
```

### Step 4: Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

**Create** `backend/config/firebase-service-account.json`:
- Copy the downloaded Firebase Admin SDK JSON file here

**Edit** `backend/.env`:
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/papaya_pulse
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
ALLOWED_ORIGINS=http://localhost:8081,exp://localhost:8081
```

### Step 5: Start Services

**Terminal 1 - Start MongoDB:**
```bash
# Windows
net start MongoDB

# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

**Terminal 2 - Start Backend:**
```bash
cd backend
npm run dev
```
✅ Should see: `🚀 Papaya Pulse API Server running on port 3000`

**Terminal 3 - Start Frontend:**
```bash
cd papayapulse
npm start
```
✅ Should see Expo DevTools QR code

### Step 6: Test the App

**On Physical Device:**
1. Install "Expo Go" from App Store/Play Store
2. Scan the QR code
3. Sign up with test account

**On Emulator:**
- Press `i` for iOS simulator
- Press `a` for Android emulator

## 🧪 Test Credentials

Create test accounts:
- **Farmer**: farmer@test.com / password123
- **Customer**: customer@test.com / password123

## ✅ Verification Checklist

- [ ] MongoDB is running (`mongo` command works)
- [ ] Backend server shows "MongoDB Connected"
- [ ] Backend responds to http://localhost:3000/health
- [ ] Frontend starts without errors
- [ ] Can sign up a new user
- [ ] Can log in
- [ ] Home screen shows 4 modules
- [ ] Can navigate to each module

## 🐛 Common Issues

### Issue: "Cannot connect to backend"
**Solution:** 
- Check backend is running on port 3000
- Use your computer's IP address in api.ts (find with `ipconfig` on Windows or `ifconfig` on Mac/Linux)
- Add your IP to firewall exceptions

### Issue: "Firebase auth error"
**Solution:**
- Double-check firebase.ts config
- Ensure Email/Password is enabled in Firebase Console
- Check service account JSON is in correct location

### Issue: "MongoDB connection failed"
**Solution:**
- Ensure MongoDB is running
- Check MONGODB_URI in .env
- Try: `mongo` command to verify MongoDB is accessible

### Issue: "Camera not working"
**Solution:**
- Physical device: Grant camera permissions
- Simulator: Use device menu to select/upload photo

### Issue: "Module not found"
**Solution:**
```bash
# Frontend
cd papayapulse
rm -rf node_modules package-lock.json
npm install

# Backend
cd backend
rm -rf node_modules package-lock.json
npm install
```

## 📱 Running on Device

**Get your computer's IP:**
```bash
# Windows
ipconfig
# Look for IPv4 Address (e.g., 192.168.1.XXX)

# Mac/Linux
ifconfig
# Look for inet address
```

**Update api.ts:**
```typescript
const API_BASE_URL = 'http://192.168.1.XXX:3000/api';
```

**Ensure devices on same network:**
- Computer and phone on same WiFi
- Disable VPN
- Check firewall allows port 3000

## 🔧 Development Commands

**Frontend:**
```bash
cd papayapulse
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS
npm run web        # Run in browser
```

**Backend:**
```bash
cd backend
npm run dev        # Development mode (auto-reload)
npm start          # Production mode
```

## 📊 Testing API Endpoints

**Health check:**
```bash
curl http://localhost:3000/health
```

**Create user (needs token):**
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "uid": "test123",
    "email": "test@example.com",
    "name": "Test User",
    "role": "farmer",
    "district": "Galle"
  }'
```

## 🎓 Next Steps

1. **Test all features:**
   - Sign up as farmer and customer
   - Try each module
   - Upload images
   - Check history

2. **Customize:**
   - Add your logo to `papayapulse/assets/images/`
   - Modify colors in components
   - Add more districts/varieties

3. **Deploy:**
   - Frontend: Use Expo EAS Build
   - Backend: Deploy to Heroku, Railway, or AWS
   - Database: MongoDB Atlas (cloud)

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [Firebase Docs](https://firebase.google.com/docs)

## 💡 Tips

- Use `console.log()` for debugging
- Check backend terminal for API errors
- Use React DevTools for frontend debugging
- MongoDB Compass for database visualization

---

**Need Help?** Open an issue on GitHub or check the documentation!

Happy coding! 🌱🍈
