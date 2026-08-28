import asyncio
import asyncpg
import os
import random
from dotenv import load_dotenv

load_dotenv()

DB_URL = "postgres://postgres:Arunkumar%4045@localhost:5432/food_app_db"

menu_data = {
    "1. BREAKFAST": [
        "Idly", "Vada", "Masala Vada", "Plain Dosa", "Masala Dosa", "Onion Dosa", "Mysore Dosa", "Set Dosa", "Pesarattu", "Upma", "Pongal", "Poori", "Poori Masala", "Chapati", "Paratha", "Bread Omelette", "Egg Bhurji", "Boiled Egg", "Breakfast Combo"
    ],
    "2. SOUTH INDIAN": [
        "Sambar Vada", "Dahi Vada", "Ghee Dosa", "Cheese Dosa", "Rava Dosa", "Uttapam", "Onion Uttapam", "Tomato Uttapam", "Pulihora", "Curd Rice", "Lemon Rice", "Tamarind Rice"
    ],
    "3. NORTH INDIAN": [
        "Chole Bhature", "Rajma Rice", "Dal Rice", "Dal Tadka", "Jeera Rice", "Veg Pulao", "Veg Biryani", "Paneer Biryani", "Butter Naan", "Plain Naan", "Garlic Naan", "Tandoori Roti", "Aloo Paratha", "Paneer Paratha", "Gobi Paratha", "Mixed Veg Paratha", "Chole Kulcha", "Veg Thali"
    ],
    "4. RICE & BIRYANI": [
        "Chicken Biryani", "Egg Biryani", "Mushroom Biryani", "Fried Rice", "Veg Fried Rice", "Paneer Fried Rice", "Chicken Fried Rice", "Egg Fried Rice", "Schezwan Fried Rice", "Tomato Rice"
    ],
    "5. NOODLES & PASTA": [
        "Veg Noodles", "Paneer Noodles", "Chicken Noodles", "Egg Noodles", "Schezwan Noodles", "Hakka Noodles", "Veg Pasta", "White Sauce Pasta", "Red Sauce Pasta", "Pink Sauce Pasta", "Penne Pasta", "Macaroni", "Cheese Pasta"
    ],
    "6. FAST FOOD": [
        "Veg Burger", "Cheese Burger", "Paneer Burger", "Chicken Burger", "Veg Sandwich", "Cheese Sandwich", "Grilled Sandwich", "Paneer Sandwich", "Chicken Sandwich", "Club Sandwich", "Veg Pizza", "Paneer Pizza", "Cheese Pizza", "Chicken Pizza", "French Fries", "Peri Peri Fries", "Cheese Fries", "Veg Wrap", "Paneer Wrap", "Chicken Wrap"
    ],
    "7. SNACKS": [
        "Samosa", "Aloo Samosa", "Paneer Samosa", "Kachori", "Aloo Bonda", "Mysore Bonda", "Mirchi Bajji", "Onion Bajji", "Paneer Pakoda", "Bread Pakoda", "Veg Pakoda", "Punugulu", "Corn Samosa", "Spring Roll", "Veg Cutlet", "Paneer Cutlet", "Chicken Cutlet", "Chicken 65", "Chicken Wings"
    ],
    "8. CHAAT": [
        "Pani Puri", "Bhel Puri", "Sev Puri", "Dahi Puri", "Masala Puri", "Samosa Chaat", "Aloo Tikki Chaat", "Papdi Chaat", "Dahi Papdi Chaat", "Ragda Pattice", "Pav Bhaji", "Basket Chaat"
    ],
    "9. ROLLS & MOMOS": [
        "Veg Momos", "Paneer Momos", "Chicken Momos", "Fried Momos", "Schezwan Momos", "Veg Spring Roll", "Paneer Roll", "Egg Roll", "Chicken Roll", "Veg Kathi Roll", "Paneer Kathi Roll", "Chicken Kathi Roll"
    ],
    "10. SOUTH INDIAN SPECIALS": [
        "Hyderabadi Chicken Biryani", "Hyderabadi Veg Biryani", "Andhra Meals", "South Indian Meals", "Gongura Rice", "Bonda", "Medu Vada"
    ],
    "11. NON-VEGETARIAN": [
        "Chicken Lollipop", "Chicken Manchurian", "Chicken Curry", "Chicken Tikka", "Omelette"
    ],
    "12. VEGETARIAN": [
        "Paneer Tikka", "Paneer Butter Masala", "Veg Manchurian", "Gobi Manchurian"
    ],
    "13. PANEER SPECIALS": [
        "Kadai Paneer", "Palak Paneer", "Paneer Chilli"
    ],
    "14. EGG ITEMS": [
        "Half Boiled Egg", "Masala Omelette", "Cheese Omelette", "Egg Wrap"
    ],
    "15. BEVERAGES - HOT": [
        "Tea", "Milk Tea", "Ginger Tea", "Masala Tea", "Green Tea", "Black Tea", "Coffee", "Filter Coffee", "Milk Coffee", "Black Coffee", "Cappuccino", "Hot Chocolate"
    ],
    "16. BEVERAGES - COLD": [
        "Cold Coffee", "Cold Chocolate", "Iced Coffee", "Iced Tea", "Lassi", "Sweet Lassi", "Salt Lassi", "Mango Lassi", "Buttermilk", "Chocolate Milkshake", "Vanilla Milkshake", "Strawberry Milkshake", "Mango Milkshake", "Oreo Milkshake"
    ],
    "17. FRESH JUICES": [
        "Orange Juice", "Apple Juice", "Watermelon Juice", "Pineapple Juice", "Mango Juice", "Mosambi Juice", "Grape Juice", "Pomegranate Juice", "Carrot Juice", "Beetroot Juice", "Lemon Juice", "Mint Lemon Juice"
    ],
    "18. MOCKTAILS": [
        "Virgin Mojito", "Blue Lagoon", "Green Apple", "Fruit Punch", "Strawberry Mojito", "Lemon Mint", "Watermelon Cooler", "Mango Cooler", "Pineapple Cooler"
    ],
    "19. DESSERTS": [
        "Gulab Jamun", "Rasmalai", "Rasgulla", "Jalebi", "Gajar Halwa", "Kheer", "Payasam", "Ice Cream", "Vanilla Ice Cream", "Chocolate Ice Cream", "Strawberry Ice Cream", "Butterscotch Ice Cream", "Brownie", "Chocolate Brownie", "Brownie with Ice Cream", "Fruit Salad", "Fruit Custard"
    ],
    "20. BAKERY": [
        "Veg Puff", "Paneer Puff", "Egg Puff", "Chicken Puff", "Cream Bun", "Jam Bun", "Chocolate Bun", "Garlic Bread", "Cheese Garlic Bread", "Chocolate Cake", "Black Forest Cake", "Pineapple Cake", "Muffin", "Donut", "Croissant", "Cookies"
    ],
    "21. HEALTHY / FITNESS": [
        "Fruit Bowl", "Mixed Fruit Bowl", "Sprouts Salad", "Vegetable Salad", "Paneer Salad", "Chicken Salad", "Boiled Corn", "Oats", "Vegetable Oats", "Fruit Yogurt", "Greek Yogurt", "Granola Bowl", "Protein Sandwich", "Peanut Butter Sandwich"
    ],
    "22. COMBOS": [
        "Idly + Vada Combo", "Dosa + Vada Combo", "Poori + Curry Combo", "Meals Combo", "Veg Thali Combo", "Biryani + Drink Combo", "Burger + Fries Combo", "Pizza + Drink Combo", "Sandwich + Drink Combo", "Momos + Drink Combo", "Noodles + Drink Combo", "Tea + Snack Combo", "Coffee + Snack Combo", "Student Meal Combo"
    ],
    "23. STUDENT BUDGET ITEMS": [
        "₹10 Tea", "₹10 Biscuit Pack", "₹15 Samosa", "₹20 Idly", "₹20 Vada", "₹20 Upma", "₹25 Dosa", "₹25 Poori", "₹30 Fried Rice", "₹30 Noodles", "₹30 Veg Sandwich", "₹40 Meals", "₹50 Veg Biryani", "₹50 Student Combo", "₹60 Chicken Biryani"
    ],
    "24. PACKAGED ITEMS": [
        "Bottled Water", "Mineral Water", "Soft Drink", "Fruit Juice Pack", "Energy Drink", "Milk Pack", "Flavoured Milk", "Biscuit Pack", "Chips", "Namkeen", "Chocolate", "Protein Bar", "Granola Bar", "Ice Cream Cup"
    ],
    "25. SPECIAL / DAILY ITEMS": [
        "Today's Special", "Chef Special", "Student Special", "Combo of the Day", "Breakfast Special", "Lunch Special", "Evening Special", "Weekend Special", "Festival Special", "Limited Time Offer", "Best Seller", "New Item", "Healthy Choice", "Budget Choice", "High Protein"
    ]
}

