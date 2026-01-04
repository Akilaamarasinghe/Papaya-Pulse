# HTTP 500 Error Diagnostic Guide

## What These Errors Mean

```
ERROR: Sign in error: [AxiosError: Request failed with status code 500]
ERROR: Error loading user profile: [AxiosError: Request failed with status code 500]
```

**Translation:** Your frontend successfully authenticated with Firebase, got a valid token, but the backend API failed when trying to fetch or create your user profile.

---

## Error Chain Analysis

### Error 1: "Sign in error - 500"
**When it happens:**
1. ✅ Email & password verified successfully (Firebase)
2. ✅ Got ID token from Firebase
3. ❌ Called `GET /api/users/me` → Backend returns 500

**Why it fails:**
- Backend crashed or not running
- Database connection failed
- User not found (but should return 404, not 500)
- Database query error

---

### Error 2: "Error loading user profile - 500"
**When it happens:**
1. ✅ Page loads & gets Firebase user
2. ✅ Got ID token from Firebase
3. ❌ Called `GET /api/users/me` → Backend returns 500

**Why it fails:**
- Same as Error 1

---

## Immediate Diagnostics

### Step 1: Is Backend Running?
```bash
# Open PowerShell/CMD and run:
netstat -ano | findstr ":3000"

# If you see a line, port 3000 is listening ✓
# If no output, backend is NOT running ❌
```

### Step 2: Can You Reach Backend?
```bash
# Get your IP first:
ipconfig

# Look for "IPv4 Address", e.g., 192.168.x.x

# Test connection:
curl http://192.168.x.x:3000/health

# Success response:
# {"status":"OK","timestamp":"2026-01-04T..."}

# Connection refused = Backend not accessible
```

### Step 3: Check Backend Console
Look for these messages when server starts:

**✅ Good Signs:**
```
✅ MongoDB Connected: papayapulsemobile.ebe6bst.mongodb.net
📊 Database: papaya-pulse
🚀 Papaya Pulse API Server running on port 3000
```

**❌ Bad Signs:**
```
❌ MongoDB Connection Error: ...
ECONNREFUSED (port 3000 might be blocked)
ENOTFOUND papayapulsemobile.ebe6bst.mongodb.net (DNS issue)
Cannot find module 'mongoose' (dependencies not installed)
```

---

## Root Cause: Most Likely Issues (in order)

### #1: Backend Not Running (Most Common - 70%)
```bash
# Check if you actually started the backend
# Look for terminal window with Node running

# If not running:
cd backend
npm start
```

**Wait for:**
```
✅ MongoDB Connected
🚀 Papaya Pulse API Server running on port 3000
```

---

### #2: MongoDB Connection Failed (50% of backend startup failures)
**Error in backend console:**
```
❌ MongoDB Connection Error: querySrv ENOTFOUND _mongodb._tcp.papayapulsemobile.ebe6bst.mongodb.net
```

**Solutions:**

A. **Fix incomplete MongoDB URI** (Your issue!)
   - File: `backend/.env`
   - Current: `mongodb+srv://...mongodb.net/` (missing database name)
   - Fix: Add `/papaya-pulse` at the end
   - Restart: `npm start`

B. **Network/DNS Issues**
   ```bash
   # Windows DNS flush
   ipconfig /flushdns
   
   # Restart backend
   cd backend && npm start
   ```

C. **Firewall/VPN Issues**
   ```bash
   # Temporarily disable Windows Firewall for testing
   netsh advfirewall set allprofiles state off
   
   # Test backend
   npm start
   
   # Re-enable
   netsh advfirewall set allprofiles state on
   ```

D. **MongoDB Atlas Network Access**
   - Go to: https://cloud.mongodb.com/
   - Your Project → Network Access
   - Make sure `0.0.0.0/0` is allowed (or add your IP)

---

### #3: Wrong IP in Frontend (20% of 500 errors)
**Error pattern:**
- Backend runs fine locally
- But frontend can't reach it

**Check app.json:**
```json
"extra": {
  "apiUrl": "http://172.20.10.2:3000/api"
}
```

**Get your actual IP:**
```bash
ipconfig
# Find "IPv4 Address: 192.168.x.x" or "10.0.0.x"
```

**Update app.json** if different:
```json
"extra": {
  "apiUrl": "http://YOUR_ACTUAL_IP:3000/api"
}
```

---

