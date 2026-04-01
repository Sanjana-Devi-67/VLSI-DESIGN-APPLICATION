"""Pydantic schemas for request/response validation."""
from pydantic import BaseModel, ConfigDict, Field
from typing import List, Optional, Any, Dict
from datetime import datetime


# --- Upload Schemas ---
class UploadResponse(BaseModel):
    id: int
    filename: str
    num_rows: int
    num_features: int
    upload_time: datetime
    message: str

    class Config:
        from_attributes = True


# --- Prediction Schemas ---
class PredictionRequest(BaseModel):
    upload_id: int


class ManualPredictionRequest(BaseModel):
    """Payload for manual defect prediction."""
    features: Dict[str, float] = Field(
        ...,
        description="Dictionary of the top 5 sensor values required for prediction"
    )


class PredictionResult(BaseModel):
    id: int
    upload_id: int
    timestamp: datetime
    defect_probability: float
    prediction_label: str
    sensor_summary: Optional[Dict[str, Any]] = None
    feature_importances: Optional[Dict[str, float]] = None
    num_samples: int = 1

    class Config:
        from_attributes = True


class PredictionResponse(BaseModel):
    prediction: PredictionResult
    message: str


class PredictionListResponse(BaseModel):
    predictions: List[PredictionResult]
    total: int


# --- Health Schemas ---
class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: str
    model_loaded: bool
