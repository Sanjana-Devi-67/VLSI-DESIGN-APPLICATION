import httpx

AI_ENGINE_URL = "http://localhost:8000"


async def optimize_verilog(verilog):

    async with httpx.AsyncClient() as client:

        response = await client.post(
            f"{AI_ENGINE_URL}/fix",
            json={
                "verilog": verilog
            }
        )

    return response.json()