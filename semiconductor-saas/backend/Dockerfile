FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/
COPY preprocessing/ ./preprocessing/
COPY ml_service/ ./ml_service/
COPY secom_dataset/ ./secom_dataset/

# Generate sample model if not present
RUN python ml_service/train_sample_model.py && \
    mv lightgbm_model.pkl ml_service/lightgbm_model.pkl

EXPOSE 8000

CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