### #4: Firewall Blocking Port 3000 (10% of issues)

**Add firewall exception:**
1. Windows Defender Firewall → Advanced Settings
2. Inbound Rules → New Rule
3. Port TCP 3000, Allow all connections
4. Apply

**Or temporarily disable:**
```bash
netsh advfirewall set allprofiles state off
# Test
netsh advfirewall set allprofiles state on
```

---

### #5: Firebase Service Account Issues (5%)
**Error in backend logs:**
```
Firebase initialization failed
Cannot read property 'verifyIdToken' of undefined
```

**Fix:**
1. Check file exists: `backend/config/firebase-service-account.json` ✓
2. Verify it's valid JSON (not corrupted)
3. Check project ID matches: `"project_id": "papaya-pulse"` ✓
4. Restart backend: `npm start`

---

## Debug Checklist - Run This Now

```
Backend Health Check:
☐ Backend running (can see "🚀 Papaya Pulse API Server running on port 3000")
☐ MongoDB connected (can see "✅ MongoDB Connected")
☐ Port 3000 listening (netstat shows :3000)
☐ IP correct in frontend app.json (matches ipconfig)
☐ Can reach http://YOUR_IP:3000/health

Frontend Configuration Check:
☐ API URL matches your machine IP
☐ Firebase config exists (backend/config/firebase-service-account.json)
☐ .env has MONGODB_URI with database name

Network Check:
☐ Both devices on same WiFi
☐ No VPN interfering
☐ Firewall allows port 3000
```

---

## Step-by-Step Recovery

### Step 1: Stop Everything
```bash
# Close all Node terminals
# Press Ctrl+C in any running terminals
```

### Step 2: Fix MongoDB URI
Edit `backend/.env`:
```bash
# From:
MONGODB_URI=mongodb+srv://udanpasindu934_db_user:tEtpCXSbArwumUGA@papayapulsemobile.ebe6bst.mongodb.net/

# To:
MONGODB_URI=mongodb+srv://udanpasindu934_db_user:tEtpCXSbArwumUGA@papayapulsemobile.ebe6bst.mongodb.net/papaya-pulse
```

### Step 3: Get Your IP
```bash
ipconfig
# Note down IPv4 Address (e.g., 192.168.1.50)
```

### Step 4: Update Frontend
Edit `frontend/app.json`:
```json
"extra": {
  "apiUrl": "http://192.168.1.50:3000/api"
}
```

### Step 5: Start Backend
```bash
cd backend
npm install  # (first time only)
npm start
```

### Step 6: Start Frontend
```bash
# New terminal
cd frontend
npm install  # (first time only)
npm start
```

### Step 7: Watch Logs
**Backend should show:**
```
✅ MongoDB Connected
🚀 Papaya Pulse API Server running on port 3000
[Auth] Token verified for UID: ...
[GET /me] User profile retrieved successfully
```

**Frontend should show:**
- No more 500 errors
- Successful login

---

## If Still Getting 500 Errors

**Collect this information:**

1. Full backend console output (from `npm start` to now)
2. Test output from: `curl http://YOUR_IP:3000/health`
3. Your actual IP from: `ipconfig`
4. Frontend app.json `apiUrl` value
5. Backend `.env` MongoDB URI (hide the password)
6. Exact error message in frontend console

**Share screenshot of:**
- Backend console with full startup output
- Frontend app showing the error
- `ipconfig` output
- `backend/.env` file (password hidden)

---

## Prevention for Future

1. **Always verify backend starts successfully** before testing app
2. **Check MongoDB connection** - it's usually the culprit
3. **Test IP connectivity** with curl first
4. **Monitor backend logs** - they show exactly what failed
5. **Use development error messages** - they tell you what's wrong

---

## Emergency Workaround (Testing Only)

If you can't fix the network issues:

**Hardcode backend URL for testing:**
```typescript
// frontend/config/api.ts
const API_URL = 'http://localhost:3000/api'; // For testing

// But you'll need to be on same machine or same network
```

**Then:**
1. Start backend on your computer
2. Use web browser to test: `http://localhost:3000/health`
3. Run frontend web version with `npm run web`

---

## More Information

- MongoDB Connection Troubleshooting: https://docs.mongodb.com/developers/guides/troubleshooting/
- Firebase Admin Setup: https://firebase.google.com/docs/admin/setup
- Axios Error Handling: https://axios-http.com/docs/req_config
