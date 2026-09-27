from pathlib import Path

import joblib
import pandas as pd

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


# ============================================================
# PATHS
# ============================================================

BASE_DIR = Path(__file__).resolve().parents[2]

MODEL_PATH = (
    BASE_DIR
    / "ml"
    / "models"
    / "flash_flood_model.pkl"
)


# ============================================================
# FASTAPI APP
# ============================================================

app = FastAPI(
    title="LandSafe AI Flash Flood Early Warning API",
    description="ML service for flash-flood risk estimation.",
    version="2.0.0",
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
# LOAD MODEL
# ============================================================

model_bundle = None

if MODEL_PATH.exists():

    try:

        model_bundle = joblib.load(MODEL_PATH)

        print(
            f"SUCCESS: Flash-flood model loaded from {MODEL_PATH}"
        )

    except Exception as exc:

        print(
            f"ERROR loading flash-flood model: {exc}"
        )

else:

    print(
        f"WARNING: Model not found: {MODEL_PATH}"
    )


# ============================================================
# REQUEST MODEL
# ============================================================

class FloodPredictionRequest(BaseModel):

    rainfall_mm_24h: float = Field(..., ge=0)

    river_discharge_m3_s: float = Field(..., ge=0)

    water_level_m: float = Field(..., ge=0)

    elevation_m: float = Field(..., ge=0)

    historical_floods: int = Field(..., ge=0)


# ============================================================
# RISK LEVEL
# ============================================================

def risk_level(probability: float) -> str:

    if probability < 35:
        return "LOW"

    if probability < 60:
        return "MEDIUM"

    if probability < 80:
        return "HIGH"

    return "CRITICAL"


# ============================================================
# ROOT
# ============================================================

@app.get("/")
def root():

    return {

        "system":
            "LandSafe AI Flash Flood Early Warning System",

        "status":
            "running",

        "model_loaded":
            model_bundle is not None,

        "model_type":
            "Random Forest",

        "features": [

            "rainfall_mm_24h",

            "river_discharge_m3_s",

            "water_level_m",

            "elevation_m",

            "historical_floods",

        ],

        "dataset_note":
            "Prototype model trained on an India-wide "
            "synthetic flood-risk dataset."

    }


# ============================================================
# HEALTH
# ============================================================

@app.get("/health")
def health():

    return {

        "status":
            "healthy"
            if model_bundle is not None
            else "warning",

        "model_loaded":
            model_bundle is not None,

    }


# ============================================================
# PREDICT
# ============================================================

@app.post("/predict")
def predict(data: FloodPredictionRequest):

    if model_bundle is None:

        raise HTTPException(

            status_code=503,

            detail=
                "Flash-flood ML model is not loaded.",

        )


    model = model_bundle["model"]

    features = model_bundle["features"]


    # Create input row using the SAME column names
    # used during model training.

    row = pd.DataFrame([{

        "Rainfall (mm)":
            data.rainfall_mm_24h,

        "River Discharge (m³/s)":
            data.river_discharge_m3_s,

        "Water Level (m)":
            data.water_level_m,

        "Elevation (m)":
            data.elevation_m,

        "Historical Floods":
            data.historical_floods,

    }])[features]


    try:

        probability = float(

            model.predict_proba(row)[0][1]

            * 100

        )

        prediction = int(

            model.predict(row)[0]

        )

    except Exception as exc:

        raise HTTPException(

            status_code=500,

            detail=f"Prediction failed: {exc}",

        )


    probability = max(

        0.0,

        min(100.0, probability)

    )


    return {

        "success":
            True,

        "flood_predicted":
            prediction,

        "risk_probability_percent":
            round(probability, 2),

        "risk_level":
            risk_level(probability),

        "features": {

            "rainfall_mm_24h":
                data.rainfall_mm_24h,

            "river_discharge_m3_s":
                data.river_discharge_m3_s,

            "water_level_m":
                data.water_level_m,

            "elevation_m":
                data.elevation_m,

            "historical_floods":
                data.historical_floods,

        },

    }