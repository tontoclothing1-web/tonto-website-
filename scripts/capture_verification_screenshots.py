import subprocess
import os
import sys

EDGE_PATH = r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
URL = "http://127.0.0.1:3000/"

VIEWPORTS = [
    ("mobile-375", 375, 812),
    ("tablet-768", 768, 1024),
    ("desktop-1440", 1440, 900),
]

out_dir = os.path.abspath("screenshots")
os.makedirs(out_dir, exist_ok=True)

for name, w, h in VIEWPORTS:
    out_file = os.path.join(out_dir, f"{name}.png")
    print(f"Capturing {name} ({w}x{h})...")
    cmd = [
        EDGE_PATH,
        "--headless",
        "--no-sandbox",
        "--disable-gpu",
        f"--window-size={w},{h}",
        f"--screenshot={out_file}",
        URL
    ]
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(out_file):
        print(f"Captured {out_file} ({os.path.getsize(out_file)} bytes)")
    else:
        print(f"Failed to capture {name}: {res.stderr}")

print("All screenshots done.")
