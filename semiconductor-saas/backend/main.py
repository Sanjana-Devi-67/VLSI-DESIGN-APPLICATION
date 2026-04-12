import os
import sys

# Fix import paths
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import io
import json
import logging
from datetime import datetime
from contextlib import asynccontextmanager

import pandas as pd
import numpy as np
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import get_db, init_db, engine
from models import SensorUpload, Prediction, Base
from schemas import (
    UploadResponse,
    PredictionRequest,
    ManualPredictionRequest,
    PredictionResponse,
    PredictionResult,
    PredictionListResponse,
    HealthResponse,
)
from preprocessing.pipeline import PreprocessingPipeline
from ml_service.inference import predictor

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    handlers=[logging.StreamHandler()],
)
logger = logging.getLogger("semiconductor-backend")

pipeline = PreprocessingPipeline(n_pca_components=10)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events."""
    logger.info("🚀 Starting Semiconductor Defect Detection Backend...")

    Base.metadata.create_all(bind=engine)
    logger.info("✅ Database tables ready")

    model_path = os.getenv(
    "MODEL_PATH",
    os.path.join(
        os.path.dirname(os.path.dirname(__file__)),
        "ml_service",
        "lightgbm_model.pkl"
    )
)
    try:
        predictor.load_model(model_path)
        logger.info("✅ LightGBM model loaded")
    except Exception as e:
        logger.warning(f"⚠️  Model not loaded: {e}. Predictions will fail until model is available.")

    yield
    logger.info("Shutting down...")


app = FastAPI(
    title="Semiconductor Defect Detection API",
    description="AI-powered wafer defect prediction from manufacturing sensor data",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = datetime.utcnow()
    logger.info(f"➡️  {request.method} {request.url.path}")
    response = await call_next(request)
    duration = (datetime.utcnow() - start).total_seconds()
    logger.info(f"⬅️  {request.method} {request.url.path} → {response.status_code} ({duration:.3f}s)")
    return response



@app.get("/health", response_model=HealthResponse, tags=["Monitoring"])
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint."""
    db_status = "connected"
    try:
        db.execute("SELECT 1")
    except Exception:
        db_status = "disconnected"

    return HealthResponse(
        status="healthy",
        service="semiconductor-defect-detection",
        version="1.0.0",
        database=db_status,
        model_loaded=predictor.is_loaded,
    )


@app.post("/upload", response_model=UploadResponse, tags=["Data"])
async def upload_sensor_data(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload CSV sensor data for defect analysis."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty.")

        raw_summary = {
            "columns": df.columns.tolist(),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "sample_rows": json.loads(df.head(5).to_json(orient="records")),
            "stats": json.loads(df.describe().to_json()),
        }

        upload = SensorUpload(
            filename=file.filename,
            num_rows=len(df),
            num_features=len(df.columns),
            raw_data=raw_summary,
        )
        db.add(upload)
        db.commit()
        db.refresh(upload)

        logger.info(f"Uploaded: {file.filename} ({len(df)} rows, {len(df.columns)} features)")

        return UploadResponse(
            id=upload.id,
            filename=upload.filename,
            num_rows=upload.num_rows,
            num_features=upload.num_features,
            upload_time=upload.upload_time,
            message=f"Successfully uploaded {file.filename}",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


@app.post("/predict", response_model=PredictionResponse, tags=["Prediction"])
async def predict_defect(request: PredictionRequest, db: Session = Depends(get_db)):
    """Run LightGBM defect prediction on uploaded sensor data."""
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="ML model is not loaded.")

    upload = db.query(SensorUpload).filter(SensorUpload.id == request.upload_id).first()
    if not upload:
        raise HTTPException(status_code=404, detail=f"Upload ID {request.upload_id} not found.")

    try:
        raw = upload.raw_data
        if "sample_rows" in raw:
            df = pd.DataFrame(raw["sample_rows"])
        else:
            raise HTTPException(status_code=400, detail="No data available for prediction.")

        processed = pipeline.process(df)

        result = predictor.predict(processed)

        sensor_summary = pipeline.get_feature_summary(df)

        prediction = Prediction(
            upload_id=upload.id,
            defect_probability=result["defect_probability"],
            prediction_label=result["prediction_label"],
            sensor_summary=sensor_summary,
            feature_importances=result["feature_importances"],
            num_samples=result["num_samples"],
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)

        logger.info(f"Prediction stored: ID={prediction.id}, Label={result['prediction_label']}")

        pred_result = PredictionResult(
            id=prediction.id,
            upload_id=prediction.upload_id,
            timestamp=prediction.timestamp,
            defect_probability=prediction.defect_probability,
            prediction_label=prediction.prediction_label,
            sensor_summary=prediction.sensor_summary,
            feature_importances=prediction.feature_importances,
            num_samples=prediction.num_samples,
        )

        return PredictionResponse(
            prediction=pred_result,
            message="Prediction completed successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/upload_predict", response_model=PredictionResponse, tags=["Prediction"])
