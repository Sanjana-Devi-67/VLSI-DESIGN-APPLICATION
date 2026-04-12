from fastapi import APIRouter

from services.semiconductor_service import defect_prediction
from routers.stats import increment_stat

router = APIRouter(prefix="/analytics")


@router.post("/defects")
async def defects(data: dict):

    result = await defect_prediction(data)

    # Increment defects detected counter
    increment_stat("total_defects_detected")

    return result