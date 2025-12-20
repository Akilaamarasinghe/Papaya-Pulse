# Network Configuration Guide

## Problem
The app times out when trying to login from different WiFi networks or mobile hotspots.

## Solution
The frontend now automatically detects the correct IP address when using Expo. Follow these steps:

## Setup Instructions

### 1. Start Backend Server
The backend now listens on `0.0.0.0` which accepts connections from all network interfaces.

```bash
cd backend
npm start
```

You'll see output like:
```
🚀 Papaya Pulse API Server running on port 3000
📱 Mobile access: Find your IP with 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
   Then use: http://YOUR_IP:3000
```

### 2. Find Your Computer's IP Address

**Windows:**
```bash
ipconfig
```
Look for "IPv4 Address" under your active network adapter (usually WiFi or Ethernet).
Example: `192.168.1.100`

**Mac/Linux:**
```bash
ifconfig
```
Look for `inet` under your active network adapter.
Example: `inet 192.168.1.100`

### 3. Start Frontend (Automatic Detection)

The frontend will now **automatically detect** the correct IP address from Expo's development server:

```bash
cd frontend
npm start
```

Then scan the QR code with Expo Go app. The app will automatically use the correct IP!

### 4. Manual Configuration (Optional)

If automatic detection doesn't work, you can manually set the API URL in `app.json`:

```json
{
  "expo": {
    "extra": {
      "apiUrl": "http://192.168.1.100:3000/api"
    }
  }
}
```

Replace `192.168.1.100` with your computer's actual IP address.

## Testing Connection

### Test Backend is Accessible
From your mobile device's browser, visit:
```
http://YOUR_IP:3000/health
```

You should see:
```json
{"status":"OK","timestamp":"2025-12-20T..."}
```

If this doesn't work:
1. Check Windows Firewall settings
2. Ensure backend is running
3. Verify you're on the same network

### Test Login
Try logging in from the app. The timeout has been increased to 60 seconds for better reliability on slow networks.

## Troubleshooting

### "Network Error" or "Timeout"

**Check 1: Same Network**
- Your phone and computer must be on the SAME WiFi network
- Don't use mobile data on your phone

**Check 2: Firewall**
Windows Firewall might block incoming connections. Add exception:
1. Open Windows Firewall
2. Allow Node.js through firewall
3. Or temporarily disable firewall for testing

**Check 3: Backend Running**
Make sure backend server is running and listening on `0.0.0.0`

**Check 4: Correct IP**
Your IP address changes when you switch networks. Get the new IP:
```bash
ipconfig
```

### Check Current API URL
The app logs the API URL in the console when it starts. Look for:
```
📡 API Base URL: http://192.168.1.100:3000/api
```

### Using Different Networks

When you switch to a different WiFi or hotspot:

1. **Find new IP address**: Run `ipconfig` again
2. **Restart Expo**: The app will auto-detect the new IP
3. **Or update app.json**: Set the new IP manually if needed

## Important Notes

1. **Backend must listen on 0.0.0.0** ✅ (Already configured)
2. **Frontend timeout increased to 60s** ✅ (Already configured)
3. **Auto-detection enabled** ✅ (Already configured)
4. **CORS allows all origins in development** ✅ (Check your .env)

## Quick Start Checklist

- [ ] Backend running on `0.0.0.0:3000`
- [ ] Got your computer's IP address
- [ ] Phone and computer on same WiFi
- [ ] Windows Firewall allows Node.js
- [ ] Expo Go installed on phone
- [ ] Scan QR code to load app
- [ ] Try logging in

## Still Having Issues?

1. Check backend logs for errors
2. Check Expo console for API URL being used
3. Test backend health endpoint from phone browser
4. Ensure no VPN is active on either device
5. Try connecting to backend from another device to verify it's accessible
