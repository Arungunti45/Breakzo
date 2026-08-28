from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

router = APIRouter()

class CampusEvent(BaseModel):
    name: str
    date: str
    expected_attendance: int

@router.get("/")
async def get_events():
    # Mock event data
    return [
        {"name": "Midterm Exams", "date": "2026-08-25", "expected_attendance": 2000},
        {"name": "Sports Meet", "date": "2026-08-26", "expected_attendance": 1500}
    ]
