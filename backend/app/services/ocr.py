# app/services/ocr.py — Hybrid OCR pipeline: PyMuPDF → Tesseract → TrOCR
import logging
import os
import re
import unicodedata

import numpy as np

logger = logging.getLogger(__name__)

_PLAINTEXT_EXTS = {
    ".txt", ".md", ".rst", ".py", ".js", ".ts", ".jsx", ".tsx",
    ".java", ".c", ".cpp", ".h", ".cs", ".go", ".rb", ".php",
    ".swift", ".kt", ".rs", ".sh", ".bash", ".yaml", ".yml",
    ".json", ".xml", ".html", ".css", ".sql", ".r", ".m",
}
_IMAGE_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff", ".tif", ".webp"}

# Well-known Tesseract binary locations on Windows
_TESSERACT_PATHS = [
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]

# ── OCR text cleaning ────────────────────────────────────────────────────────

def _clean_ocr_text(text: str) -> str:
    """
    Clean OCR output end-to-end:
    1. NFC Unicode normalization (preserves UTF-8 intent)
    2. Strip non-printable control chars (keep \\n \\r \\t space)
    3. Remove long garbage runs (OCR artefact character sequences)
    4. Collapse excessive whitespace / blank lines
    """
    text = unicodedata.normalize("NFC", text)
    cleaned = []
    for ch in text:
        if ch in ('\n', '\r', '\t', ' '):
            cleaned.append(ch)
        elif ord(ch) < 32 or ord(ch) == 127:
            pass  # control char — drop
        elif unicodedata.category(ch) in ('Cc', 'Cf', 'Cs', 'Co', 'Cn'):
            pass  # format / surrogate / private-use / unassigned — drop
        else:
            cleaned.append(ch)
    text = ''.join(cleaned)
    # Remove runs of 4+ consecutive non-alphanumeric, non-space, non-punctuation chars
    text = re.sub(r'[^\w\s,.!?;:\'"()\[\]{}\-/\\@#%&*+=<>]{4,}', ' ', text)
    text = re.sub(r'[ \t]{3,}', '  ', text)
    text = re.sub(r'\n{4,}', '\n\n\n', text)
    return text.strip()


# ── OCR quality metrics ──────────────────────────────────────────────────────

def _ocr_quality_score(text: str) -> dict:
    """
    Compute text-level OCR quality metrics:
      charConfidence  — % of characters that are alpha or whitespace
      wordConfidence  — % of whitespace-separated tokens that look like real words (≥2 alpha chars)
      ocrQualityScore — combined 0–100 quality estimate
    """
    if not text or not text.strip():
        return {"charConfidence": 0, "wordConfidence": 0, "ocrQualityScore": 0}
    total = len(text)
    alpha_ws = sum(1 for c in text if c.isalpha() or c.isspace())
    char_conf = round(alpha_ws / total * 100)

    tokens = text.split()
    real_words = sum(1 for t in tokens if re.search(r'[a-zA-Z]{2,}', t))
    word_conf = round(real_words / len(tokens) * 100) if tokens else 0

    quality = round(char_conf * 0.5 + word_conf * 0.5)
    return {"charConfidence": char_conf, "wordConfidence": word_conf, "ocrQualityScore": quality}


# ── Lazy singletons ──────────────────────────────────────────────────────────
_trocr_processor = None
_trocr_model     = None
_tesseract_ready = False


def _init_tesseract() -> bool:
    global _tesseract_ready
    if _tesseract_ready:
        return True
    try:
        import pytesseract
        # Find binary
        for p in _TESSERACT_PATHS:
            if os.path.exists(p):
                pytesseract.pytesseract.tesseract_cmd = p
                break
        # Quick smoke test
        from PIL import Image as _I
        _img = _I.new("RGB", (10, 10), (255, 255, 255))
        pytesseract.image_to_string(_img)
        _tesseract_ready = True
        logger.info("[ocr] Tesseract ready")
        return True
    except Exception as exc:
        logger.warning(f"[ocr] Tesseract unavailable: {exc}")
        return False


