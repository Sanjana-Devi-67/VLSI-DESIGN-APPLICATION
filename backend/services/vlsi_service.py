import httpx

VLSI_URL = "http://localhost:8003"


async def generate_design(verilog):

    async with httpx.AsyncClient() as client:

        response = await client.post(
            f"{VLSI_URL}/generate",
            json={"verilog": verilog}
        )

    return response.json()

async def run_simulation(design):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{VLSI_URL}/simulate",
            json={"design": design}
        )

    return response.json()