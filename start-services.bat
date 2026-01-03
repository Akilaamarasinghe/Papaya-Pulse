
@echo off
echo ========================================
echo Papaya Quality ML Services Launcher
echo ========================================
echo.

echo Starting ML Grading Service (Port 5000)...
start "ML Grading Service" cmd /k "cd papaya-quality-ml-part\ML && python app.py"

timeout /t 2 /nobreak > nul

echo Starting Image Analysis Service (Port 5001)...
start "Image Analysis Service" cmd /k "cd papaya-quality-ml-part\IM && python app.py"

timeout /t 2 /nobreak > nul

echo Starting Backend Server (Port 3000)...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo.
echo ========================================
echo All services are starting...
echo - ML Grading Service: http://localhost:5000
echo - Image Analysis Service: http://localhost:5001
echo - Backend Server: http://localhost:3000
echo ========================================
echo.
echo Press any key to close this window (services will keep running)
pause > nul
