from fastapi import APIRouter

from services.ai_service import generate_verilog
from services.simulation_service import run_simulation
from services.vlsi_service import generate_design
from routers.stats import increment_stat

router = APIRouter(prefix="/design")


@router.post("/generate")
async def generate(data: dict):

    prompt = data["prompt"]

    verilog_response = await generate_verilog(prompt)
    verilog = verilog_response["verilog"]

    design = await generate_design(verilog)

    # Increment design counter
    increment_stat("total_designs")

    return {
        "verilog": verilog,
        "design": design
    }


@router.post("/simulate")
async def simulate(data: dict):

    verilog = data["verilog"]

    result = await run_simulation(verilog)

    return result