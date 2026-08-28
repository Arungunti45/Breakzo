from PIL import Image
import sys

def remove_background(input_path, output_path):
    try:
        img = Image.open(input_path).convert("RGBA")
        
        # Get the background color from the top-left pixel
        bg_color = img.getpixel((0, 0))
        
        # We need to do a flood fill or simply replace pixels that match the bg_color (with some tolerance)
        # But wait, flood fill is safer
        from PIL import ImageDraw
        ImageDraw.floodfill(img, (0, 0), (0, 0, 0, 0), thresh=20)
        
        # Also flood fill from other corners just in case
        w, h = img.size
        ImageDraw.floodfill(img, (w-1, 0), (0, 0, 0, 0), thresh=20)
        ImageDraw.floodfill(img, (0, h-1), (0, 0, 0, 0), thresh=20)
        ImageDraw.floodfill(img, (w-1, h-1), (0, 0, 0, 0), thresh=20)
        
        img.save(output_path, "PNG")
        print("Background removed successfully")
    except Exception as e:
        print("Error:", e)

remove_background("public/breakzo.png", "public/breakzo.png")