def _get_trocr():
    global _trocr_processor, _trocr_model
    if _trocr_processor is None:
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel
        logger.info("[ocr] Loading TrOCR handwriting model…")
        _trocr_processor = TrOCRProcessor.from_pretrained("microsoft/trocr-base-handwritten")
        _trocr_model = VisionEncoderDecoderModel.from_pretrained("microsoft/trocr-base-handwritten")
        _trocr_model.eval()
        logger.info("[ocr] TrOCR ready")
    return _trocr_processor, _trocr_model


# ── Image helpers ────────────────────────────────────────────────────────────

def _pdf_page_to_rgb(page) -> np.ndarray:
    pix = page.get_pixmap(dpi=150)
    arr = np.frombuffer(pix.samples, np.uint8).reshape(pix.height, pix.width, pix.n)
    if pix.n == 4:
        return arr[:, :, :3]
    if pix.n == 1:  # grayscale → replicate to RGB
        return np.stack([arr[:, :, 0]] * 3, axis=-1)
    return arr


def _tesseract_on_array(img: np.ndarray) -> tuple[str, float]:
    """Run Tesseract on a numpy RGB array. Returns (text, confidence_pct)."""
    try:
        import pytesseract
        from PIL import Image
        pil = Image.fromarray(img).convert("RGB")
        # PSM 1 = automatic page segmentation with OSD (best for full pages)
        cfg = "--psm 1 --oem 3"
        text = pytesseract.image_to_string(pil, config=cfg)
        # Get per-word confidence to compute average
        try:
            data = pytesseract.image_to_data(
                pil, config=cfg, output_type=pytesseract.Output.DICT
            )
            confs = [int(c) for c in data["conf"] if str(c).lstrip("-").isdigit() and int(c) >= 0]
            avg_conf = sum(confs) / len(confs) if confs else 0.0
        except Exception:
            avg_conf = 80.0 if text.strip() else 0.0
        logger.info(f"[ocr] Tesseract: {len(text.strip())} chars, conf={avg_conf:.1f}%")
        return text.strip(), avg_conf
    except Exception as exc:
        logger.warning(f"[ocr] Tesseract failed: {exc}")
        return "", 0.0


def _trocr_on_array(img: np.ndarray) -> str:
    try:
        import torch
        from PIL import Image
        proc, model = _get_trocr()
        pil = Image.fromarray(img).convert("RGB")
        pv = proc(images=pil, return_tensors="pt").pixel_values
        with torch.no_grad():
            ids = model.generate(pv, max_new_tokens=256)
        return proc.batch_decode(ids, skip_special_tokens=True)[0]
    except Exception as exc:
        logger.warning(f"[ocr] TrOCR failed: {exc}")
        return ""


def _ocr_array(img: np.ndarray, label: str) -> tuple[str, float, str]:
    """
    Try Tesseract first, then TrOCR as fallback.
    Returns (text, confidence_pct, engine_name).
    """
    if _init_tesseract():
        text, conf = _tesseract_on_array(img)
        if text.strip():
            return text, conf, "tesseract"
        logger.info(f"[ocr] {label}: Tesseract returned empty → TrOCR")
    else:
        logger.info(f"[ocr] {label}: Tesseract unavailable → TrOCR")

    trocr = _trocr_on_array(img)
    return trocr, 75.0 if trocr.strip() else 0.0, "trocr"


# ── Main entry point ─────────────────────────────────────────────────────────

