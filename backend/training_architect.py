import os
import cv2
import numpy as np
import random
from pathlib import Path

# --- Configuration ---
RAW_DATA_DIR = Path("training_data/raw")
PROCESSED_DIR = Path("training_data/processed")
CLASSES = ["Normal", "Broken", "Chalky", "Discolored"]

def setup_directories():
    """Create the structured training directory."""
    for cls in CLASSES:
        path = PROCESSED_DIR / cls
        path.mkdir(parents=True, exist_ok=True)
    print(f"DONE: Directory structure ready at: {PROCESSED_DIR}")

def generate_broken_grain(img):
    """Synthetically break a grain by cutting it with a random line."""
    h, w = img.shape[:2]
    mask = np.ones((h, w), dtype=np.uint8) * 255
    
    # Draw a black polygon to 'cut' the grain in half
    point = random.randint(int(w*0.3), int(w*0.7))
    pts = np.array([[point, 0], [w, 0], [w, h], [point+random.randint(-20,20), h]])
    cv2.fillPoly(mask, [pts], (0, 0, 0))
    
    broken = cv2.bitwise_and(img, img, mask=mask)
    return broken

def generate_discolored_grain(img):
    """Synthetically age/discolor a grain using HSV shifts."""
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = cv2.split(hsv)
    
    # Shift towards brown/yellow (Discoloration)
    s = cv2.add(s, 40) 
    v = cv2.subtract(v, 20)
    
    final_hsv = cv2.merge((h, s, v))
    return cv2.cvtColor(final_hsv, cv2.COLOR_HSV2BGR)

def generate_chalky_grain(img):
    """Simulate internal chalkiness by adding a bright, opaque center."""
    h, w = img.shape[:2]
    center_x, center_y = w // 2, h // 2
    # Create a 'milky' white oval in the center
    overlay = img.copy()
    cv2.ellipse(overlay, (center_x, center_y), (int(w*0.3), int(h*0.2)), 0, 0, 360, (220, 220, 220), -1)
    
    # Blend it slightly
    output = cv2.addWeighted(overlay, 0.4, img, 0.6, 0)
    return output

def extract_seeds_from_master(master_img_path):
    """
    Extract individual grains from the master scan using contour detection.
    """
    img = cv2.imread(master_img_path)
    if img is None: 
        print(f"ERROR: Could not find master scan at {master_img_path}")
        return []

    # 1. Pre-process to find grains
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, thresh = cv2.threshold(gray, 40, 255, cv2.THRESH_BINARY)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    extracted_grains = []
    for i, cnt in enumerate(contours):
        if cv2.contourArea(cnt) < 500: continue # Skip noise
        x, y, w, h = cv2.boundingRect(cnt)
        crop = img[y:y+h, x:x+w]
        
        # Save raw seed
        seed_path = RAW_DATA_DIR / f"seed_{i}.png"
        RAW_DATA_DIR.mkdir(parents=True, exist_ok=True)
        cv2.imwrite(str(seed_path), crop)
        extracted_grains.append(crop)
    
    print(f"SUCCESS: Harvested {len(extracted_grains)} high-quality seeds from the master scan.")
    return extracted_grains

def process_and_generate(master_path):
    """Whole pipeline: Extract -> Generate Classes -> Save."""
    setup_directories()
    seeds = extract_seeds_from_master(master_path)
    
    if not seeds: return

    for i, seed in enumerate(seeds):
        # 1. Normal
        cv2.imwrite(str(PROCESSED_DIR / "Normal" / f"normal_{i}.jpg"), seed)

        # 2. Broken
        broken = generate_broken_grain(seed)
        cv2.imwrite(str(PROCESSED_DIR / "Broken" / f"broken_{i}.jpg"), broken)

        # 3. Discolored
        discolored = generate_discolored_grain(seed)
        cv2.imwrite(str(PROCESSED_DIR / "Discolored" / f"disc_{i}.jpg"), discolored)

        # 4. Chalky
        chalky = generate_chalky_grain(seed)
        cv2.imwrite(str(PROCESSED_DIR / "Chalky" / f"chalky_{i}.jpg"), chalky)

    print(f"SUCCESS: Training dataset fully built at {PROCESSED_DIR}!")

if __name__ == "__main__":
    # Path to the AI-generated Master Scan
    MASTER_SCAN = r"C:\Users\ADMIN\.gemini\antigravity\brain\b1fb293b-c18f-46d9-9fc1-1d6652d512bf\master_rice_lab_scan_1776958056763.png"
    process_and_generate(MASTER_SCAN)
