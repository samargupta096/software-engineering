import os
from PIL import Image, ImageDraw, ImageFont
import random

# Configuration
OUTPUT_DIR = "assets/animations"
FONT_SIZE = 60
WIDTH = 800
HEIGHT = 200
BG_COLOR = (10, 10, 10)  # Dark background
TEXT_COLOR = (0, 255, 100)  # Cyberpunk Green
ACCENT_COLOR = (255, 0, 100) # Cyberpunk Pink

LEARNING_PATHS = [
    "Computer Science Fundamentals",
    "System Design Fundamentals",
    "Core Components",
    "Cloud & AWS",
    "Infrastructure & DevOps",
    "Java Landscape",
    "Low-Level Design (LLD)",
    "Real-World System Designs"
]

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def create_glitch_frame(text, font, phase):
    img = Image.new('RGB', (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    w = draw.textlength(text, font=font)
    x = (WIDTH - w) / 2
    y = (HEIGHT - FONT_SIZE) / 2

    # Draw main text
    draw.text((x, y), text, font=font, fill=TEXT_COLOR)
    
    # Glitch effect
    if random.random() < 0.3:
        # Shift slice
        slice_height = random.randint(5, 20)
        slice_y = random.randint(0, HEIGHT - slice_height)
        offset_x = random.randint(-10, 10)
        
        box = (0, slice_y, WIDTH, slice_y + slice_height)
        region = img.crop(box)
        img.paste(region, (offset_x, slice_y))
        
    # Random digital noise pixels
    for _ in range(20):
        px = random.randint(0, WIDTH-1)
        py = random.randint(0, HEIGHT-1)
        draw.point((px, py), fill=ACCENT_COLOR)

    return img

def create_typing_frame(text, font, char_count):
    img = Image.new('RGB', (WIDTH, HEIGHT), BG_COLOR)
    draw = ImageDraw.Draw(img)
    
    visible_text = text[:char_count]
    if char_count < len(text):
        visible_text += "█" # Cursor
        
    w = draw.textlength(text, font=font) # Measure full text to center
    x = (WIDTH - w) / 2
    y = (HEIGHT - FONT_SIZE) / 2
    
    draw.text((x, y), visible_text, font=font, fill=TEXT_COLOR)
    
    return img

def generate_banner(text, filename):
    print(f"Generating {filename}...")
    try:
        # Try to use a monospace font, fallback to default
        try:
            font = ImageFont.truetype("DejaVuSansMono-Bold.ttf", FONT_SIZE)
        except:
             try:
                font = ImageFont.truetype("arial.ttf", FONT_SIZE)
             except:
                font = ImageFont.load_default()
                print("Warning: Using default font.")

        frames = []
        
        # 1. Typing effect
        for i in range(len(text) + 1):
            frames.append(create_typing_frame(text, font, i))
            
        # 2. Hold with cursor blinking
        full_text_frame = create_typing_frame(text, font, len(text)).crop((0,0,WIDTH,HEIGHT)) # Remove cursor for blink
        cursor_frame = create_typing_frame(text, font, len(text)) # With cursor
        
        for _ in range(3):
            frames.append(full_text_frame)
            frames.append(cursor_frame)
            
        # 3. Glitch effect at the end
        for i in range(10):
            frames.append(create_glitch_frame(text, font, i))
            
        # Save GIF
        frames[0].save(
            os.path.join(OUTPUT_DIR, filename),
            save_all=True,
            append_images=frames[1:],
            optimize=False,
            duration=100,
            loop=0
        )
    except Exception as e:
        print(f"Error generating {filename}: {e}")

def main():
    ensure_dir(OUTPUT_DIR)
    
    for path in LEARNING_PATHS:
        # Create safe filename
        safe_name = path.lower().replace(" & ", "-").replace(" ", "-").replace("(", "").replace(")", "")
        filename = f"{safe_name}.gif"
        generate_banner(path, filename)

if __name__ == "__main__":
    main()
