import httpx

VLSI_SERVICE_URL = "http://localhost:8003"


async def run_simulation(verilog_code):

    async with httpx.AsyncClient(timeout=60.0) as client:

        response = await client.post(
            f"{VLSI_SERVICE_URL}/simulate",
            json={
                "verilog": verilog_code
            }
        )

    return response.json()


async def optimize_design(verilog):

    async with httpx.AsyncClient(timeout=60.0) as client:

        response = await client.post(
            f"{VLSI_SERVICE_URL}/optimize",
            json={
                "verilog": verilog
            }
        )

    return response.json()