@echo off
echo ========================================
echo Starting Copart ROI Predictor Backend
echo ========================================
echo.

cd backend

echo Installing Python dependencies...
pip install -r requirements.txt
echo.

echo Starting FastAPI server...
echo Backend will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.

python main.py

pause
