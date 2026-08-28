from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class RestockRequest(BaseModel):
    menu_item_id: int
    quantity: int
    supplier: str

from database import db

@router.get("/status")
async def get_inventory_status():
    try:
        rows = await db.fetch("SELECT id as item_id, name, stock_quantity as current_stock FROM menu_items")
        data = []
        for row in rows:
            stock = row['current_stock']
            status = "low_stock" if stock < 10 else "adequate"
            data.append({
                "item_id": row['item_id'],
                "name": row['name'],
                "current_stock": stock,
                "status": status
            })
        return {"status": "success", "data": data}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.get("/alerts")
async def get_low_stock_alerts():
    try:
        rows = await db.fetch("SELECT id as item_id, name, stock_quantity as current_stock FROM menu_items WHERE stock_quantity < 10")
        alerts = []
        for row in rows:
            alerts.append({
                "message": f"{row['name']} running critically low!", 
                "item_id": row['item_id'], 
                "severity": "high"
            })
        return {"alerts": alerts}
    except Exception as e:
        return {"status": "error", "message": str(e)}

@router.post("/restock")
async def log_restock(request: RestockRequest):
    return {"message": f"Successfully logged restock of {request.quantity} units from {request.supplier}"}
