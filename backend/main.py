"""
Grain Quality Analysis System - FastAPI Backend
Supports Rice and Wheat analysis via upload, scanner, or mobile camera
"""

import os
import uuid
import json
import time
import asyncio
import base64
from pathlib import Path
from datetime import datetime
from typing import Optional, List

import cv2
import numpy as np
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from processing import GrainProcessor
from model import GrainClassifier
from scanner import ScannerWatcher

# ── App setup ──────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Grain Quality Analysis API",
    description="AI-powered grain quality analysis for Rice and Wheat",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Directories
UPLOAD_DIR = Path("uploads")
SCANNER_DIR = Path("scanner_watch")
RESULTS_DIR = Path("results")
ANNOTATED_DIR = Path("annotated")

for d in [UPLOAD_DIR, SCANNER_DIR, RESULTS_DIR, ANNOTATED_DIR]:
    d.mkdir(exist_ok=True)

# Mount static dirs
app.mount("/annotated", StaticFiles(directory="annotated"), name="annotated")

# ── Globals ────────────────────────────────────────────────────────────────────
processor = GrainProcessor()
classifier = GrainClassifier()
scanner_watcher = ScannerWatcher(str(SCANNER_DIR))
latest_scan_result: Optional[dict] = None
scan_active = False


# ── Helper ─────────────────────────────────────────────────────────────────────
def process_image_bytes(image_bytes: bytes, source: str = "upload") -> dict:
    """Core pipeline: bytes → analysis result dict."""
    # Decode image
    nparr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Cannot decode image")

    # Process and segment grains
    segments = processor.segment_grains(img)

    # Classify each grain
    classifications = []
    for seg in segments:
        crop = seg["crop"]
        label, grain_type, confidence = classifier.classify(crop)
        classifications.append({
            "bbox": seg["bbox"],
            "area": seg["area"],
            "width": seg["width"],
            "height": seg["height"],
            "quality": label,
            "grain_type": grain_type,
            "confidence": round(confidence, 3),
        })

    # Aggregate results
    total = len(classifications)
    quality_counts = {"Normal": 0, "Broken": 0, "Chalky": 0, "Discolored": 0}
    type_counts = {"Rice": 0, "Wheat": 0}
    widths, heights = [], []

    for c in classifications:
        quality_counts[c["quality"]] = quality_counts.get(c["quality"], 0) + 1
        type_counts[c["grain_type"]] = type_counts.get(c["grain_type"], 0) + 1
        widths.append(c["width"])
        heights.append(c["height"])

    dominant_type = max(type_counts, key=type_counts.get) if total > 0 else "Unknown"

    quality_pct = {
        k: round(v / total * 100, 1) if total > 0 else 0
        for k, v in quality_counts.items()
    }

    avg_width = round(np.mean(widths), 1) if widths else 0
    avg_height = round(np.mean(heights), 1) if heights else 0

    # Generate annotated image
    result_id = str(uuid.uuid4())[:8]
    annotated_path = str(ANNOTATED_DIR / f"{result_id}.jpg")
    annotated_img = processor.draw_annotations(img, segments, classifications)
    cv2.imwrite(annotated_path, annotated_img)

    # Encode annotated image as base64
    _, buf = cv2.imencode(".jpg", annotated_img)
    annotated_b64 = base64.b64encode(buf.tobytes()).decode()

    return {
        "id": result_id,
        "source": source,
        "timestamp": datetime.utcnow().isoformat(),
        "grain_type": dominant_type,
        "total_grains": total,
        "img_width": img.shape[1],
        "img_height": img.shape[0],
        "type_counts": type_counts,
        "quality_counts": quality_counts,
        "quality_percentages": quality_pct,
        "avg_grain_width_px": avg_width,
        "avg_grain_height_px": avg_height,
        "grains": classifications,
        "annotated_image": f"data:image/jpeg;base64,{annotated_b64}",
        "annotated_url": f"/annotated/{result_id}.jpg",
    }


# ── Endpoints ──────────────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "Grain Analysis API running", "version": "1.0.0"}


@app.get("/health")
def health():
    return {"status": "ok", "scanner_active": scan_active}


@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """Accept manual image upload and analyze it."""
    if not file.content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    contents = await file.read()
    try:
        result = process_image_bytes(contents, source="upload")
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(500, f"Analysis failed: {str(e)}")


@app.post("/upload-batch")
async def upload_batch(files: List[UploadFile] = File(...)):
    """Accept multiple image uploads and analyze each."""
    results = []
    for file in files:
        if not file.content_type.startswith("image/"):
            continue
        
        contents = await file.read()
        try:
            result = process_image_bytes(contents, source="batch-upload")
            result["filename"] = file.filename
            results.append(result)
        except Exception as e:
            results.append({"filename": file.filename, "error": str(e)})
            
    return JSONResponse(content={"batch_id": str(uuid.uuid4())[:8], "results": results})


@app.post("/scanner-input")
async def scanner_input(file: Optional[UploadFile] = File(None)):
    """
    Accept image from hardware scanner via HTTP POST.
    If no file provided, tries to auto-read from scanner watch folder.
    """
    global latest_scan_result

    if file:
        contents = await file.read()
    else:
        # Auto-read latest from watch folder
        contents = scanner_watcher.get_latest_image_bytes()
        if contents is None:
            raise HTTPException(404, "No scanner image available")

    try:
        result = process_image_bytes(contents, source="scanner")
        latest_scan_result = result
        return JSONResponse(content=result)
    except Exception as e:
        raise HTTPException(500, f"Scanner analysis failed: {str(e)}")


@app.get("/scanner-status")
def scanner_status():
    """Return current scanner mode status and latest result."""
    return {
        "active": scan_active,
        "has_result": latest_scan_result is not None,
        "latest_result": latest_scan_result,
    }


@app.post("/scanner-start")
async def scanner_start(background_tasks: BackgroundTasks):
    """Start live scanner polling mode."""
    global scan_active
    scan_active = True
    background_tasks.add_task(run_scanner_loop)
    return {"status": "Scanner started", "watch_dir": str(SCANNER_DIR)}


@app.post("/scanner-stop")
def scanner_stop():
    """Stop live scanner polling."""
    global scan_active
    scan_active = False
    return {"status": "Scanner stopped"}


@app.post("/simulate-scan")
async def simulate_scan():
    """
    Simulate a hardware scanner by generating a synthetic grain image
    and processing it — useful for demos without real hardware.
    """
    global latest_scan_result
    img = processor.generate_synthetic_grain_image()
    _, buf = cv2.imencode(".jpg", img)
    contents = buf.tobytes()
    result = process_image_bytes(contents, source="scanner-simulated")
    latest_scan_result = result
    return JSONResponse(content=result)


@app.get("/results/{result_id}")
def get_result(result_id: str):
    """Return a specific result by ID (if cached)."""
    path = RESULTS_DIR / f"{result_id}.json"
    if not path.exists():
        raise HTTPException(404, "Result not found")
    return JSONResponse(content=json.loads(path.read_text()))


# ── Background scanner loop ────────────────────────────────────────────────────

async def run_scanner_loop():
    """Poll scanner watch folder for new images every 3 seconds."""
    global latest_scan_result, scan_active
    last_seen = None

    while scan_active:
        path = scanner_watcher.get_latest_image_path()
        if path and path != last_seen:
            last_seen = path
            contents = Path(path).read_bytes()
            try:
                result = process_image_bytes(contents, source="scanner-live")
                latest_scan_result = result
            except Exception as e:
                print(f"Scanner loop error: {e}")
        await asyncio.sleep(3)
