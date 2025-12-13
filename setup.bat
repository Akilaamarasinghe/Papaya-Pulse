@echo off
REM Papaya Pulse - Automated Setup Script for Windows
REM This script helps set up the development environment

echo.
echo 🍈 Papaya Pulse - Setup Script
echo ==============================
echo.

REM Check Node.js
echo Checking Node.js installation...
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
    echo ✅ Node.js is installed: %NODE_VERSION%
) else (
    echo ❌ Node.js is not installed. Please install from https://nodejs.org/
    pause
    exit /b 1
)

REM Check MongoDB
echo Checking MongoDB installation...
where mongod >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo ✅ MongoDB is installed
) else (
    echo ⚠️  MongoDB is not installed. Please install from https://www.mongodb.com/
)

echo.
echo Setting up Frontend...
cd papayapulse
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install frontend dependencies
    pause
    exit /b 1
)
echo ✅ Frontend dependencies installed

echo.
echo Setting up Backend...
cd ..\backend
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Failed to install backend dependencies
    pause
    exit /b 1
)
echo ✅ Backend dependencies installed

REM Create .env if it doesn't exist
if not exist .env (
    copy .env.example .env
    echo ✅ Created .env file from template
    echo ⚠️  Please edit backend\.env with your configuration
) else (
    echo ℹ️  .env file already exists
)

echo.
echo ==============================
echo ✅ Setup Complete!
echo.
echo Next steps:
echo 1. Configure Firebase credentials in papayapulse\config\firebase.ts
echo 2. Place Firebase Admin SDK JSON in backend\config\
echo 3. Edit backend\.env with your settings
echo 4. Start MongoDB: net start MongoDB
echo 5. Start backend: cd backend ^&^& npm run dev
echo 6. Start frontend: cd papayapulse ^&^& npm start
echo.
echo 📚 See SETUP_GUIDE.md for detailed instructions
echo ==============================
echo.
pause
