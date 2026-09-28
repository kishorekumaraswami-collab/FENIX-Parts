@echo off
echo ========================================
echo Starting Copart ROI Predictor Frontend
echo ========================================
echo.

cd frontend

echo Installing Node dependencies (this may take a few minutes)...
call npm install
echo.

echo Starting React development server...
echo Frontend will open at: http://localhost:3000
echo.

call npm start

pause
