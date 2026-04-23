"""
Scanner Integration Module
Watches a folder for new images (simulates USB/WiFi hardware scanner).
In production, the scanner writes captured images to a shared folder.
"""

import os
import time
from pathlib import Path
from typing import Optional


class ScannerWatcher:
    """
    Watches a directory for new images dropped by a hardware scanner.

    Hardware scanner integration options:
    1. USB mode: Scanner saves images to a shared folder → this class watches it
    2. WiFi mode: Scanner POSTs image to /scanner-input endpoint directly
    3. Polling mode: This watcher polls folder every N seconds

    Supported image formats: .jpg, .jpeg, .png, .bmp, .tiff
    """

    SUPPORTED_EXT = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif"}

    def __init__(self, watch_dir: str, poll_interval: float = 3.0):
        self.watch_dir = Path(watch_dir)
        self.watch_dir.mkdir(parents=True, exist_ok=True)
        self.poll_interval = poll_interval
        self._last_processed: Optional[str] = None

    def get_latest_image_path(self) -> Optional[str]:
        """Return path of the most recently modified image in the watch dir."""
        images = [
            f for f in self.watch_dir.iterdir()
            if f.suffix.lower() in self.SUPPORTED_EXT and f.is_file()
        ]
        if not images:
            return None

        # Sort by modification time, newest first
        images.sort(key=lambda f: f.stat().st_mtime, reverse=True)
        return str(images[0])

    def get_latest_image_bytes(self) -> Optional[bytes]:
        """Return raw bytes of the most recently modified image."""
        path = self.get_latest_image_path()
        if path is None:
            return None
        try:
            return Path(path).read_bytes()
        except IOError:
            return None

    def has_new_image(self) -> bool:
        """Check if there's a new image since last processed."""
        path = self.get_latest_image_path()
        return path is not None and path != self._last_processed

    def mark_processed(self):
        """Mark the current latest image as processed."""
        self._last_processed = self.get_latest_image_path()

    def list_images(self):
        """List all images in the watch directory with metadata."""
        images = []
        for f in self.watch_dir.iterdir():
            if f.suffix.lower() in self.SUPPORTED_EXT and f.is_file():
                stat = f.stat()
                images.append({
                    "name": f.name,
                    "path": str(f),
                    "size_kb": round(stat.st_size / 1024, 1),
                    "modified": stat.st_mtime,
                })
        images.sort(key=lambda x: x["modified"], reverse=True)
        return images


"""
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
HARDWARE SCANNER SETUP GUIDE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Option 1: USB Scanner (folder watch)
  - Connect scanner via USB
  - Configure scanner software to save images to: ./scanner_watch/
  - System auto-detects new files every 3 seconds
  - Click "Start Live Scan" in UI to begin

Option 2: WiFi/Network Scanner (HTTP POST)
  - Configure scanner to POST images to:
    POST http://<server-ip>:8000/scanner-input
    Content-Type: multipart/form-data
    Field name: file
  - No additional setup needed

Option 3: Manual Simulation (for testing)
  - Copy any grain image to ./scanner_watch/ folder
  - OR use the "Simulate Scan" button in UI
  - System processes it automatically

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""