def generate_price(category, item_name):
    if "BUDGET" in category or "₹" in item_name:
        for word in item_name.split():
            if word.startswith("₹"):
                try:
                    return float(word[1:])
                except:
                    pass
        return random.randint(10, 50)
    elif "BEVERAGES" in category or "JUICES" in category:
        return random.randint(15, 60)
    elif "SNACKS" in category or "CHAAT" in category or "BAKERY" in category:
        return random.randint(20, 80)
    elif "BIRYANI" in category or "COMBO" in category or "SPECIAL" in category:
        return random.randint(120, 250)
    elif "PIZZA" in item_name.upper():
        return random.randint(99, 199)
    else:
        return random.randint(40, 150)

async def main():
    conn = await asyncpg.connect(DB_URL)
    
    print("Clearing old data...")
    # Clean up dependants to avoid foreign key conflicts
    await conn.execute("DELETE FROM order_items")
    await conn.execute("DELETE FROM orders")
    await conn.execute("DELETE FROM food_waste")
    await conn.execute("DELETE FROM recipe_items")
    await conn.execute("DELETE FROM menu_items")
    print("Data cleared!")

    print("Seeding new categories...")
    
    # Track inserted items to avoid duplicate names in DB 
    inserted_names = set()

    for category, items in menu_data.items():
        # Remove number prefix for actual category name
        cat_name = category.split(". ", 1)[1] if ". " in category else category
        
        for item_name in items:
            # Clean name if it has price in it
            clean_name = item_name
            if clean_name.startswith("₹"):
                parts = clean_name.split(" ", 1)
                if len(parts) > 1:
                    clean_name = parts[1]
            
            if clean_name in inserted_names:
                continue
            
            inserted_names.add(clean_name)
            
            is_non_veg = any(word in clean_name.lower() for word in ['chicken', 'egg', 'mutton', 'fish', 'meat'])
            is_vegetarian = not is_non_veg
            is_vegan = is_vegetarian and not any(word in clean_name.lower() for word in ['paneer', 'cheese', 'butter', 'milk', 'curd', 'ghee', 'cream', 'lassi'])
            
            price = generate_price(category, item_name)
            stock = random.randint(20, 100)
            
            # Simple placeholder images
            image_url = None
            if "BEVERAGE" in category or "JUICE" in category:
                image_url = "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&q=80&w=300&h=200"
            elif "PIZZA" in clean_name.upper() or "BURGER" in clean_name.upper() or "FAST FOOD" in category:
                image_url = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=80&w=300&h=200"
            elif "BIRYANI" in clean_name.upper() or "RICE" in category:
                image_url = "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?auto=format&fit=crop&q=80&w=300&h=200"
            elif "DESSERT" in category or "BAKERY" in category:
                image_url = "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&q=80&w=300&h=200"
            else:
                image_url = "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=300&h=200"
                
            try:
                await conn.execute(
                    """
                    INSERT INTO menu_items 
                    (canteen_id, name, description, price, category, stock_quantity, is_available, image_url, is_vegetarian, is_vegan) 
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
                    """,
                    1, clean_name, f"Delicious {clean_name} prepared fresh daily.", price, cat_name, stock, True, image_url, is_vegetarian, is_vegan
                )
            except Exception as e:
                print(f"Failed to insert {clean_name}: {e}")

    print(f"Seeding completed successfully! Inserted {len(inserted_names)} unique items.")
    await conn.close()

if __name__ == '__main__':
    asyncio.run(main())
