import httpx

SEMICONDUCTOR_URL = "http://localhost:8002"


async def defect_prediction(data):

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SEMICONDUCTOR_URL}/predict",
            json=data
        )

    return response.json()


async def upload_sensor(data):

    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{SEMICONDUCTOR_URL}/upload",
            json=data
        )

    return response.json()