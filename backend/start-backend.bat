@echo off
REM Papaya Pulse - Backend Startup and Diagnostics Script

echo.
echo ========================================
echo  Papaya Pulse Backend Diagnostics
echo ========================================
echo.

REM Check if we're in the backend directory
if not exist "package.json" (
    echo Error: Please run this script from the backend directory
    echo Usage: cd backend && .\start-backend.bat
    pause
    exit /b 1
)

echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo Error: Node.js is not installed or not in PATH
    echo Download from: https://nodejs.org/
    pause
    exit /b 1
)
node --version
echo.

echo [2/5] Checking .env file...
if not exist ".env" (
    echo Warning: .env file not found!
    echo Creating from template...
    if exist ".env.example" (
        copy .env.example .env >nul
        echo Created .env file - please update MONGODB_URI
    ) else (
        echo Error: .env.example not found
    )
)
echo .env exists ✓
echo.

echo [3/5] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo Error: npm install failed
        pause
        exit /b 1
    )
)
echo Dependencies OK ✓
echo.

echo [4/5] MongoDB Connection URI Check...
for /f "tokens=*" %%a in ('findstr "MONGODB_URI" .env') do (
    echo Found: %%a
)
echo.

echo [5/5] Starting Backend Server...
echo.
echo ========================================
echo  Press Ctrl+C to stop the server
echo ========================================
echo.

node server.js

pause
