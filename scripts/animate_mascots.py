import os
from PIL import Image, ImageEnhance
import math
import glob

# Configuration
INPUT_DIR = "/home/samarpit/.gemini/antigravity/brain/6c6222cd-9dd3-46f8-ae49-741451268bf4"
OUTPUT_DIR = "assets/animations"
# Map image names (prefixes from creation) to final filenames
IMAGE_MAP = {
    "cs_fundamentals_mascot": "computer-science-fundamentals.gif",
    "system_design_mascot": "system-design-fundamentals.gif",
    "core_components_mascot": "core-components.gif",
    "cloud_aws_mascot": "cloud-aws.gif",
    "infrastructure_devops_mascot": "infrastructure-devops.gif",
    "java_landscape_mascot": "java-landscape.gif",
    "lld_mascot": "low-level-design-lld.gif",
    "real_world_designs_mascot": "real-world-system-designs.gif"
}

FRAMES = 20 # Number of frames for the loop

def ensure_dir(path):
    if not os.path.exists(path):
        os.makedirs(path)

def create_breathing_frames(image_path):
    try:
        base_img = Image.open(image_path).convert("RGBA")
        # Resize to reasonable banner width, maintaining aspect ratio
        target_width = 800
        w_percent = (target_width / float(base_img.size[0]))
        h_size = int((float(base_img.size[1]) * float(w_percent)))
        base_img = base_img.resize((target_width, h_size), Image.Resampling.LANCZOS)
        
        frames = []
        for i in range(FRAMES):
            # Calculate sine wave for breathing effect (scaling)
            # Scale varies between 1.0 and 1.02
            scale_factor = 1.0 + 0.02 * math.sin(2 * math.pi * i / FRAMES)
            
            new_size = (int(target_width * scale_factor), int(h_size * scale_factor))
            resized_img = base_img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Center crop to original size to avoid image jumping
            left = (new_size[0] - target_width) / 2
            top = (new_size[1] - h_size) / 2
            right = (new_size[0] + target_width) / 2
            bottom = (new_size[1] + h_size) / 2
            
            frame = resized_img.crop((left, top, right, bottom))
            
            # Optional: Slight brightness pulse
            # enhance_factor = 1.0 + 0.05 * math.sin(2 * math.pi * i / FRAMES)
            # enhancer = ImageEnhance.Brightness(frame)
            # frame = enhancer.enhance(enhance_factor)
            
            frames.append(frame)
            
        return frames
    except Exception as e:
        print(f"Error processing {image_path}: {e}")
        return None

def main():
    ensure_dir(OUTPUT_DIR)
    
    # Process each mapped image
    for prefix, filename in IMAGE_MAP.items():
        # Find the full path for the generated image (timestamp suffix varies)
        pattern = os.path.join(INPUT_DIR, f"{prefix}_*.png")
        matches = glob.glob(pattern)
        
        if not matches:
            print(f"Warning: No match found for {prefix}")
            continue
            
        # Take the most recent match if multiple
        input_path = sorted(matches)[-1]
        print(f"Processing {input_path} -> {filename}...")
        
        frames = create_breathing_frames(input_path)
        
        if frames:
            output_path = os.path.join(OUTPUT_DIR, filename)
            frames[0].save(
                output_path,
                save_all=True,
                append_images=frames[1:],
                optimize=True,
                duration=100, # 100ms per frame
                loop=0
            )
            print(f"Saved {output_path}")

if __name__ == "__main__":
    main()
