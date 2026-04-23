"""
AI Grain Classifier Module
Supports loading a real .pth model (MobileNet/ResNet) or falls back to
a deterministic rule-based classifier for demo/development purposes.
"""

import os
import cv2
import numpy as np
import random
from typing import Tuple


class GrainClassifier:
    """
    Classifies individual grain crops as:
      - Grain type: Rice or Wheat
      - Quality: Normal, Broken, Chalky, Discolored

    Production: loads a pre-trained PyTorch model.
    Development/Demo: uses computer-vision heuristics.
    """

    MODEL_PATH = os.environ.get("GRAIN_MODEL_PATH", "model.pth")

    def __init__(self):
        self.model = None
        self.transform = None
        self._try_load_model()

    def _try_load_model(self):
        """Attempt to load PyTorch model; fall back to CV mode gracefully."""
        try:
            import torch
            import torchvision.transforms as T
            from torchvision import models

            if not os.path.exists(self.MODEL_PATH):
                print(f"[Model] No model at {self.MODEL_PATH}. Using CV heuristics.")
                return

            # Build MobileNetV2 with 8 output classes
            # (4 quality × 2 grain types = 8 classes)
            model = models.mobilenet_v2(pretrained=False)
            model.classifier[1] = torch.nn.Linear(
                model.last_channel, 8
            )

            state = torch.load(self.MODEL_PATH, map_location="cpu")
            model.load_state_dict(state)
            model.eval()
            self.model = model

            self.transform = T.Compose([
                T.ToPILImage(),
                T.Resize((224, 224)),
                T.ToTensor(),
                T.Normalize([0.485, 0.456, 0.406],
                            [0.229, 0.224, 0.225]),
            ])

            # Class index → (grain_type, quality)
            self.idx_to_label = {
                0: ("Rice",  "Normal"),
                1: ("Rice",  "Broken"),
                2: ("Rice",  "Chalky"),
                3: ("Rice",  "Discolored"),
                4: ("Wheat", "Normal"),
                5: ("Wheat", "Broken"),
                6: ("Wheat", "Chalky"),
                7: ("Wheat", "Discolored"),
            }

            print("[Model] PyTorch model loaded successfully.")
        except ImportError:
            print("[Model] PyTorch not installed. Using CV heuristics.")
        except Exception as e:
            print(f"[Model] Load error: {e}. Using CV heuristics.")

    # ── Inference ───────────────────────────────────────────────────────────────

    def classify(self, crop: np.ndarray) -> Tuple[str, str, float]:
        """
        Classify a grain crop image.
        Returns: (quality_label, grain_type, confidence)
        """
        if self.model is not None:
            return self._torch_classify(crop)
        return self._cv_classify(crop)

    def _torch_classify(self, crop: np.ndarray) -> Tuple[str, str, float]:
        """Run inference with the loaded PyTorch model."""
        import torch
        import torch.nn.functional as F

        rgb = cv2.cvtColor(crop, cv2.COLOR_BGR2RGB)
        tensor = self.transform(rgb).unsqueeze(0)

        with torch.no_grad():
            logits = self.model(tensor)
            probs = F.softmax(logits, dim=1)[0]
            idx = probs.argmax().item()
            conf = probs[idx].item()

        grain_type, quality = self.idx_to_label[idx]
        return quality, grain_type, conf

    def _cv_classify(self, crop: np.ndarray) -> Tuple[str, str, float]:
        """
        Rule-based classifier using color and shape features.
        This deterministic approach mimics what a real model would do
        and produces realistic distributions for demo purposes.
        """
        if crop is None or crop.size == 0:
            return "Normal", "Rice", 0.5

        h, w = crop.shape[:2]

        # ── Feature extraction ──────────────────────────────────────
        # 1. Mean LAB color (perceptual color space)
        lab = cv2.cvtColor(crop, cv2.COLOR_BGR2LAB)
        L, A, B = cv2.split(lab)
        mean_L = float(np.mean(L))
        mean_A = float(np.mean(A))
        mean_B = float(np.mean(B))

        # 2. Mean HSV for saturation
        hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)
        mean_sat = float(np.mean(hsv[:, :, 1]))
        mean_val = float(np.mean(hsv[:, :, 2]))

        # 3. Aspect ratio
        aspect = max(h, w) / (min(h, w) + 1e-6)

        # 4. Brightness std (texture indicator)
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        std_brightness = float(np.std(gray))

        # ── Grain type classification ───────────────────────────────
        # Rice: brighter, less saturated, longer (higher aspect ratio typically)
        # Wheat: more yellowish-brown (higher B in LAB), medium saturation
        wheat_score = (
            (mean_B > 130) * 2 +          # yellowish (B channel in LAB)
            (mean_sat > 20) * 1.5 +        # more colorful
            (mean_L < 180) * 1 +           # darker than rice
            (aspect < 3.5) * 0.5           # wheat is chunkier
        )
        rice_score = (
            (mean_L > 160) * 2 +           # brighter/whiter
            (mean_sat < 25) * 1.5 +        # less saturated
            (aspect >= 2.5) * 1 +          # more elongated
            (mean_B < 135) * 0.5
        )
        grain_type = "Wheat" if wheat_score > rice_score else "Rice"

        # ── Quality classification ──────────────────────────────────
        # Broken: small size relative to typical grain
        typical_area = (35 * 10) if grain_type == "Rice" else (25 * 12)
        actual_area = h * w
        is_small = actual_area < (typical_area * 0.45)

        # Chalky: high brightness with low saturation (chalky white spots)
        is_chalky = mean_L > 185 and mean_sat < 15 and grain_type == "Rice"

        # Discolored: brownish / dark / high A or B deviation
        is_discolored = (
            mean_L < 120 or
            mean_sat > 50 or
            (mean_A > 140 and grain_type == "Rice")
        )

        # Priority: Discolored > Broken > Chalky > Normal
        if is_discolored:
            quality = "Discolored"
            conf = min(0.95, 0.70 + abs(mean_L - 140) / 200)
        elif is_small:
            quality = "Broken"
            conf = min(0.95, 0.65 + (1 - actual_area / typical_area) * 0.3)
        elif is_chalky:
            quality = "Chalky"
            conf = min(0.95, 0.72 + (mean_L - 185) / 100)
        else:
            quality = "Normal"
            conf = min(0.95, 0.75 + std_brightness / 300)

        # Add slight randomness to simulate model uncertainty
        conf = max(0.50, min(0.98, conf + random.gauss(0, 0.03)))

        return quality, grain_type, conf
