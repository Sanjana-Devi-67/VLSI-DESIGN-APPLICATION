from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import design, analytics
from routers import simulation
from routers import optimization
from routers import auth
from routers import stats
from routers import runs

app = FastAPI(
    title="QANTYX AI VLSI Platform"
)

# CORS (important for frontend later)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    # allow_origins=[
    #     "http://localhost:3000",
    #     "http://127.0.0.1:3000"
    # ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "QANTYX Backend Running"
    }


@app.get("/health")
def health():
    return {
        "status": "running"
    }


app.include_router(design.router)
app.include_router(analytics.router)
app.include_router(simulation.router)
app.include_router(optimization.router)
app.include_router(auth.router)
app.include_router(stats.router)
app.include_router(runs.router)