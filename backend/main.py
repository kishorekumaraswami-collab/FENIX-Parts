"""
FastAPI Backend for Copart ROI Prediction
"""
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import pandas as pd
import io
import requests
import aiohttp
import os
from dotenv import load_dotenv
from model_service import CopartROIModel

# Load environment variables from .env file
load_dotenv()

# Initialize FastAPI app
app = FastAPI(
    title="Copart ROI Prediction API",
    description="REST API for predicting ROI on salvage vehicle auctions",
    version="2.0"
)

# CORS middleware - allow React frontend to call API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origin: ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model on startup
try:
    model = CopartROIModel("copart_roi_model_v2.pkl")
except Exception as e:
    print(f"[ERROR] Failed to load model: {e}")
    model = None

# VINAudit API Configuration
VINAUDIT_API_KEY = os.getenv("VINAUDIT_API_KEY", "")  # Set via environment variable or .env file
VINAUDIT_API_URL = "https://marketvalue.vinaudit.com/v2/marketvalue"


# Pydantic models for request/response validation
class VehicleInput(BaseModel):
    """Single vehicle input schema"""
    make: str = Field(..., example="TOYOTA")
    model: str = Field(..., example="CAMRY")
    year: int = Field(..., ge=2000, le=2026, example=2020)
    mileage: float = Field(..., ge=0, example=45000)
    sold_price: float = Field(..., gt=0, example=8500)
    make_model_year_price_median: float = Field(..., gt=0, example=18000)
    primary_damage: str = Field(..., example="MINOR DENT/SCRATCHES")
    primary_damage_severity: float = Field(..., ge=0, le=5, example=2.0)
    secondary_damage_severity: Optional[float] = Field(0.0, ge=0, le=5)
    engine_volume: Optional[float] = Field(2.5, ge=0)
    cylinders: Optional[float] = Field(4.0, ge=1, le=16)
    fuel_type: Optional[str] = Field("GAS", example="GAS")
    transmission: Optional[str] = Field("AUTOMATIC", example="AUTOMATIC")
    drive_type: Optional[str] = Field("FWD", example="FWD")
    seller_type: Optional[str] = Field("Insurance", example="Insurance")
    secondary_damage: Optional[str] = Field("NONE", example="NONE")


class PredictionResponse(BaseModel):
    """Prediction response schema"""
    success: bool
    predicted_roi: Optional[float]
    actual_roi: Optional[float]
    mae: Optional[float]
    confidence_range: Optional[dict]
    interpretation: Optional[str]
    recommendation: Optional[str]
    risk_level: Optional[str]
    error: Optional[str] = None


# API Endpoints

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "Copart ROI Prediction API",
        "version": "2.0",
        "status": "running",
        "model_loaded": model is not None
    }


@app.get("/health")
async def health_check():
    """Detailed health check"""
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")

    return {
        "status": "healthy",
        "model": "loaded",
        "version": model.model_package.get('version', '1.0')
    }


