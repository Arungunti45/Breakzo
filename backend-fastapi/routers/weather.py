from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class WeatherData(BaseModel):
    condition: str
    temperature: float

@router.get("/")
async def get_weather():
    # Mock weather data for now, could be integrated with external API later
    return {"condition": "sunny", "temperature": 25.0}
