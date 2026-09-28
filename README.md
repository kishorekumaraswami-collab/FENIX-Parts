#  FENIX Parts - Salvage Vehicle ROI Predictor

**AI-Powered Bid Screening System for Salvage Vehicle Auctions**

[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![React 18](https://img.shields.io/badge/react-18-blue.svg)](https://reactjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104+-green.svg)](https://fastapi.tiangolo.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

##  Overview

FENIX Parts Salvage Vehicle ROI Predictor is an intelligent system that analyzes salvage vehicles and predicts Return on Investment (ROI) to help make informed bidding decisions. Built with XGBoost machine learning model, it processes vehicle specifications, damage assessment, and market data to provide accurate ROI predictions with confidence intervals.

###  Key Features

- **Single Vehicle Analysis**: Predict ROI for individual vehicles with detailed insights
- **Batch Processing**: Upload CSV files to analyze multiple vehicles simultaneously
- **VIN Decoder Integration**: Auto-fill vehicle specifications using NHTSA VIN decoder
- **Smart Decision Engine**: Categorizes vehicles into Strong Buy, Consider, or Skip
- **Interactive UI**: Modern React interface with filtering, sorting, and detailed views
- **Real-time Market Data**: Optional integration with VINAudit for current market values
- **Export Capabilities**: Download analysis results as CSV for further processing

---

##  Architecture

```
┌─────────────────┐      ┌──────────────────┐      ┌─────────────────┐
│   React         │─────▶│   FastAPI        │─────▶│   XGBoost       │
│   Frontend      │      │   Backend        │      │   ML Model      │
│   (Port 3000)   │◀─────│   (Port 5000)    │◀─────│                 │
└─────────────────┘      └──────────────────┘      └─────────────────┘
         │                        │
         │                        │
         ▼                        ▼
┌─────────────────┐      ┌──────────────────┐
│   External      │      │   External       │
│   NHTSA API     │      │   VINAudit API   │
│   (VIN Decode)  │      │   (Market Value) │
└─────────────────┘      └──────────────────┘
```

---

##  Quick Start

### Prerequisites

- **Python 3.8+**
- **Node.js 16+**
- **npm or yarn**

### Installation

#### 1. Clone Repository

```bash
git clone https://github.com/kishorekumaraswami-collab/FENIX-Parts.git
cd FENIX-Parts
```

#### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start backend server
python main.py
```

Backend will run on `http://localhost:5000`

#### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

Frontend will run on `http://localhost:3000`

---

##  Usage

### Single Vehicle Prediction

1. Navigate to **Single Prediction** tab
2. Enter VIN (optional) and click **Decode VIN** to auto-fill vehicle specs
3. Fill in required fields:
   - Vehicle details (Make, Model, Year)
   - Pricing (Mileage, Sold Price, Market Value)
   - Damage assessment
   - Technical specifications
4. Click **Predict ROI**
5. View detailed prediction with:
   - Predicted ROI percentage
   - Confidence range
   - Buy/Skip recommendation
   - Risk assessment

### Batch Upload

1. Navigate to **Batch Upload** tab
2. Click **Upload CSV** and select your CSV file
3. System automatically analyzes all vehicles
4. Use filters to view:
   - **Strong Buy**: ROI > 50%
   - **Consider**: ROI 20-50%
   - **Skip**: ROI ≤ 20%
5. Click any row to view detailed insights
6. Download results with **Download CSV**

### CSV Format

```csv
vin,make,model,year,mileage,sold_price,make_model_year_price_median,primary_damage,primary_damage_severity,secondary_damage_severity,engine_volume,cylinders,fuel_type,transmission,drive_type,seller_type,secondary_damage
1HGCM82633A004352,HONDA,CIVIC,2021,28000,8500,19000,MINOR DENT/SCRATCHES,1.0,0.0,1.5,4,GAS,AUTOMATIC,FWD,Insurance,NONE
```

See `test_with_real_vins.csv` for complete example.

---

##  Model Details

### Algorithm: XGBoost Regressor

**Features Used (20+)**:
- Vehicle specifications (make, model, year, mileage)
- Pricing data (sold price, market value)
- Damage assessment (type, severity, location)
- Technical specs (engine, transmission, drive type)
- Seller information

**Performance Metrics**:
- Mean Absolute Error (MAE): ~2.3%
- R² Score: 0.94+
- Confidence Interval: ±2-3% ROI

**Training Data**: 10,000+ salvage vehicle auction records

---

##  Configuration

### Backend Environment Variables

Create `backend/.env`:

```env
# VINAudit API (Optional - for market value feature)
VINAUDIT_API_KEY=your_api_key_here

# Server Configuration
PORT=5000
DEBUG=False
```

### Frontend Environment Variables

Create `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000
```

---

##  Project Structure

```
copart-roi-predictor/
├── backend/
│   ├── main.py                 # FastAPI application
│   ├── model_service.py        # ML model service
│   ├── copart_roi_model.pkl    # Trained XGBoost model
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Environment variables
├── frontend/
│   ├── public/                 # Static assets
│   ├── src/
│   │   ├── components/
│   │   │   ├── SinglePredictor.jsx
│   │   │   ├── BatchPredictor.jsx
│   │   │   ├── ResultsDisplay.jsx
│   │   │   └── AutocompleteInput.jsx
│   │   ├── App.js
│   │   └── index.js
│   ├── package.json
│   └── .env
├── .gitignore
└── README.md
```

---

##  Deployment

### Option 1: Render (Recommended - Free Tier)

**Backend:**
1. Create account at [render.com](https://render.com)
2. New Web Service → Connect GitHub repo
3. Build Command: `cd backend && pip install -r requirements.txt`
4. Start Command: `cd backend && python main.py`
5. Environment: Python 3
6. Add environment variables

**Frontend:**
1. New Static Site → Connect GitHub repo
2. Build Command: `cd frontend && npm install && npm run build`
3. Publish Directory: `frontend/build`
4. Add `REACT_APP_API_URL` pointing to backend URL

### Option 2: Railway (Free $5/month credit)

**Backend & Frontend:**
1. Create account at [railway.app](https://railway.app)
2. New Project → Deploy from GitHub
3. Railway auto-detects Node.js and Python
4. Set environment variables
5. Deploy

### Option 3: Vercel (Frontend) + Render (Backend)

**Frontend on Vercel:**
```bash
cd frontend
npm install -g vercel
vercel
```

**Backend on Render:** (Same as Option 1)

---

##  Security Notes

- Never commit `.env` files
- Keep API keys secure
- Model file (`copart_roi_model.pkl`) is ~50MB - ensure Git LFS if needed
- Validate all user inputs
- Use HTTPS in production

---

##  Troubleshooting

### Backend Issues

**"ModuleNotFoundError: No module named 'xgboost'"**
```bash
pip install -r requirements.txt
```

**"FileNotFoundError: copart_roi_model.pkl"**
- Ensure model file is in `backend/` directory
- Check file permissions

**"Port 5000 already in use"**
```bash
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac:
lsof -ti:5000 | xargs kill -9
```

### Frontend Issues

**"npm ERR! ERESOLVE unable to resolve dependency tree"**
```bash
npm install --legacy-peer-deps
```

**"Failed to fetch" error**
- Check backend is running on port 5000
- Verify `REACT_APP_API_URL` in `.env`
- Check CORS settings in `main.py`

### VIN Decoder Errors

**"503 Server Error: Service Unavailable"**
- NHTSA API is temporarily down
- Enter vehicle data manually
- VIN decoder is optional feature

---

##  Future Enhancements

- [ ] Historical price trend analysis
- [ ] Image-based damage assessment using CV
- [ ] Mobile app (React Native)
- [ ] Multi-language support
- [ ] Advanced filtering (auction location, seller type)
- [ ] Integration with Copart/IAAI APIs
- [ ] PDF report generation
- [ ] User authentication and saved searches