async def upload_and_predict(file: UploadFile = File(...), db: Session = Depends(get_db)):
    """Upload CSV sensor data and immediately run defect prediction on it."""
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are accepted.")
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="ML model is not loaded.")

    try:
        contents = await file.read()
        df = pd.read_csv(io.BytesIO(contents))

        if df.empty:
            raise HTTPException(status_code=400, detail="CSV file is empty.")

        raw_summary = {
            "columns": df.columns.tolist(),
            "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
            "sample_rows": json.loads(df.head(5).to_json(orient="records")),
            "stats": json.loads(df.describe().to_json()),
        }

        upload = SensorUpload(
            filename=file.filename,
            num_rows=len(df),
            num_features=len(df.columns),
            raw_data=raw_summary,
        )
        db.add(upload)
        db.commit()
        db.refresh(upload)

        logger.info(f"Uploaded and started prediction: {file.filename} ({len(df)} rows, {len(df.columns)} features)")

        # Run Prediction
        processed = pipeline.process(df)
        result = predictor.predict(processed)
        sensor_summary = pipeline.get_feature_summary(df)

        prediction = Prediction(
            upload_id=upload.id,
            defect_probability=result["defect_probability"],
            prediction_label=result["prediction_label"],
            sensor_summary=sensor_summary,
            feature_importances=result["feature_importances"],
            num_samples=result["num_samples"],
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)

        logger.info(f"Prediction stored: ID={prediction.id}, Label={result['prediction_label']}")

        pred_result = PredictionResult(
            id=prediction.id,
            upload_id=prediction.upload_id,
            timestamp=prediction.timestamp,
            defect_probability=prediction.defect_probability,
            prediction_label=prediction.prediction_label,
            sensor_summary=prediction.sensor_summary,
            feature_importances=prediction.feature_importances,
            num_samples=prediction.num_samples,
        )

        return PredictionResponse(
            prediction=pred_result,
            message="Prediction completed successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload and Predict failed: {e}")
        raise HTTPException(status_code=500, detail=f"Upload and Predict failed: {str(e)}")

@app.get("/features", tags=["Prediction"])
async def get_required_features():
    """Get the list of required features for manual prediction."""
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="ML model is not loaded.")
        
    return {"features": predictor.get_required_features()}

@app.post("/predict_manual", response_model=PredictionResponse, tags=["Prediction"])
async def predict_manual(request: ManualPredictionRequest, db: Session = Depends(get_db)):
    """Run defect prediction on a manually entered row of sensor data."""
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="ML model is not loaded.")

    try:
        
        result = predictor.predict(request.features)
        
        
        prediction = Prediction(
            upload_id=None,  
            defect_probability=result["defect_probability"],
            prediction_label=result["prediction_label"],
            sensor_summary={}, 
            feature_importances=result["feature_importances"],
            num_samples=1,
        )
        db.add(prediction)
        db.commit()
        db.refresh(prediction)

        logger.info(f"Manual prediction stored: ID={prediction.id}, Label={result['prediction_label']}")

        pred_result = PredictionResult(
            id=prediction.id,
            upload_id=0, 
            timestamp=prediction.timestamp,
            defect_probability=prediction.defect_probability,
            prediction_label=prediction.prediction_label,
            sensor_summary=prediction.sensor_summary,
            feature_importances=prediction.feature_importances,
            num_samples=1,
        )

        return PredictionResponse(
            prediction=pred_result,
            message="Manual prediction completed successfully",
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Manual prediction failed: {e}")
        raise HTTPException(status_code=500, detail=f"Manual prediction failed: {str(e)}")


@app.get("/predictions", response_model=PredictionListResponse, tags=["Prediction"])
async def get_predictions(
    skip: int = 0, limit: int = 50, db: Session = Depends(get_db)
):
    """Return historical predictions."""
    total = db.query(Prediction).count()
    predictions = (
        db.query(Prediction)
        .order_by(Prediction.timestamp.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    results = [
        PredictionResult(
            id=p.id,
            upload_id=p.upload_id if p.upload_id is not None else 0,
            timestamp=p.timestamp,
            defect_probability=p.defect_probability,
            prediction_label=p.prediction_label,
            sensor_summary=p.sensor_summary,
            feature_importances=p.feature_importances,
            num_samples=p.num_samples,
        )
        for p in predictions
    ]

    return PredictionListResponse(predictions=results, total=total)


@app.get("/uploads", tags=["Data"])
async def get_uploads(skip: int = 0, limit: int = 50, db: Session = Depends(get_db)):
    """Return all uploaded files."""
    uploads = (
        db.query(SensorUpload)
        .order_by(SensorUpload.upload_time.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )
    return [
        {
            "id": u.id,
            "filename": u.filename,
            "num_rows": u.num_rows,
            "num_features": u.num_features,
            "upload_time": u.upload_time.isoformat() if u.upload_time else None,
        }
        for u in uploads
    ]
