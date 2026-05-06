# 🚀 QANTYX – AI-Powered VLSI Design & Simulation Platform

QANTYX is an end-to-end AI-powered VLSI design platform that enables users to generate, optimize, and simulate Verilog designs using advanced language models and modern web technologies.

It combines **AI-based code generation**, **design correction**, **simulation workflows**, and **analytics dashboards** into one unified system.

---

## 🌟 Features

### 🧠 AI Verilog Generation
- Generate synthesizable Verilog code from natural language prompts
- Supports modules like ALU, counters, FSMs, and more
- Uses hybrid LLM architecture for better accuracy

### 🔧 Code Optimization & Fixing
- Automatically fixes syntax errors
- Improves synthesizability
- Enhances code quality

### 📊 Dashboard & Analytics
- View simulation runs
- Track system statistics
- Monitor performance

### 🌐 Full Stack Integration
- Frontend + Backend + AI Engine fully connected
- REST API-based communication
- Real-time interaction

## 🧠 Quantum Optimization Module

Qantyx includes a dedicated quantum-inspired optimization module designed to enhance VLSI design efficiency.

### Key Highlights:
- Uses quantum-inspired algorithms (QAOA-style logic, annealing concepts)
- Solves optimization problems like:
  - Gate placement
  - Routing optimization
  - Parameter tuning
- Hybrid approach:
  - Classical ML + Quantum-inspired techniques
- Scalable for future integration with real quantum hardware
---

## 🏗️ Architecture Overview

- Frontend handles UI and user interaction
- AI Engine generates Verilog code
- Quantum engine can be used for Optimization of the code
- Backend manages simulation and analytics
- All components communicate via APIs


```mermaid
flowchart LR

%% ---------------- FRONTEND ----------------
subgraph Frontend ["Frontend (Next.js - Port 3000)"]
    UI[User Interface]
    DesignPage[Design Page]
    SimulationPage[Simulation Page]
    OptimizationPage[Optimization Page]
    Dashboard[Dashboard]
end

%% ---------------- AI ENGINE ----------------
subgraph AIEngine ["AI Engine (FastAPI - Port 8001)"]
    GenerateAPI[/POST /generate/]
    FixAPI[/POST /fix/]
    LLM[Hybrid LLM Model]
end

%% ---------------- BACKEND ----------------
subgraph Backend ["Backend API (FastAPI - Port 8000)"]
    RunsAPI[/GET /api/runs/]
    StatsAPI[/GET /api/stats/]
    SimulationEngine[Simulation Engine]
    QuantumAPI[/POST /api/optimize/]
    Storage[(Run Data / Results)]
end

%% ---------------- QUANTUM MODULE ----------------
subgraph QuantumModule ["Quantum Optimization Engine (Qiskit)"]
    QUBO[QUBO Builder]
    QAOA[QAOA Ansatz]
    Simulator[Aer Simulator]
    Fallback[Classical Fallback]
end

%% ---------------- FLOW ----------------

UI --> DesignPage
UI --> SimulationPage
UI --> Dashboard
UI --> OptimizationPage

%% AI Flow
DesignPage -->|Prompt| GenerateAPI
GenerateAPI --> LLM
LLM -->|Verilog Code| DesignPage

DesignPage -->|Fix Request| FixAPI
FixAPI --> LLM
LLM -->|Optimized Code| DesignPage

%% Quantum Optimization Flow
OptimizationPage -->|Send Verilog| QuantumAPI
QuantumAPI --> QUBO
QUBO --> QAOA
QAOA --> Simulator
Simulator --> QuantumAPI

QAOA -->|If Qiskit unavailable| Fallback
Fallback --> QuantumAPI

QuantumAPI -->|Optimized Code + Metrics| OptimizationPage

%% Simulation Flow
DesignPage -->|Send for Simulation| SimulationEngine
SimulationEngine --> Storage

SimulationPage --> RunsAPI
RunsAPI --> Storage
Storage --> SimulationPage

Dashboard --> StatsAPI
StatsAPI --> Storage
Storage --> Dashboard

```
---
## 🔌 Ports & Services

| Service           | URL                        | Description |
|------------------|---------------------------|------------|
| Frontend         | http://localhost:3000     | User Interface |
| AI Engine        | http://127.0.0.1:8000     | Verilog generation & fixing |
| Backend API      | http://127.0.0.1:8001     | Simulation & analytics |
| VLSI Tools       | http://127.0.0.1:8003     | Verilog system & Quantum Optimization|
| Semiconductor saas | http://127.0.0.1:8002   | Semiconductor Defect detection |
| AI Docs          | http://127.0.0.1:8001/docs| Swagger for AI engine |
| Backend Docs     | http://127.0.0.1:8000/docs| Swagger for backend |

---

## 🔌 API Endpoints

### **AI Engine (Port 8000)**

- **Fix Verilog**
  - **POST** `/fix`
  - **Request**
    ```json
    { "verilog": "module ..." }
    ```
  - **Response**
    ```json
    { "optimized": "module ..." }
    ```

- **Health Check**
  - **GET** `/health`

---

### **Backend API (Port 8001)**

- **Get Runs**
  - **GET** `/api/runs/`

- **Get Stats**
  - **GET** `/api/stats`

---

## ⚙️ Setup Instructions

### Setup Python Environment

``` bash
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
```

### Run AI Engine

``` bash
cd ai_engine
python -m uvicorn main:app --port 8000 --reload
```

### Run Backend

``` bash
cd backend
python -m uvicorn main:app --port 8001 --reload
```

### Run Frontend

``` bash
cd frontend
npm install
npm run dev
```

------------------------------------------------------------------------

## 🔄 Workflow

1.  User enters prompt in frontend\
2.  Request sent to AI Engine via `/generate`\
3.  Verilog code generated\
4.  Optional fixing via `/fix`\
5.  Quantum Optimization if required \
6.  Backend runs simulation\
7.  Results shown in dashboard

------------------------------------------------------------------------

## 🧪 Example Use Cases

-   Generate digital circuits (ALU, counters)\
-   Fix broken Verilog code\
-   Run simulations\
-   Optimize codes to reduce gates and power \
-   Analyze design performance

------------------------------------------------------------------------

## 🛠️ Tech Stack

  Layer           Technology
  --------------- -----------------
  Frontend        React / Next.js
  Backend         FastAPI
  AI Engine       Python + LLM
  Communication   REST APIs
  Optimization    Qiskit + QAOA Algos
------------------------------------------------------------------------

## 🚧 Limitations

-   Local simulation depends on system performance\
-   Requires manual setup\
-   Limited dataset for optimization tuning

------------------------------------------------------------------------

## 🔮 Future Enhancements

-   Cloud-based simulation\
-   FPGA integration\
-   Advanced visualization\
-   Multi-user collaboration\
-   AI-based performance prediction

------------------------------------------------------------------------

## 🤝 Contributing

Pull requests are welcome!\
For major changes, please open an issue first.

------------------------------------------------------------------------

## 📜 License

MIT License

------------------------------------------------------------------------

## 💡 Notes

-   Ensure all services run on their correct ports\
-   Enable CORS for frontend-backend communication\
-   Use Swagger Docs to test APIs
