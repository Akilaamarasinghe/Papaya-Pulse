# Troubleshooting 500 Errors - Sign In & Profile Loading

## Error Summary
```
ERROR: Sign in error: [AxiosError: Request failed with status code 500]
ERROR: Error loading user profile: [AxiosError: Request failed with status code 500]
```

These errors occur when the frontend tries to call `/api/users/me` endpoint after Firebase authentication, but the backend fails to process the request.

---

## Diagnostic Checklist

### 1. **Backend Server Status** ✅ CRITICAL
Check if the backend server is actually running:

```bash
# In backend directory
npm start

# Expected output:
# 🚀 Papaya Pulse API Server running on port 3000
# ✅ MongoDB Connected: <cluster-url>
# 📊 Database: papaya-pulse
```

**If server doesn't start**, check the error messages and follow the specific resolution below.

---

### 2. **MongoDB Connection Issues**

#### Problem: "MongoDB Connection Error" at startup

**Resolution:**
1. Verify your MongoDB URI in `.env` is complete:
   ```
   MONGODB_URI=mongodb+srv://udanpasindu934_db_user:tEtpCXSbArwumUGA@papayapulsemobile.ebe6bst.mongodb.net/papaya-pulse
   ```
   ⚠️ Your current URI is **incomplete** - missing database name at the end

2. Add database name if not present:
   ```
   MONGODB_URI=mongodb+srv://udanpasindu934_db_user:tEtpCXSbArwumUGA@papayapulsemobile.ebe6bst.mongodb.net/papaya-pulse
   ```

3. If using Windows and getting DNS errors:
   ```bash
   # Flush DNS cache
   ipconfig /flushdns
   ```

4. Restart backend:
   ```bash
   npm start
   ```

---

### 3. **Firebase Authentication Issues**

#### Problem: "Firebase service account file not found"

**Resolution:**
The file exists at `backend/config/firebase-service-account.json` ✅

But verify:
1. File is not corrupted (JSON should be valid)
2. Contains valid credentials with matching project ID: `papaya-pulse`

#### Problem: Token verification fails

**When debugging:**
- Check backend logs for: `[Auth] Token verification failed`
- If error mentions "auth() is not initialized", Firebase Admin SDK failed to initialize
- Check that `firebase-service-account.json` has valid private key

---

### 4. **API Endpoint Connectivity**

Your app.json specifies API URL:
```json
"extra": {
  "apiUrl": "http://172.20.10.2:3000/api"
}
```

**Verify the IP address:**

On Windows, run:
```bash
ipconfig
```

Look for "IPv4 Address" - should match what's in app.json

**If different:**
1. Update app.json with your actual IP
2. Make sure backend runs with `0.0.0.0` binding (it does ✅)
3. Make sure firewall allows port 3000

---

### 5. **User Model Issues**

#### Problem: "User not found" after sign in

**When this happens:**
1. Firebase authentication succeeds ✅
2. Backend tries to find user profile in MongoDB
3. User doesn't exist in database

**Why:**
The user was created in Firebase but not in MongoDB during signup

**Resolution:**
1. Check backend logs for: `[POST /users] User created successfully`
2. If not present, signup endpoint failed silently
3. Try signing up again with proper network connectivity

---

## Step-by-Step Debug Guide

### Step 1: Verify Backend is Running
```bash
# Terminal 1 - Navigate to backend
cd backend

# Check if .env exists and has MONGODB_URI
type .env

# Start server
npm start
```

Look for these exact logs:
```
🚀 Papaya Pulse API Server running on port 3000
✅ MongoDB Connected: papayapulsemobile.ebe6bst.mongodb.net
📊 Database: papaya-pulse
```

### Step 2: Test Backend API Directly
Open PowerShell or Command Prompt:

```bash
# Test health endpoint
curl http://172.20.10.2:3000/health

# Expected response:
{"status":"OK","timestamp":"2026-01-04T..."}
```

### Step 3: Check Network Connectivity
```bash
# Test if backend IP is reachable from your dev machine
ping 172.20.10.2

# If unreachable:
# 1. Verify backend is on same network
# 2. Check Windows Firewall (disable temporarily for testing)
# 3. Run backend with: npm start (should bind to 0.0.0.0)
```

### Step 4: Monitor Backend Logs While Testing
Backend now has improved logging. Look for these patterns:

**Successful sign in:**
```
[Auth] Token verified for UID: <firebase-uid>
[POST /users] Creating user profile: { uid, email, role }
[POST /users] User created successfully: <firebase-uid>
```

**Failed sign in:**
```
[Auth] No authorization header or invalid format
[Auth] Token verification failed: <error-message>
[GET /me] User not found for UID: <firebase-uid>
```

---

## Common Solutions

### Solution 1: Complete Your MongoDB URI
**File:** `backend/.env`

**Change:**
```diff
- MONGODB_URI=mongodb+srv://udanpasindu934_db_user:tEtpCXSbArwumUGA@papayapulsemobile.ebe6bst.mongodb.net/
+ MONGODB_URI=mongodb+srv://udanpasindu934_db_user:tEtpCXSbArwumUGA@papayapulsemobile.ebe6bst.mongodb.net/papaya-pulse
```

Then restart:
```bash
npm start
```

---

### Solution 2: Update API URL in Frontend
**File:** `frontend/app.json`

Get your IP:
```bash
ipconfig
```

Update:
```json
"extra": {
  "apiUrl": "http://YOUR_ACTUAL_IP:3000/api"
}
```

Then rebuild frontend:
```bash
npm run start  # For Expo
```

---

### Solution 3: Fix Firewall Issues (Windows)

1. **Allow port 3000:**
   - Windows Defender Firewall → Advanced Settings
   - Inbound Rules → New Rule
   - Port: 3000, Action: Allow

2. **Or temporarily disable for testing:**
   ```bash
   netsh advfirewall set allprofiles state off
   # Run test
   # Re-enable: netsh advfirewall set allprofiles state on
   ```

---

## SafeAreaView Warning Resolution

The warning you're seeing:
```
WARN SafeAreaView has been deprecated...
```

**Status:** ✅ Already fixed in your code

Your files already import from correct package:
```tsx
import { SafeAreaView } from 'react-native-safe-area-context';
```

**To ensure package is installed:**
```bash
cd frontend
npm install react-native-safe-area-context
# or
expo install react-native-safe-area-context
```

---

## Verification Checklist

- [ ] MongoDB URI in `.env` includes database name
- [ ] Backend starts successfully with `npm start`
- [ ] Can reach `http://172.20.10.2:3000/health` (or your IP)
- [ ] Firebase service account file exists and is valid JSON
- [ ] API URL in frontend matches your machine's IP
- [ ] Windows Firewall allows port 3000 or 0.0.0.0
- [ ] User can sign up (see `[POST /users] User created successfully` in logs)
- [ ] User profile loads (see `[GET /me] User profile retrieved successfully` in logs)

---

## Additional Resources

- [MongoDB Connection String Docs](https://docs.mongodb.com/drivers/node/)
- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context)

---

## Still Having Issues?

**Collect these from backend console:**
1. Full startup log output
2. Exact error message when trying to sign in
3. Full stack trace from console errors
4. Result of `http://IP:3000/health` endpoint

Then check backend logs file if one exists, or share the console output for further investigation.
