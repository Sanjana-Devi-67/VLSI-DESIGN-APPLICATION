import httpx

AI_ENGINE_URL = "http://localhost:8000"



async def generate_verilog(prompt):

    async with httpx.AsyncClient(timeout=60.0) as client:

        response = await client.post(
            f"{AI_ENGINE_URL}/generate",
            json={"prompt": prompt}
        )

    print("AI response:", response.text)   # <-- add this

    return response.json()

async def power_prediction(data):

    async with httpx.AsyncClient() as client:

        response = await client.post(
            f"{AI_ENGINE_URL}/predict/power",
            json=data
        )

    return response.json()