import json
import os
import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/runs")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
RUNS_FILE = os.path.join(DATA_DIR, "simulation_runs.json")


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(RUNS_FILE):
        with open(RUNS_FILE, "w") as f:
            json.dump([], f)


def _read_runs():
    _ensure_data_dir()
    with open(RUNS_FILE, "r") as f:
        return json.load(f)


def _write_runs(runs):
    _ensure_data_dir()
    with open(RUNS_FILE, "w") as f:
        json.dump(runs, f, indent=2)


@router.get("/")
async def get_runs():
    """Get all simulation runs"""
    runs = _read_runs()
    return runs


@router.post("/")
async def create_run(data: dict):
    """Save a new simulation run"""
    runs = _read_runs()

    run = {
        "id": str(uuid.uuid4()),
        "name": data.get("name", "custom_design.v"),
        "type": data.get("type", "Logic (Verilator)"),
        "status": data.get("status", "Running"),
        "duration": data.get("duration", "0s"),
        "date": data.get("date", datetime.now().isoformat()),
        "verilog": data.get("verilog", ""),
        "analysis": data.get("analysis", None),
        "created_at": datetime.now().isoformat()
    }

    runs.insert(0, run)
    _write_runs(runs)

    return run


@router.put("/{run_id}")
async def update_run(run_id: str, data: dict):
    """Update an existing simulation run"""
    runs = _read_runs()

    for i, run in enumerate(runs):
        if run["id"] == run_id:
            for key, value in data.items():
                runs[i][key] = value
            _write_runs(runs)
            return runs[i]

    raise HTTPException(status_code=404, detail="Run not found")


@router.delete("/{run_id}")
async def delete_run(run_id: str):
    """Delete a simulation run"""
    runs = _read_runs()
    original_len = len(runs)

    runs = [r for r in runs if r["id"] != run_id]

    if len(runs) == original_len:
        raise HTTPException(status_code=404, detail="Run not found")

    _write_runs(runs)
    return {"message": "Run deleted"}
