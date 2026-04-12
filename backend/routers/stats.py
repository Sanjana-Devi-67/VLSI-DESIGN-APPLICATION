import json
import os
from datetime import datetime
from fastapi import APIRouter

router = APIRouter(prefix="/api")

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
STATS_FILE = os.path.join(DATA_DIR, "stats.json")


def _ensure_data_dir():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(STATS_FILE):
        with open(STATS_FILE, "w") as f:
            json.dump({
                "total_designs": 0,
                "total_simulations": 0,
                "total_defects_detected": 0,
                "total_optimizations": 0,
                "history": []
            }, f)


def _read_stats():
    _ensure_data_dir()
    with open(STATS_FILE, "r") as f:
        return json.load(f)


def _write_stats(stats):
    _ensure_data_dir()
    with open(STATS_FILE, "w") as f:
        json.dump(stats, f, indent=2)


def increment_stat(key: str, amount: int = 1):
    """Increment a stat counter and add to history"""
    stats = _read_stats()
    stats[key] = stats.get(key, 0) + amount

    # Add history entry (keep last 50)
    stats["history"].append({
        "event": key,
        "amount": amount,
        "timestamp": datetime.now().isoformat()
    })
    stats["history"] = stats["history"][-50:]

    _write_stats(stats)
    return stats


@router.get("/stats")
async def get_stats():
    """Get all platform activity stats"""
    stats = _read_stats()
    return stats