def extract_text(doc: dict) -> dict:
    """
    Hybrid OCR. Returns:
      {text, ocrEngine, ocrConfidence, ocrStatus, pagesProcessed, textLength}
    ocrStatus: "SUCCESS" | "LOW_CONFIDENCE" | "FAILED"
    """
    path = doc.get("path", "")
    filename = doc.get("filename", "unknown")

    def _fail(engine="none"):
        return {"text": "", "ocrEngine": engine, "ocrConfidence": 0,
                "ocrStatus": "FAILED", "pagesProcessed": 0, "textLength": 0}

    if not path or not os.path.exists(path):
        logger.error(f"[ocr] File not found: {path}")
        return _fail()

    ext = os.path.splitext(path)[1].lower()

    # ── Plaintext ────────────────────────────────────────────────────────────
    if ext in _PLAINTEXT_EXTS:
        try:
            with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                text = fh.read()
            logger.info(f"[ocr] {filename}: plaintext, {len(text)} chars")
            quality = _ocr_quality_score(text)
            return {"text": text, "ocrEngine": "plaintext", "ocrConfidence": 100,
                    "ocrStatus": "SUCCESS", "pagesProcessed": 1, "textLength": len(text), **quality}
        except Exception as exc:
            logger.error(f"[ocr] Plaintext read failed: {exc}")
            return _fail("plaintext")

    # ── PDF ──────────────────────────────────────────────────────────────────
    if ext == ".pdf":
        import fitz
        try:
            pdf = fitz.open(path)
        except Exception as exc:
            logger.error(f"[ocr] Cannot open PDF: {exc}")
            return _fail()

        n_pages = len(pdf)

        # Stage 1: PyMuPDF digital text layer
        pages_text = [page.get_text() for page in pdf]
        total_chars = sum(len(t) for t in pages_text)

        if total_chars >= 50:
            pdf.close()
            text = "\n".join(pages_text)
            logger.info(f"[ocr] {filename}: PyMuPDF {total_chars} chars")
            quality = _ocr_quality_score(text)
            return {"text": text, "ocrEngine": "pymupdf", "ocrConfidence": 99,
                    "ocrStatus": "SUCCESS", "pagesProcessed": n_pages, "textLength": len(text), **quality}

        logger.info(f"[ocr] {filename}: PyMuPDF only {total_chars} chars → image OCR")

        # Stage 2: Render each page and OCR
        try:
            page_texts, page_engines, page_confs = [], [], []
            for i, page in enumerate(pdf):
                img = _pdf_page_to_rgb(page)
                t, c, eng = _ocr_array(img, f"{filename} p{i+1}")
                logger.info(f"[ocr]   page {i+1}/{n_pages}: {eng} conf={c:.1f}% chars={len(t)}")
                page_texts.append(t)
                page_confs.append(c)
                page_engines.append(eng)

            pdf.close()
            combined  = "\n".join(page_texts).strip()
            avg_conf  = sum(page_confs) / len(page_confs) if page_confs else 0.0
            engine    = "tesseract" if "tesseract" in page_engines else "trocr"

            combined = _clean_ocr_text(combined)
            quality = _ocr_quality_score(combined)
            if len(combined) >= 50:
                if avg_conf < 50 or quality["ocrQualityScore"] < 30:
                    status = "LOW_TEXT_QUALITY" if quality["ocrQualityScore"] < 30 else "LOW_CONFIDENCE"
                else:
                    status = "SUCCESS"
                logger.info(f"[ocr] {filename}: {engine} {len(combined)} chars conf={avg_conf:.1f}% quality={quality['ocrQualityScore']}")
                return {"text": combined, "ocrEngine": engine,
                        "ocrConfidence": round(avg_conf), "ocrStatus": status,
                        "pagesProcessed": n_pages, "textLength": len(combined), **quality}

            if combined:
                return {"text": combined, "ocrEngine": engine,
                        "ocrConfidence": round(avg_conf), "ocrStatus": "LOW_CONFIDENCE",
                        "pagesProcessed": n_pages, "textLength": len(combined), **quality}

        except Exception as exc:
            logger.error(f"[ocr] PDF OCR pipeline failed: {exc}")
            try:
                pdf.close()
            except Exception:
                pass

        return _fail()

    # ── Image files ──────────────────────────────────────────────────────────
    if ext in _IMAGE_EXTS:
        try:
            from PIL import Image
            img_arr = np.array(Image.open(path).convert("RGB"))
        except Exception as exc:
            logger.error(f"[ocr] Cannot open image: {exc}")
            return _fail()

        text, conf, engine = _ocr_array(img_arr, filename)
        text = _clean_ocr_text(text)
        if text.strip():
            quality = _ocr_quality_score(text)
            if conf < 50 or quality["ocrQualityScore"] < 30:
                status = "LOW_TEXT_QUALITY" if quality["ocrQualityScore"] < 30 else "LOW_CONFIDENCE"
            else:
                status = "SUCCESS"
            return {"text": text, "ocrEngine": engine, "ocrConfidence": round(conf),
                    "ocrStatus": status, "pagesProcessed": 1, "textLength": len(text), **quality}

        return _fail()

    # ── Unknown ──────────────────────────────────────────────────────────────
    logger.warning(f"[ocr] Unsupported extension: {ext}")
    return _fail()