@app.post("/predict", response_model=PredictionResponse)
async def predict_roi(vehicle: VehicleInput):
    """
    Predict ROI for a single vehicle

    Args:
        vehicle: Vehicle specifications

    Returns:
        Prediction results with ROI, confidence range, and recommendation
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")

    try:
        # Convert Pydantic model to dict
        vehicle_data = vehicle.dict()

        # Make prediction
        result = model.predict_single(vehicle_data)

        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    """
    Predict ROI for multiple vehicles from CSV

    Args:
        file: CSV file with vehicle data

    Returns:
        CSV with predictions added
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")

    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")

    try:
        # Read CSV
        contents = await file.read()
        df = pd.read_csv(io.StringIO(contents.decode('utf-8')))

        print(f"[INFO] Received CSV with {len(df)} records")

        # Make batch predictions
        results_df = model.predict_batch(df)

        print(f"[OK] Completed {len(results_df)} predictions")

        # Convert to JSON
        results_json = results_df.to_dict(orient='records')

        return {
            "success": True,
            "total_records": len(results_df),
            "predictions": results_json
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Batch prediction failed: {str(e)}")


@app.get("/model/info")
async def get_model_info():
    """
    Get model metadata and performance metrics

    Returns:
        Model information including version, training date, and metrics
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")

    return model.get_model_info()


@app.get("/model/features")
async def get_feature_importance(top_n: int = 15):
    """
    Get top N most important features

    Args:
        top_n: Number of top features to return (default: 15)

    Returns:
        List of features with importance scores
    """
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")

    if top_n < 1 or top_n > 50:
        raise HTTPException(status_code=400, detail="top_n must be between 1 and 50")

    return {
        "top_n": top_n,
        "features": model.get_feature_importance(top_n)
    }


@app.get("/model/metrics")
async def get_metrics():
    """Get model performance metrics"""
    if not model:
        raise HTTPException(status_code=503, detail="Model not loaded")

    info = model.get_model_info()
    return info['metrics']


# Example request for documentation
@app.get("/example")
async def get_example_request():
    """Get example request payload for single prediction"""
    return {
        "example_request": {
            "make": "TOYOTA",
            "model": "CAMRY",
            "year": 2020,
            "mileage": 45000,
            "sold_price": 8500,
            "make_model_year_price_median": 18000,
            "primary_damage": "MINOR DENT/SCRATCHES",
            "primary_damage_severity": 2.0,
            "secondary_damage_severity": 0.0,
            "engine_volume": 2.5,
            "cylinders": 4.0,
            "fuel_type": "GAS",
            "transmission": "AUTOMATIC",
            "drive_type": "FWD",
            "seller_type": "Insurance",
            "secondary_damage": "NONE"
        },
        "expected_response": {
            "success": True,
            "predicted_roi": 116.37,
            "actual_roi": 111.76,
            "mae": 2.31,
            "confidence_range": {
                "min": 114.06,
                "max": 118.68
            },
            "interpretation": "HIGH ROI - Strong investment opportunity",
            "recommendation": "BID AGGRESSIVELY",
            "risk_level": "LOW"
        }
    }


# VIN Decoder Helper Functions
def normalize_fuel_type(value: str) -> str:
    """Normalize NHTSA fuel type to match training data"""
    if not value:
        return "GAS"

    value_upper = value.upper()
    mapping = {
        "GASOLINE": "GAS",
        "DIESEL": "DIESEL",
        "FLEX": "FLEX",
        "FLEX FUEL": "FLEX",
        "ELECTRIC": "ELECTRIC",
        "HYBRID": "HYBRID",
        "PLUG-IN HYBRID": "HYBRID",
    }

    for key, val in mapping.items():
        if key in value_upper:
            return val

    return "GAS"


def normalize_transmission(value: str) -> str:
    """Normalize NHTSA transmission to match training data"""
    if not value:
        return "AUTOMATIC"

    if "MANUAL" in value.upper():
        return "MANUAL"

    return "AUTOMATIC"


def normalize_drive_type(value: str) -> str:
    """Normalize NHTSA drive type to match training data"""
    if not value:
        return "FWD"

    value_upper = value.upper()

    if "FRONT" in value_upper or "FWD" in value_upper:
        return "FWD"
    elif "REAR" in value_upper or "RWD" in value_upper:
        return "RWD"
    elif "ALL" in value_upper or "AWD" in value_upper:
        return "AWD"
    elif "FOUR" in value_upper or "4WD" in value_upper or "4X4" in value_upper:
        return "4WD"

    return "FWD"


class VINDecodeResponse(BaseModel):
    """VIN decode response schema"""
    success: bool
    make: Optional[str]
    model: Optional[str]
    year: Optional[int]
    engine_volume: Optional[float]
    cylinders: Optional[int]
    fuel_type: Optional[str]
    transmission: Optional[str]
    drive_type: Optional[str]
    trim: Optional[str]
    error: Optional[str] = None


@app.get("/decode-vin", response_model=VINDecodeResponse)
async def decode_vin(vin: str):
    """
    Decode VIN using NHTSA API (free, no key required)

    Args:
        vin: 17-character Vehicle Identification Number

    Returns:
        Vehicle specifications decoded from VIN
    """
    # Validate VIN length
    vin = vin.strip().upper()
    if len(vin) != 17:
        raise HTTPException(status_code=400, detail="VIN must be 17 characters")

    try:
        # Call NHTSA VIN Decoder API
        url = f"https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json"
        response = requests.get(url, timeout=10)
        response.raise_for_status()

        data = response.json()

        # Parse results into a dictionary
        results = {}
        for item in data.get('Results', []):
            variable = item.get('Variable')
            value = item.get('Value')
            if value and value not in ['Not Applicable', '', 'null']:
                results[variable] = value

        # Check for decode errors - simplify error messages
        error_code = results.get('Error Code', '0')
        if error_code not in ['0', '']:
            # Simplify error messages
            error_text = results.get('Error Text', '')

            if 'Check Digit' in error_text or 'calculate' in error_text:
                simple_error = "Invalid VIN format"
            elif 'not registered' in error_text or 'NHTSA' in error_text:
                simple_error = "VIN not found in database"
            elif 'Invalid Characters' in error_text:
                simple_error = "Invalid VIN characters"
            else:
                simple_error = "Unable to decode VIN"

            return {
                "success": False,
                "error": simple_error,
                "make": None,
                "model": None,
                "year": None,
                "engine_volume": None,
                "cylinders": None,
                "fuel_type": None,
                "transmission": None,
                "drive_type": None,
                "trim": None
            }

        # Extract and normalize fields
        make = results.get('Make', '').upper()
        model = results.get('Model', '').upper()
        year = results.get('Model Year')
        engine_volume = results.get('Displacement (L)')
        cylinders = results.get('Engine Number of Cylinders')
        fuel_type = normalize_fuel_type(results.get('Fuel Type - Primary', ''))
        transmission = normalize_transmission(results.get('Transmission Style', ''))
        drive_type = normalize_drive_type(results.get('Drive Type', ''))
        trim = results.get('Trim', '')

        # Convert types
        try:
            year = int(year) if year else None
        except:
            year = None

        try:
            engine_volume = float(engine_volume) if engine_volume else None
        except:
            engine_volume = None

        try:
            cylinders = int(float(cylinders)) if cylinders else None
        except:
            cylinders = None

        return {
            "success": True,
            "make": make if make else None,
            "model": model if model else None,
            "year": year,
            "engine_volume": engine_volume,
            "cylinders": cylinders,
            "fuel_type": fuel_type,
            "transmission": transmission,
            "drive_type": drive_type,
            "trim": trim if trim else None,
            "error": None
        }

    except requests.Timeout:
        raise HTTPException(status_code=504, detail="NHTSA API timeout - please try again")
    except requests.RequestException as e:
        raise HTTPException(status_code=503, detail=f"Failed to connect to NHTSA API: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VIN decode failed: {str(e)}")


class MarketValueResponse(BaseModel):
    """Market value response schema"""
    success: bool
    market_value: Optional[float]
    source: str
    confidence: Optional[str]
    price_range: Optional[dict]
    data_period: Optional[List[str]]
    comparable_count: Optional[int]
    error: Optional[str] = None


@app.get("/market-value", response_model=MarketValueResponse)
async def get_market_value(
    vin: Optional[str] = None,
    mileage: Optional[int] = None,
    condition: Optional[str] = None
):
    """
    Get real-time market value from VINAudit API

    Args:
        vin: 17-character Vehicle Identification Number (required)
        mileage: Vehicle mileage for value adjustment (optional)
        condition: Vehicle condition - excellent, good, fair, poor (optional)

    Returns:
        Market value data from VINAudit

    Note:
        Requires VINAUDIT_API_KEY environment variable to be set
    """

    # Check if API key is configured
    if not VINAUDIT_API_KEY:
        raise HTTPException(
            status_code=503,
            detail="Market value service not configured. Please contact administrator."
        )

    # Validate VIN
    if not vin:
        raise HTTPException(status_code=400, detail="VIN parameter is required")

    vin = vin.strip().upper()
    if len(vin) != 17:
        raise HTTPException(status_code=400, detail="VIN must be 17 characters")

    # Build query parameters
    params = {
        "key": VINAUDIT_API_KEY,
        "vin": vin,
        "format": "json"
    }

    if mileage is not None:
        params["mileage"] = mileage

    if condition:
        if condition.lower() not in ['excellent', 'good', 'fair', 'poor']:
            raise HTTPException(
                status_code=400,
                detail="Condition must be one of: excellent, good, fair, poor"
            )
        params["condition"] = condition.lower()

    try:
        # Call VINAudit API using aiohttp
        async with aiohttp.ClientSession() as session:
            async with session.get(
                VINAUDIT_API_URL,
                params=params,
                timeout=aiohttp.ClientTimeout(total=15)
            ) as response:

                if response.status != 200:
                    error_text = await response.text()
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"Market value service error: {error_text}"
                    )

                data = await response.json()

                # Check if API call was successful
                if not data.get("success", False):
                    error_msg = data.get("error", "Unknown error")

                    # Handle specific error cases
                    if error_msg == "missing_key":
                        raise HTTPException(
                            status_code=401,
                            detail="Market value service authentication failed"
                        )
                    elif "not found" in error_msg.lower():
                        raise HTTPException(
                            status_code=404,
                            detail="Vehicle not found in market database"
                        )
                    else:
                        raise HTTPException(
                            status_code=400,
                            detail=f"Market value service error: {error_msg}"
                        )

                # Extract market value data
                prices = data.get("prices", {})
                market_value = prices.get("average")

                if market_value is None:
                    raise HTTPException(
                        status_code=404,
                        detail="Market value not available for this vehicle"
                    )

                return {
                    "success": True,
                    "market_value": round(market_value, 2),
                    "source": "Live Market Data (Updated Daily)",
                    "confidence": f"{data.get('certainty', 0)}%",
                    "price_range": {
                        "low": round(prices.get("below", 0), 2),
                        "average": round(market_value, 2),
                        "high": round(prices.get("above", 0), 2)
                    },
                    "data_period": data.get("period", []),
                    "comparable_count": data.get("count", 0),
                    "error": None
                }

    except aiohttp.ClientTimeout:
        raise HTTPException(
            status_code=504,
            detail="Market value service timeout - please try again"
        )
    except aiohttp.ClientError as e:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to connect to market value service: {str(e)}"
        )
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Market value lookup failed: {str(e)}"
        )


# Run server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
