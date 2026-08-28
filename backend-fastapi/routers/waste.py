from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
import random

router = APIRouter()

class WasteLogRequest(BaseModel):
    item_name: str
    quantity_unsold: int
    reason: str

@router.get("/analytics")
async def get_waste_analytics():
    try:
        query = """
            SELECT item_name, sum(quantity_unsold) as wasted_units 
            FROM waste_logs 
            GROUP BY item_name
        """
        rows = await db.fetch(query)
        total_kg = sum([r['wasted_units'] for r in rows]) * 0.25 # Assume 0.25kg per item
        
        overproduced = []
        for r in rows:
            # Historical check (example simple logic based on waste)
            # Find how many were wasted on average
            avg_wasted = float(r['wasted_units']) # Simplification, assuming rows sum is total
            recommendation = f"Prepare {min(30, int(avg_wasted * 0.5))}% fewer {r['item_name']} tomorrow." if avg_wasted > 5 else "Demand matched."
            
            overproduced.append({
                "name": r['item_name'], 
                "wasted_units": r['wasted_units'], 
                "estimated_loss": r['wasted_units'] * 3.5,
                "recommendation": recommendation
            })

        return {
            "daily_waste_kg": round(total_kg, 2),
            "overproduced_items": overproduced,
            "sustainability_score": max(0, 100 - int(total_kg * 2))
        }
    except Exception as e:
        return {
            "daily_waste_kg": 0,
            "overproduced_items": [],
            "sustainability_score": 100
        }

@router.post("/log")
async def log_food_waste(request: WasteLogRequest):
    try:
        await db.execute(
            "INSERT INTO waste_logs (item_name, quantity_unsold, reason) VALUES ($1, $2, $3)",
            request.item_name, request.quantity_unsold, request.reason
        )
        return {"message": f"Logged {request.quantity_unsold} unsold units of {request.item_name}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
