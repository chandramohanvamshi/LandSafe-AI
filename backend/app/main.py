from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from pathlib import Path
import joblib
import pandas as pd


# ============================================================
# APP CONFIGURATION
# ============================================================

app = FastAPI(
    title="Rudraprayag Landslide Early Warning System API",
    description="Machine Learning based landslide risk prediction API",
    version="1.0.0"
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============================================================
# MODEL PATH
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = BASE_DIR / "ml" / "models" / "saved_model.pkl"

model = None


# ============================================================
# LOAD RANDOM FOREST MODEL
# ============================================================

if MODEL_PATH.exists():
    try:
        model = joblib.load(MODEL_PATH)
        print("SUCCESS: Random Forest model loaded!")
        print(f"Model path: {MODEL_PATH}")

    except Exception as e:
        print(f"ERROR loading model: {e}")

else:
    print("WARNING: Model file not found!")
    print(f"Expected path: {MODEL_PATH}")


# ============================================================
# REQUEST MODEL
# ============================================================

class RiskPredictionRequest(BaseModel):

    elevation_m: float = Field(
        ...,
        description="Elevation above sea level in meters"
    )

    slope_degrees: float = Field(
        ...,
        description="Slope angle in degrees"
    )

    rainfall_mm_24h: float = Field(
        ...,
        description="Rainfall during last 24 hours in mm"
    )

    rainfall_mm_72h: float = Field(
        ...,
        description="Rainfall during last 72 hours in mm"
    )

    soil_moisture_percent: float = Field(
        ...,
        description="Soil moisture percentage"
    )


# ============================================================
# ROOT ENDPOINT
# ============================================================

@app.get("/")
def read_root():

    return {
        "system": "Rudraprayag Landslide Early Warning System",
        "status": "running",
        "version": "1.0.0",
        "model_loaded": model is not None,
        "model_type": "Random Forest",
        "features": [
            "elevation_m",
            "slope_degrees",
            "rainfall_mm_24h",
            "rainfall_mm_72h",
            "soil_moisture_percent"
        ]
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/health")
def health_check():

    if model is None:

        return {
            "status": "warning",
            "model_loaded": False,
            "message": "API is running but ML model is not loaded"
        }

    return {
        "status": "healthy",
        "model_loaded": True,
        "message": "API and ML model are ready"
    }


# ============================================================
# PREDICT RISK
# ============================================================

@app.post("/predict")
def predict_risk(data: RiskPredictionRequest):

    # --------------------------------------------------------
    # Check model
    # --------------------------------------------------------

    if model is None:

        raise HTTPException(
            status_code=503,
            detail="ML model is not loaded"
        )


    # --------------------------------------------------------
    # Validate input values
    # --------------------------------------------------------

    if data.elevation_m < 0:

        raise HTTPException(
            status_code=400,
            detail="Elevation cannot be negative"
        )


    if data.slope_degrees < 0 or data.slope_degrees > 90:

        raise HTTPException(
            status_code=400,
            detail="Slope must be between 0 and 90 degrees"
        )


    if data.rainfall_mm_24h < 0:

        raise HTTPException(
            status_code=400,
            detail="24-hour rainfall cannot be negative"
        )


    if data.rainfall_mm_72h < 0:

        raise HTTPException(
            status_code=400,
            detail="72-hour rainfall cannot be negative"
        )


    if data.soil_moisture_percent < 0 or data.soil_moisture_percent > 100:

        raise HTTPException(
            status_code=400,
            detail="Soil moisture must be between 0 and 100 percent"
        )


    # --------------------------------------------------------
    # Prepare ML input
    # --------------------------------------------------------

    input_features = pd.DataFrame([
        {
            "elevation_m": data.elevation_m,
            "slope_degrees": data.slope_degrees,
            "rainfall_mm_24h": data.rainfall_mm_24h,
            "rainfall_mm_72h": data.rainfall_mm_72h,
            "soil_moisture_percent": data.soil_moisture_percent
        }
    ])


    # --------------------------------------------------------
    # ML PREDICTION
    # --------------------------------------------------------

    try:

        prediction = int(
            model.predict(input_features)[0]
        )


        # ----------------------------------------------------
        # Probability
        # ----------------------------------------------------

        probabilities = model.predict_proba(
            input_features
        )[0]


        # Find probability corresponding to landslide = 1

        classes = list(model.classes_)

        if 1 in classes:

            landslide_index = classes.index(1)

            risk_probability = (
                probabilities[landslide_index] * 100
            )

        else:

            risk_probability = 0.0


        # Keep value between 0 and 100

        risk_probability = max(
            0.0,
            min(100.0, risk_probability)
        )


        # ----------------------------------------------------
        # Risk level
        # ----------------------------------------------------

        if risk_probability < 35:

            risk_level = "LOW"

        elif risk_probability < 70:

            risk_level = "MEDIUM"

        elif risk_probability < 85:

            risk_level = "HIGH"

        else:

            risk_level = "CRITICAL"


        # ----------------------------------------------------
        # Final response
        # ----------------------------------------------------

        return {

            "success": True,

            "landslide_predicted": prediction,

            "risk_probability_percent": round(
                risk_probability,
                2
            ),

            "risk_level": risk_level,

            "features": {

                "elevation_m": data.elevation_m,

                "slope_degrees": data.slope_degrees,

                "rainfall_mm_24h": data.rainfall_mm_24h,

                "rainfall_mm_72h": data.rainfall_mm_72h,

                "soil_moisture_percent":
                    data.soil_moisture_percent
            }
        }


    except Exception as e:

        print(f"Prediction error: {e}")

        raise HTTPException(
            status_code=500,
            detail=f"Prediction failed: {str(e)}"
        )