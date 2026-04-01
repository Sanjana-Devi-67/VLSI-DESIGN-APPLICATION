# QANTYX - End-to-End AI-Powered VLSI Design Platform

QANTYX is an enterprise-grade AI SaaS platform for semiconductor design, offering automated Verilog generation, simulations, layout optimization, and semiconductor defect detection using advanced AI/ML algorithms.

## Architecture

QANTYX follows a robust microservices architecture orchestrated via Docker Compose:

- **Frontend:** Next.js (App Router), Tailwind CSS, Framer Motion, Shadcn UI, Recharts.
- **Backend (API Router/Auth/Projects):** FastAPI, PostgreSQL, Redis.
- **AI Engine Microservice:** FastAPI holding open-source LLM integrations (Llama/Mistral) and predictive ML models (LightGBM, PyTorch Neural Networks).
- **VLSI Tools Microservice:** FastAPI wrapping physical tools (Yosys, OpenROAD, Verilator).
- **Semiconductor SaaS:** Reused ML data engineering pipelines from `effi-energy`.
- **Database:** PostgreSQL for User & Design management, Redis for caching.

## Folder Structure

```
QANTYX/
 ├── frontend/               # Next.js UI Application
 ├── backend/                # Primary FastAPI Service
 ├── ai-engine/              # AI predictive and generative models
 ├── vlsi-tools/             # Wrappers for CLI tools
 ├── semiconductor-saas/     # Previously implemented data ML pipelines
 ├── database/               # SQL initialization scripts
 └── docker-compose.yml      # Orchestration definition
```

## Setup & Running Locally

### Prerequisites
- Docker and Docker Compose installed.
- Node.js 18+ (For local frontend dev without Docker).
- Python 3.11+ (For local backend dev without Docker).

### Option 1: Run with Docker Compose (Recommended)
This will spin up all the microservices, alongside the PostgreSQL database and Redis cache.

1. Ensure Docker Desktop is running.
2. Open a terminal in the root `Qantyx` directory.
3. Run the following command:
   ```bash
   docker-compose up --build
   ```
4. Access the applications:
   - **Frontend:** `http://localhost:3000`
   - **Main Backend API Docs:** `http://localhost:8000/docs`
   - **AI Engine API Docs:** `http://localhost:8001/docs`
   - **VLSI Tools API Docs:** `http://localhost:8002/docs`

### Option 2: Run Microservices Independently

If you wish to work on a specific part of the stack locally:

**1. Run the Frontend (Next.js)**
```bash
cd frontend
npm install
npm run dev
```

**2. Run the Main Backend (FastAPI)**
```bash
cd backend
python -m venv venv
# Activate venv: .\venv\Scripts\activate (Windows) or source venv/bin/activate (Linux/Mac)
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Features Complete

- [x] Base Folder configurations and containerization definitions.
- [x] Dark Mode Glassmorphism UI (Landing page, Login, Dashboards).
- [x] AI VLSI Designer Prompt Interface.
- [x] Semiconductor Analytics upload and dashboard predictions.
- [x] FastAPI skeleton for multiple microservices in the stack.
