@echo off
echo ========================================
echo Papaya Pulse Services Launcher
echo ========================================
echo.

echo Starting Price Prediction ML Service (Port 5000)...
start "Price Prediction ML" cmd /k "cd papaya-price-prediction-ml-part && python final.py"

timeout /t 3 /nobreak > nul

echo Starting ML Grading Service (Port 5000)...
REM Note: This conflicts with price prediction, may need different port
REM start "ML Grading Service" cmd /k "cd papaya-quality-ml-part\ML && python app.py"

timeout /t 2 /nobreak > nul

echo Starting Image Analysis Service (Port 5001)...
start "Image Analysis Service" cmd /k "cd papaya-quality-ml-part\IM && python app.py"

timeout /t 2 /nobreak > nul

echo Starting Growth Stage ML Service (Port 5008)...
start "Growth Stage ML" cmd /k "cd papaya-harvest-prediction-ml-part\Image processing && python app.py"

timeout /t 2 /nobreak > nul

echo Starting Harvest Prediction ML Service (Port 5009)...
start "Harvest Prediction ML" cmd /k "cd papaya-harvest-prediction-ml-part && python app.py"

timeout /t 2 /nobreak > nul

echo Starting Backend Server (Port 3000)...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo.
echo ========================================
echo All services are starting...
echo - Price Prediction ML:   http://localhost:5000
echo - Image Analysis:        http://localhost:5001
echo - Growth Stage ML:       http://localhost:5008
echo - Harvest Prediction ML: http://localhost:5009
echo - Backend Server:        http://localhost:3000
echo ========================================
echo.
echo Press any key to close this window (services will keep running)
pause > nul
