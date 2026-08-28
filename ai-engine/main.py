from fastapi import FastAPI
from pydantic import BaseModel
import random
import math

app = FastAPI(title="Smart Campus Food Operations AI Engine")

class PredictionRequest(BaseModel):
    canteen_id: str
    time_of_day: str
    weather: str

@app.get("/")
def read_root():
    return {"message": "AI Engine is running"}

@app.post("/predict/demand")
def predict_demand(request: PredictionRequest):
    # Mocking a predictive model that uses weather and time of day
    base_demand = 100
    if request.time_of_day == "lunch":
        base_demand += 200
    if request.weather == "rainy":
        base_demand += 50 # Students order more when it rains
        
    predicted_orders = base_demand + random.randint(-20, 20)
    
    return {
        "canteen_id": request.canteen_id,
        "predicted_demand_orders": predicted_orders,
        "confidence": 0.89
    }

@app.get("/predict/wait-time")
def predict_wait_time(active_orders: int, weather: str = "clear"):
    # Mocking a non-linear Scikit-Learn regression model
    # Wait time increases exponentially with active orders
    base_wait = 5.0
    load_factor = math.pow(active_orders, 1.2) * 0.5
    
    # Kitchen efficiency drops slightly in bad weather due to delivery/packaging overhead
    weather_penalty = 2.0 if weather == "rainy" else 0.0
    
    estimated_wait = base_wait + load_factor + weather_penalty
    
    return {
        "estimated_wait_minutes": round(estimated_wait),
        "active_orders": active_orders,
        "weather_penalty_applied": weather_penalty > 0
    }

@app.get("/predict/ingredient-demand")
def predict_ingredient_demand(menu_item_id: int):
    # Mocking prediction for ingredient demand (e.g. how many kg of tomatoes needed tomorrow)
    # In a real app this uses historical consumption data
    predicted_units = random.randint(50, 300)
    return {
        "menu_item_id": menu_item_id,
        "predicted_demand_units_tomorrow": predicted_units,
        "confidence": 0.92
    }

@app.get("/predict/compare-canteens")
def compare_canteens():
    # Mocking real-time workload prediction across campus
    canteens = [
        {"id": 1, "name": "Main Cafeteria", "active_orders": random.randint(30, 80)},
        {"id": 2, "name": "Engineering Block Canteen", "active_orders": random.randint(10, 40)},
        {"id": 3, "name": "Library Cafe", "active_orders": random.randint(5, 20)}
    ]
    
    for c in canteens:
        # Calculate dynamic wait time using our existing logic (base 5 + active/10)
        c["estimated_wait_minutes"] = round(5.0 + math.pow(c["active_orders"], 1.1) * 0.4)
        
    # Sort by lowest wait time
    canteens.sort(key=lambda x: x["estimated_wait_minutes"])
    
    return {
        "recommended_canteen": canteens[0],
        "all_canteens": canteens
    }
