from fastapi import APIRouter
from services.simulation_service import run_simulation
from routers.stats import increment_stat

router = APIRouter()


@router.post("/simulate")
async def simulate(data: dict):

    waveform = await run_simulation(
        data["verilog"]
    )

    # Increment simulation counter
    increment_stat("total_simulations")

    return {
        "waveform": waveform
    }