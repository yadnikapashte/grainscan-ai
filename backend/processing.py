"""
Image processing module for grain segmentation using OpenCV.
Handles: grayscale, blur, thresholding, contour detection, bounding boxes.
"""

import cv2
import numpy as np
import random
from typing import List, Dict, Any


class GrainProcessor:
    """
    Handles all image processing steps:
    1. Preprocessing (resize, grayscale, blur)
    2. Thresholding (Otsu's method)
    3. Contour detection
    4. Grain segmentation and cropping
    5. Annotation drawing
    """

    # Min/max contour area to be considered a grain (in pixels)
    MIN_GRAIN_AREA = 200
    MAX_GRAIN_AREA = 50_000

    # Padding around each grain crop
    CROP_PADDING = 10

    def preprocess(self, img: np.ndarray) -> np.ndarray:
        """Convert to grayscale, blur, and threshold."""
        # Resize if very large
        h, w = img.shape[:2]
        if max(h, w) > 2000:
            scale = 2000 / max(h, w)
            img = cv2.resize(img, (int(w * scale), int(h * scale)))

        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

        # Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (7, 7), 0)

        # Otsu's thresholding for automatic threshold selection
        _, thresh = cv2.threshold(
            blurred, 0, 255,
            cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU
        )

        # Morphological operations to clean up
        kernel = np.ones((3, 3), np.uint8)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=2)
        thresh = cv2.morphologyEx(thresh, cv2.MORPH_DILATE, kernel, iterations=1)

        return thresh

    def segment_grains(self, img: np.ndarray) -> List[Dict[str, Any]]:
        """
        Detect and segment individual grains from image.
        Returns list of dicts with bbox, crop, area, width, height.
        """
        # Preprocess
        thresh = self.preprocess(img)
        h_img, w_img = img.shape[:2]

        # Find contours
        contours, _ = cv2.findContours(
            thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )

        segments = []
        for cnt in contours:
            area = cv2.contourArea(cnt)

            # Filter by area (remove noise and huge blobs)
            if area < self.MIN_GRAIN_AREA or area > self.MAX_GRAIN_AREA:
                continue

            # Get bounding box
            x, y, w, h = cv2.boundingRect(cnt)

            # Aspect ratio filter: grains are typically elongated
            aspect = max(w, h) / (min(w, h) + 1e-6)
            if aspect > 10:  # skip very thin streaks
                continue

            # Crop individual grain with padding
            x1 = max(0, x - self.CROP_PADDING)
            y1 = max(0, y - self.CROP_PADDING)
            x2 = min(w_img, x + w + self.CROP_PADDING)
            y2 = min(h_img, y + h + self.CROP_PADDING)
            crop = img[y1:y2, x1:x2]

            if crop.size == 0:
                continue

            segments.append({
                "bbox": [x, y, w, h],
                "area": int(area),
                "width": w,
                "height": h,
                "crop": crop,
                "contour": cnt,
            })

        return segments

    def draw_annotations(
        self,
        img: np.ndarray,
        segments: List[Dict],
        classifications: List[Dict]
    ) -> np.ndarray:
        """Draw bounding boxes and labels on image."""
        annotated = img.copy()

        COLOR_MAP = {
            "Normal":     (50, 205, 50),    # green
            "Broken":     (0, 165, 255),    # orange
            "Chalky":     (255, 215, 0),    # yellow
            "Discolored": (0, 0, 220),      # red
        }

        for seg, cls in zip(segments, classifications):
            x, y, w, h = seg["bbox"]
            quality = cls.get("quality", "Normal")
            grain_type = cls.get("grain_type", "")
            confidence = cls.get("confidence", 1.0)
            color = COLOR_MAP.get(quality, (200, 200, 200))

            # Draw bounding box
            cv2.rectangle(annotated, (x, y), (x + w, y + h), color, 2)

            # Label above box
            label = f"{grain_type[0]}-{quality[:3]} {confidence:.0%}"
            cv2.putText(
                annotated, label, (x, max(y - 5, 10)),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 1, cv2.LINE_AA
            )

        # Legend
        legend_y = 20
        for quality, color in COLOR_MAP.items():
            cv2.rectangle(annotated, (10, legend_y - 10), (25, legend_y + 2), color, -1)
            cv2.putText(annotated, quality, (30, legend_y),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
            legend_y += 20

        return annotated

    def generate_synthetic_grain_image(self) -> np.ndarray:
        """
        Generate a synthetic grain image for demo/testing.
        Creates random ellipses (grains) on a light background.
        """
        # White background (like scanner light background)
        img = np.ones((600, 800, 3), dtype=np.uint8) * 220

        # Slight texture noise
        noise = np.random.randint(0, 15, img.shape, dtype=np.uint8)
        img = cv2.subtract(img, noise)

        grain_colors = {
            "rice_normal":     [(210, 220, 195), (200, 215, 185)],
            "rice_broken":     [(190, 200, 175), (180, 195, 165)],
            "rice_chalky":     [(230, 230, 225), (225, 225, 220)],
            "rice_discolored": [(160, 140, 120), (150, 130, 110)],
            "wheat_normal":    [(180, 160, 100), (170, 150, 90)],
            "wheat_broken":    [(160, 140, 80),  (150, 130, 70)],
            "wheat_discolored":[(130, 100, 60),  (120, 95, 55)],
        }

        # Dominant type: randomly pick rice or wheat
        dominant = random.choice(["rice", "wheat"])

        grains_placed = 0
        attempts = 0
        placed_boxes = []

        while grains_placed < 60 and attempts < 500:
            attempts += 1
            cx = random.randint(50, 750)
            cy = random.randint(50, 550)

            if dominant == "rice":
                a = random.randint(18, 35)   # semi-major axis
                b = random.randint(5, 10)    # semi-minor axis
                angle = random.randint(0, 180)
                # Choose quality with realistic distribution
                r = random.random()
                if r < 0.65:    quality = "rice_normal"
                elif r < 0.80:  quality = "rice_broken"
                elif r < 0.90:  quality = "rice_chalky"
                else:           quality = "rice_discolored"
            else:
                a = random.randint(20, 30)
                b = random.randint(8, 14)
                angle = random.randint(0, 180)
                r = random.random()
                if r < 0.65:    quality = "wheat_normal"
                elif r < 0.82:  quality = "wheat_broken"
                else:           quality = "wheat_discolored"

            # Simple overlap check
            box = (cx - a, cy - a, cx + a, cy + a)
            overlap = False
            for pb in placed_boxes:
                if (abs(box[0] - pb[0]) < a + 5 and abs(box[1] - pb[1]) < a + 5):
                    overlap = True
                    break
            if overlap:
                continue

            color = random.choice(grain_colors[quality])
            # Draw filled ellipse (grain body)
            cv2.ellipse(img, (cx, cy), (a, b), angle, 0, 360, color, -1)
            # Slight edge darkening
            cv2.ellipse(img, (cx, cy), (a, b), angle, 0, 360,
                        (color[0]-20, color[1]-20, color[2]-20), 1)

            placed_boxes.append(box)
            grains_placed += 1

        # Add slight shadow/grain texture
        img = cv2.GaussianBlur(img, (3, 3), 0)
        return img
