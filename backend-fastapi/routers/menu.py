from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from database import db
import json

router = APIRouter()

class MenuItem(BaseModel):
    canteen_id: int
    name: str
    description: str
    price: float
    category: str
    stock_quantity: int
    is_available: bool
    image_url: str = None
    is_vegan: bool = False
    is_vegetarian: bool = False
    spice_level: str = 'none'
    allergens: str = None
    calories: int = 0
    customization_options: dict = {"sizes": [], "addons": []}

@router.post("/")
async def create_menu_item(req: Request, item: MenuItem):
    try:
        row = await db.fetchrow(
            """INSERT INTO menu_items 
               (canteen_id, name, description, price, category, stock_quantity, is_available, image_url, is_vegan, is_vegetarian, spice_level, allergens, calories, customization_options) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) RETURNING *""",
            item.canteen_id, item.name, item.description, item.price, item.category, item.stock_quantity, item.is_available, item.image_url, item.is_vegan, item.is_vegetarian, item.spice_level, item.allergens, item.calories, json.dumps(item.customization_options)
        )
        await req.app.state.sio.emit('menu_updated', {'action': 'created'})
        return {"message": "Menu item created successfully", "item": dict(row)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/{id}")
async def update_menu_item(id: int, req: Request, item: MenuItem):
    try:
        row = await db.fetchrow(
            """UPDATE menu_items 
               SET name=$1, description=$2, price=$3, category=$4, stock_quantity=$5, is_available=$6, image_url=$7, is_vegan=$8, is_vegetarian=$9, spice_level=$10, allergens=$11, calories=$12, customization_options=$13 
               WHERE id=$14 RETURNING *""",
            item.name, item.description, item.price, item.category, item.stock_quantity, item.is_available, item.image_url, item.is_vegan, item.is_vegetarian, item.spice_level, item.allergens, item.calories, json.dumps(item.customization_options), id
        )
        if not row:
            raise HTTPException(status_code=404, detail="Item not found")
        await req.app.state.sio.emit('menu_updated', {'action': 'updated'})
        return {"message": "Menu item updated successfully", "item": dict(row)}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{id}")
async def delete_menu_item(id: int, req: Request):
    try:
        await db.execute("DELETE FROM menu_items WHERE id=$1", id)
        await req.app.state.sio.emit('menu_updated', {'action': 'deleted'})
        return {"message": "Menu item deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
