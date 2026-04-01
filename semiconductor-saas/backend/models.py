"""SQLAlchemy ORM models for the semiconductor defect detection platform."""
from sqlalchemy import Column, Integer, String, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from backend.database import Base


class SensorUpload(Base):
    __tablename__ = "sensor_uploads"

    id = Column(Integer, primary_key=True, index=True)
    upload_time = Column(DateTime(timezone=True), server_default=func.now())
    filename = Column(String(255))
    num_rows = Column(Integer)
    num_features = Column(Integer)
    raw_data = Column(JSON)

    predictions = relationship("Prediction", back_populates="upload", cascade="all, delete-orphan")


class Prediction(Base):
    __tablename__ = "predictions"

    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, ForeignKey("sensor_uploads.id", ondelete="CASCADE"))
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    defect_probability = Column(Float, nullable=False)
    prediction_label = Column(String(50), nullable=False)
    sensor_summary = Column(JSON)
    feature_importances = Column(JSON)
    num_samples = Column(Integer, default=1)

    upload = relationship("SensorUpload", back_populates="predictions")
