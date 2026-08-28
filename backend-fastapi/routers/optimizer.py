from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
from datetime import datetime, timedelta
import math

router = APIRouter()

class BreakOptimizerRequest(BaseModel):
    break_start: str # e.g., "10:30"
    break_end: str   # e.g., "10:45"
    student_location_id: int = None
    selected_items: list[int] = []

@router.post("/optimize")
async def optimize_break(request: BreakOptimizerRequest):
    try:
        start_time = datetime.strptime(request.break_start, "%H:%M").time()
        end_time = datetime.strptime(request.break_end, "%H:%M").time()

        # Step 1: Find open canteens
        canteens = await db.fetch("SELECT id, name FROM canteens WHERE status = 'open'")
        if not canteens:
            raise HTTPException(status_code=404, detail="No canteens open.")

        best_plan = None
        best_score = 9999

        for c in canteens:
            # Step 2: Calculate estimated preparation time for selected items at this canteen
            # (In a real scenario, this would check if the canteen has the items first)
            prep_time_minutes = 5 # base
            if request.selected_items:
                prep_time_minutes += len(request.selected_items) * 2

            # Step 3: Check kitchen workload (active orders)
            row = await db.fetchrow("SELECT COUNT(*) FROM orders WHERE canteen_id = $1 AND status IN ('pending', 'accepted', 'preparing')", c['id'])
            active_orders = row['count'] if row else 0
            
            # Non-linear workload penalty
            kitchen_delay = math.pow(active_orders, 1.1) * 0.5
            total_prep_est = prep_time_minutes + kitchen_delay

            # Step 4: Find a suitable pickup slot within the break
            query = """
                SELECT id, start_time, end_time, max_capacity, current_bookings 
                FROM pickup_slots 
                WHERE canteen_id = $1 AND is_active = true 
                  AND start_time >= $2 AND end_time <= $3
                  AND current_bookings < max_capacity
                ORDER BY start_time ASC
            """
            slots = await db.fetch(query, c['id'], start_time, end_time)

            if not slots:
                continue # No slots available during break at this canteen

            # Pick the earliest slot that gives kitchen enough time to prepare
            # For simplicity in this mockup, just pick the first valid slot
            chosen_slot = slots[0]

            walking_time = 3 # mock walking time from student location
            pickup_time = 1  # fast QR pickup

            total_time_needed = total_prep_est + walking_time + pickup_time
            
            # Score: lower is better (less delay, less active orders)
            score = total_time_needed + (active_orders * 0.1)

            if score < best_score:
                best_score = score
                best_plan = {
                    "canteen_id": c['id'],
                    "canteen_name": c['name'],
                    "recommended_slot_id": chosen_slot['id'],
                    "slot_time": f"{chosen_slot['start_time'].strftime('%I:%M %p')} - {chosen_slot['end_time'].strftime('%I:%M %p')}",
                    "estimated_prep_time_mins": round(total_prep_est),
                    "estimated_walking_time_mins": walking_time,
                    "estimated_pickup_time_mins": pickup_time,
                    "fits_in_break": True
                }

        if not best_plan:
            return {
                "success": False,
                "message": "Cannot guarantee order fulfillment within the specified break time due to high volume or no slots.",
                "best_plan": None
            }

        return {
            "success": True,
            "message": "Optimal break plan generated.",
            "best_plan": best_plan
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
