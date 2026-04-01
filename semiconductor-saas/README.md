# 🔬 SemiconAI — Semiconductor Defect Detection SaaS

AI-powered wafer defect detection platform that predicts manufacturing defects from sensor data using LightGBM.

![Architecture](https://img.shields.io/badge/Architecture-Microservices-blue)
![Frontend](https://img.shields.io/badge/Frontend-React%20+%20Tailwind-61DAFB)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688)
![ML](https://img.shields.io/badge/ML-LightGBM-green)
![DB](https://img.shields.io/badge/Database-PostgreSQL-336791)
![Docker](https://img.shields.io/badge/Containerized-Docker-2496ED)

---

## Architecture Overview

```
User → React Dashboard → REST API → FastAPI Backend
                                        ↓
                               Preprocessing Pipeline
                               (Missing Values → Feature Engineering → PCA)
                                        ↓
                               LightGBM Model Inference
                                        ↓
                               PostgreSQL (store results)
                                        ↓
                               Response → Dashboard
```

### Services

| Service           | Port   | Description                                  |
|-------------------|--------|----------------------------------------------|
| **Frontend**      | `3000` | React dashboard with Tailwind CSS            |
| **Backend API**   | `8000` | FastAPI with ML inference & preprocessing    |
| **Database**      | `5432` | PostgreSQL for uploads & predictions         |
| **Monitoring**    | `8001` | Health checks, metrics, and logging          |
| **Quantum (WIP)** | `8002` | Placeholder Qiskit optimization service     |

---

## Quick Start

### Prerequisites
- [Docker](https://docs.docker.com/get-docker/) & [Docker Compose](https://docs.docker.com/compose/install/)

### Run

```bash
# Clone and navigate
cd semiconductor-ai-saas

# Start all services
docker-compose up --build

# Or run in detached mode
docker-compose up --build -d
```

The dashboard will be available at **http://localhost:3000**

---

## API Endpoints

| Method | Endpoint        | Description                          |
|--------|-----------------|--------------------------------------|
| POST   | `/upload`       | Upload CSV sensor data               |
| POST   | `/predict`      | Run defect prediction on upload      |
| GET    | `/predictions`  | Retrieve historical predictions      |
| GET    | `/uploads`      | Retrieve uploaded files              |
| GET    | `/health`       | Backend health check                 |

### Sample Usage

```bash
# Health check
curl http://localhost:8000/health

# Upload sensor CSV
curl -X POST http://localhost:8000/upload \
  -F "file=@sample_data.csv"

# Run prediction (use upload_id from response)
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"upload_id": 1}'

# Get predictions
curl http://localhost:8000/predictions
```

---

## Project Structure

```
semiconductor-ai-saas/
├── frontend/                  # React + Tailwind dashboard
│   ├── src/
│   │   ├── pages/             # Dashboard, Upload, Results, History
│   │   ├── services/          # Axios API layer
│   │   ├── App.jsx            # Router + sidebar navigation
│   │   └── index.css          # Tailwind + glassmorphism design
│   ├── nginx.conf             # Production reverse proxy
│   ├── Dockerfile             # Multi-stage build
│   └── package.json
├── backend/                   # FastAPI application
│   ├── main.py                # API endpoints
│   ├── models.py              # SQLAlchemy ORM models
│   ├── schemas.py             # Pydantic validation
│   ├── database.py            # DB engine & sessions
│   ├── Dockerfile
│   └── requirements.txt
├── preprocessing/             # Data preprocessing pipeline
│   └── pipeline.py            # Missing values, features, PCA
├── ml_service/                # ML inference
│   ├── inference.py           # LightGBM predictor
│   └── train_sample_model.py  # Generate demo model
├── database/
│   └── init.sql               # PostgreSQL schema
├── monitoring/
│   ├── monitor.py             # Health + metrics service
│   └── Dockerfile
├── quantum_service/           # Placeholder for Qiskit
│   ├── main.py
│   └── Dockerfile
├── docker-compose.yml         # Full orchestration
├── .env                       # Environment variables
└── README.md
```

---

## Dashboard Pages

1. **Dashboard** — Overview stats, defect probability trend chart, classification pie chart, recent predictions table
2. **Upload Data** — Drag-and-drop CSV upload with workflow progress, inline prediction trigger
3. **Prediction Results** — Expandable cards with feature importance bar charts and sensor summaries
4. **Historical Analytics** — Daily volume charts, probability distribution histogram, trend analysis, upload history

---

## Data Pipeline

1. **Missing Value Handling** — Median imputation, infinity replacement
2. **Feature Engineering** — Statistical features (mean, std, range, skew, kurtosis), interaction features
3. **PCA Transformation** — Dimensionality reduction to 10 principal components
4. **LightGBM Inference** — Binary classification with defect probability output

---

## Sample CSV Format

```csv
sensor_1,sensor_2,sensor_3,sensor_4,sensor_5,sensor_6,sensor_7,sensor_8,sensor_9,sensor_10
0.234,1.456,0.789,-0.123,0.567,0.891,-0.234,0.456,1.234,0.678
1.123,-0.456,0.321,0.987,-0.654,0.123,0.789,-0.321,0.654,1.098
```

---

## Stopping Services

```bash
docker-compose down          
docker-compose down -v       
```

---

## Future Roadmap

- [ ] Qiskit quantum optimization for manufacturing parameters
- [ ] Real-time streaming sensor data via WebSockets
- [ ] Model retraining pipeline
- [ ] Role-based authentication
- [ ] Grafana/Prometheus monitoring integration

---

**Built with ❤️ for semiconductor manufacturing excellence**
