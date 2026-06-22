"""Quick diagnostic: can PaddleOCR process an image without crashing?"""
import sys, os, tempfile
import numpy as np
from PIL import Image, ImageDraw, ImageFont

print("Creating test image...")
W, H = 800, 200
img  = Image.new("RGB", (W, H), color=(255, 255, 255))
draw = ImageDraw.Draw(img)
try:
    font = ImageFont.load_default(size=48)
except TypeError:
    font = ImageFont.load_default()
draw.text((20, 60), "Hello World OCR Test Line", fill=(0, 0, 0), font=font)

with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
    tmp_path = tmp.name
img.save(tmp_path)
print(f"Saved temp file: {tmp_path}")

print("Importing PaddleOCR...")
try:
    from paddleocr import PaddleOCR
    print("PaddleOCR imported OK")
except Exception as e:
    print(f"IMPORT FAILED: {e}")
    sys.exit(1)

print("Initialising PaddleOCR...")
try:
    ocr = PaddleOCR(lang="en", show_log=False)
    print("PaddleOCR init OK")
except Exception as e:
    print(f"INIT FAILED: {e}")
    sys.exit(1)

print("Running OCR on temp file...")
try:
    result = ocr.ocr(tmp_path, cls=True)
    print(f"OCR result type: {type(result)}")
    print(f"OCR result: {result}")
except TypeError:
    try:
        result = ocr.ocr(tmp_path)
        print(f"OCR result (no cls): {result}")
    except Exception as e2:
        print(f"OCR FAILED: {e2}")
except Exception as e:
    print(f"OCR FAILED: {e}")
finally:
    try:
        os.unlink(tmp_path)
    except Exception:
        pass

print("Diagnostic complete")
