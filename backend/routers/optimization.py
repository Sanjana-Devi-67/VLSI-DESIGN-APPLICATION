from fastapi import APIRouter
from services.simulation_service import optimize_design

router = APIRouter(prefix="/optimize")

@router.post("/")
async def optimize(data: dict):

    verilog = data["verilog"]

    result = await optimize_design(verilog)

    return result