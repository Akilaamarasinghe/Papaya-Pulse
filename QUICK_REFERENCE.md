# Quick Reference Card

## Your Two Main Errors

```
ERROR: Sign in error: [AxiosError: Request failed with status code 500]
ERROR: Error loading user profile: [AxiosError: Request failed with status code 500]
```

---

## 3-Minute Fix

### Step 1: Edit One Line
**File:** `backend/.env`

Find this:
```
MONGODB_URI=mongodb+srv://udanpasindu934_db_user:tEtpCXSbArwumUGA@papayapulsemobile.ebe6bst.mongodb.net/
```

Add `/papaya-pulse` at the end:
```
MONGODB_URI=mongodb+srv://udanpasindu934_db_user:tEtpCXSbArwumUGA@papayapulsemobile.ebe6bst.mongodb.net/papaya-pulse
```

### Step 2: Get Your IP
```bash
ipconfig
# Write down: 192.168.x.x or 10.0.0.x
```

### Step 3: Update Frontend
**File:** `frontend/app.json` lines 47-49

Change:
```json
"extra": {
  "apiUrl": "http://YOUR_IP:3000/api"
}
```

### Step 4: Restart Services
```bash
# Terminal 1
cd backend && npm start

# Wait for: ✅ MongoDB Connected

# Terminal 2
cd frontend && npm start
```

---

## Success Indicators

✅ Backend shows:
```
✅ MongoDB Connected
🚀 Papaya Pulse API Server running on port 3000
```

✅ When signing in, backend logs show:
```
[Auth] Token verified for UID: ...
[POST /users] User created successfully: ...
```

✅ Frontend successfully logs in!

---

## Common Issues & Instant Fixes

| Problem | Check | Fix |
|---------|-------|-----|
| 500 Error | Backend logs | Restart with fixed .env |
| Can't reach backend | `ipconfig` | Update app.json IP |
| MongoDB failed | Backend logs | Check .env has `/papaya-pulse` |
| Port blocked | `netstat -ano \| find ":3000"` | Add firewall exception |

---

## Diagnostic Commands

```bash
# Quick IP check
ipconfig /all

# Backend health
curl http://YOUR_IP:3000/health

# Port checking
netstat -ano | findstr ":3000"

# Fix MongoDB
EDIT backend\.env → Add /papaya-pulse

# Restart
cd backend && npm start
```

---

## File Locations

| What | Where |
|------|-------|
| MongoDB URI | `backend/.env` |
| API URL | `frontend/app.json` (line 48) |
| Backend logs | Console when running `npm start` |
| Firebase config | `backend/config/firebase-service-account.json` ✓ |
| Auth middleware | `backend/middleware/auth.js` ✓ |
| User routes | `backend/routes/userRoutes.js` ✓ |

---

## How to Debug

1. **Check backend console first** - It logs everything
2. **Look for error patterns:**
   - MongoDB error = Fix .env
   - Connection refused = Backend not running
   - Auth error = Firebase token issue
3. **Use these files:**
   - `TROUBLESHOOTING_500_ERRORS.md` - Full guide
   - `HTTP_500_ERROR_DIAGNOSTIC.md` - Error recovery
   - `VERIFY_SETUP.bat` - Auto-check setup

---

## Code Changes Made

### ✅ Backend Logging (Better Debugging)
- Added `[Auth]` logs in auth middleware
- Added `[POST /users]` and `[GET /me]` logs
- Shows exactly what failed and why

### ✅ Frontend Error Handling (Better Messages)
- Shows 500 = "Backend error"
- Shows 404 = "User not found"
- Shows full error details in console

### ✅ New Tools
- `VERIFY_SETUP.bat` - Auto IP detection
- `backend/start-backend.bat` - Pre-flight checks

---

## Testing Without Fix (Verify Setup)

```bash
# Run this to check everything
VERIFY_SETUP.bat

# Expected output:
# - Your IP address
# - Correct API URL
# - Backend accessibility status
```

---

## One More Thing: SafeAreaView ⚠️

The warning:
```
WARN SafeAreaView has been deprecated...
```

**Fix:** `npm install react-native-safe-area-context`
(Your code already imports correctly ✓)

---

## Emergency Commands (If Stuck)

```bash
# Kill any running Node processes
taskkill /F /IM node.exe

# Reinstall dependencies
cd backend && del node_modules package-lock.json && npm install

# Clear DNS cache (Windows)
ipconfig /flushdns

# Start fresh
cd backend && npm start
```

---

## Done? Next Steps

1. ✅ Fix .env MongoDB URI
2. ✅ Update app.json IP
3. ✅ Restart backend
4. ✅ Watch for "MongoDB Connected"
5. ✅ Restart frontend
6. ✅ Test sign in
7. ✅ Check backend logs for success

---

## Still Stuck?

Check in this order:
1. **Backend running?** → `netstat -ano | findstr ":3000"`
2. **MongoDB connected?** → Look at backend console
3. **IP correct?** → `ipconfig` vs `app.json`
4. **Firewall open?** → Windows Defender allows 3000?
5. **Full error?** → Read backend console completely

Share the backend console output (full startup) for more help!

---

**Last Updated:** January 4, 2026
**Fixes Applied:** Enhanced logging, error handling improvements, diagnostic tools
