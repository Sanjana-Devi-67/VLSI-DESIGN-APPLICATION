"""
Monitoring service for the Semiconductor AI SaaS platform.
Provides health checks, logging, and performance metrics.
"""
import time
import logging
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
)
logger = logging.getLogger("monitoring")

app = FastAPI(
    title="Monitoring Service",
    description="Health checks and logging for Semiconductor AI SaaS",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory metrics
metrics = {
    "start_time": datetime.utcnow().isoformat(),
    "requests_logged": 0,
    "health_checks": 0,
}


@app.get("/health")
async def health_check():
    """Health check endpoint for the monitoring service."""
    metrics["health_checks"] += 1
    return {
        "status": "healthy",
        "service": "monitoring",
        "uptime_since": metrics["start_time"],
        "health_checks_count": metrics["health_checks"],
    }


@app.get("/metrics")
async def get_metrics():
    """Return performance metrics."""
    return {
        "service": "semiconductor-ai-saas-monitoring",
        "start_time": metrics["start_time"],
        "requests_logged": metrics["requests_logged"],
        "health_checks": metrics["health_checks"],
        "current_time": datetime.utcnow().isoformat(),
    }


@app.post("/log")
async def log_event(request: Request):
    """Accept log events from other services."""
    try:
        body = await request.json()
        level = body.get("level", "info").upper()
        message = body.get("message", "No message")
        source = body.get("source", "unknown")
        metrics["requests_logged"] += 1
        logger.log(
            getattr(logging, level, logging.INFO),
            f"[{source}] {message}",
        )
        return {"status": "logged", "id": metrics["requests_logged"]}
    except Exception as e:
        logger.error(f"Log event failed: {e}")
        return {"status": "error", "detail": str(e)}
