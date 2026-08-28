from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from database import db
from datetime import datetime, date
import math

router = APIRouter()

class PredictionRequest(BaseModel):
    canteen_id: int
    time_of_day: str
    weather: str

@router.post("/demand")
async def predict_demand(request: PredictionRequest):
    # Modular Local Forecasting Approach (Fallback for AI/ML)
    # 1. Historical average
    # 2. Time/day weighting
    # 3. Weather adjustment
    # 4. Event adjustment

    try:
        # Base demand from historical active orders
        rows = await db.fetch("SELECT COUNT(*) FROM orders WHERE canteen_id = $1", request.canteen_id)
        historical_total = rows[0]['count'] if rows else 0
        base_demand = max(100, historical_total // 7) # rough proxy for daily avg

        # Time weighting
        if request.time_of_day == "lunch":
            base_demand += 150
        elif request.time_of_day == "dinner":
            base_demand += 80

        # Weather weighting
        if request.weather == "rainy":
            base_demand += 40
        elif request.weather == "sunny":
            base_demand -= 10

        # Event adjustment (look for events today)
        today = date.today()
        event = await db.fetchrow("SELECT expected_attendance FROM events WHERE event_date = $1", today)
        if event:
            base_demand += int(event['expected_attendance'] * 0.1) # 10% of event attendees might order food

        return {
            "canteen_id": request.canteen_id,
            "predicted_demand_orders": base_demand,
            "confidence": 0.85
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/wait-time")
async def predict_wait_time(active_orders: int, weather: str = "clear"):
    base_wait = 5.0
    
    # Non-linear load scaling based on kitchen capacity curve
    load_factor = math.pow(active_orders, 1.25) * 0.4
    
    # Peak hour penalty (12PM-2PM and 6PM-8PM)
    hour = datetime.now().hour
    is_peak = (12 <= hour <= 14) or (18 <= hour <= 20)
    peak_penalty = 5.0 if is_peak else 0.0
    
    weather_penalty = 3.0 if weather == "rainy" else 0.0
    estimated_wait = base_wait + load_factor + peak_penalty + weather_penalty
    
    return {
        "estimated_wait_minutes": round(estimated_wait),
        "active_orders": active_orders,
        "weather_penalty_applied": weather_penalty > 0,
        "is_peak_hour": is_peak
    }

@router.get("/ingredient-demand")
async def predict_ingredient_demand(menu_item_id: int):
    # Find average quantity sold over last 7 days
    try:
        query = """
            SELECT SUM(quantity) as total_sold
            FROM order_items oi
            JOIN orders o ON oi.order_id = o.id
            WHERE oi.menu_item_id = $1 AND o.created_at >= NOW() - INTERVAL '7 days'
        """
        row = await db.fetchrow(query, menu_item_id)
        sold_last_7_days = row['total_sold'] if row and row['total_sold'] else 0
        
        predicted = max(20, int(sold_last_7_days / 7) + 15) # Base prediction
        
        return {
            "menu_item_id": menu_item_id,
            "predicted_demand_units_tomorrow": predicted,
            "confidence": 0.90
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/compare-canteens")
async def compare_canteens():
    try:
        # Fetch real canteens
        canteens = await db.fetch("SELECT id, name FROM canteens WHERE status = 'open'")
        result = []
        for c in canteens:
            # Get active orders for this canteen
            row = await db.fetchrow("SELECT COUNT(*) FROM orders WHERE canteen_id = $1 AND status IN ('pending', 'accepted', 'preparing')", c['id'])
            active_orders = row['count'] if row else 0
            
            est_wait = round(5.0 + math.pow(active_orders, 1.1) * 0.4)
            result.append({
                "id": c['id'],
                "name": c['name'],
                "active_orders": active_orders,
                "estimated_wait_minutes": est_wait
            })
            
        if not result:
            return {"recommended_canteen": None, "all_canteens": []}
            
        result.sort(key=lambda x: x["estimated_wait_minutes"])
        
        return {
            "recommended_canteen": result[0],
            "all_canteens": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/recommend/{user_id}")
async def recommend_food(user_id: int):
    try:
        # Check student preferences
        prefs = await db.fetchrow("SELECT is_vegan, is_vegetarian FROM student_preferences WHERE user_id = $1", user_id)
        is_vegan = prefs['is_vegan'] if prefs else False
        is_veg = prefs['is_vegetarian'] if prefs else False

        # Get popular items matching preferences
        query = "SELECT id, name, price, category FROM menu_items WHERE is_available = true"
        if is_vegan:
            query += " AND is_vegan = true"
        elif is_veg:
            query += " AND is_vegetarian = true"
            
        query += " LIMIT 5"
        
        items = await db.fetch(query)
        return {
            "user_id": user_id,
            "recommendations": [dict(i) for i in items]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
