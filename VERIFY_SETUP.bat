@echo off
REM Quick Environment Verification Script

echo.
echo ========================================
echo  Papaya Pulse Environment Verification
echo ========================================
echo.

setlocal enabledelayedexpansion

REM Check current IP address
echo [INFO] Getting your machine's IP address...
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /R "IPv4"') do (
    set "ip=%%a"
    set "ip=!ip: =!"
)

if defined ip (
    echo Found IP Address: !ip!
) else (
    echo Could not detect IP address
    set "ip=localhost"
)

echo.
echo ========================================
echo  Configuration Summary
echo ========================================
echo.

echo Frontend API URL should be:
echo http://!ip!:3000/api
echo.

echo [ACTION] Update frontend/app.json with:
echo "extra": {
echo   "apiUrl": "http://!ip!:3000/api"
echo }
echo.

echo ========================================
echo  Testing Network Connectivity
echo ========================================
echo.

REM Test if port 3000 is listening
echo [TEST] Checking if backend port 3000 is accessible...
netstat -an | find "3000" >nul
if errorlevel 1 (
    echo Port 3000: NOT LISTENING (backend may not be running)
) else (
    echo Port 3000: LISTENING ✓
)

echo.
echo [TEST] Testing network to backend...
timeout /t 2 /nobreak

REM Test connectivity
echo Attempting connection to http://!ip!:3000/health
powershell -Command "try { $r = Invoke-WebRequest 'http://!ip!:3000/health' -TimeoutSec 5; Write-Host 'Connection: OK' -ForegroundColor Green; Write-Host $r.Content } catch { Write-Host 'Connection: FAILED' -ForegroundColor Red; Write-Host $_.Exception.Message }"

echo.
echo ========================================
echo  Next Steps
echo ========================================
echo.
echo 1. Backend:
echo    cd backend
echo    npm install
echo    npm start
echo.
echo 2. Frontend (in new terminal):
echo    cd frontend
echo    npm install
echo    npm start
echo.
echo 3. Monitor backend logs for:
echo    - "✅ MongoDB Connected"
echo    - "[Auth] Token verified"
echo    - "[GET /me] User profile retrieved successfully"
echo.

pause
