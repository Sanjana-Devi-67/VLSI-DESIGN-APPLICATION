import httpx
from services.optimizer_service import optimize_verilog
VLSI_SERVICE_URL = "http://localhost:8003"


async def run_simulation(verilog_code):

    optimized = await optimize_verilog(verilog_code)

    verilog_code = optimized["optimized"]

    async with httpx.AsyncClient(timeout=60.0) as client:

        response = await client.post(
            f"{VLSI_SERVICE_URL}/simulate",
            json={
                "verilog": verilog_code
            }
        )

    return response.json()


async def optimize_design(verilog):

    print("Calling optimizer service")

    optimized = await optimize_verilog(verilog)

    verilog = optimized["optimized"]

    print("After optimization:")
    print(verilog)

    async with httpx.AsyncClient(timeout=60.0) as client:

        response = await client.post(
            f"{VLSI_SERVICE_URL}/optimize",
            json={
                "verilog": verilog
            }
        )

    return response.json()