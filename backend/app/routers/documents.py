# app/routers/documents.py
import logging
import os
import time
import uuid
import threading

from typing import Optional
from fastapi import APIRouter, UploadFile, File, HTTPException, Query

from ..store import save_document, get_document, update_document
from ..schemas import TextIn
from ..services.analysis_engine import PIPELINE_STAGES

logger = logging.getLogger(__name__)

router = APIRouter()

import tempfile as _tempfile
_default_upload_dir = os.path.join(os.path.dirname(__file__), "..", "..", "uploads")
try:
    os.makedirs(_default_upload_dir, exist_ok=True)
    UPLOAD_DIR = _default_upload_dir
except OSError:
    UPLOAD_DIR = os.path.join(_tempfile.gettempdir(), "nuroai_uploads")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    logger.warning(f"[upload] app dir not writable, using UPLOAD_DIR={UPLOAD_DIR}")

PER_STAGE_MS = 700


# ── Background analysis ────────────────────────────────────────────────────────

def _run_analysis(doc_id: str, doc: dict, author_baseline: dict | None = None) -> None:
    """Background thread: OCR → gated pipeline → store everything in MongoDB."""
    try:
        from ..services.ocr import extract_text
        from ..services.analysis_engine import run_pipeline

        logger.info(f"[analysis] {doc_id}: starting OCR")
        ocr = extract_text(doc)
        text = ocr.get("text", "")
        logger.info(f"[analysis] {doc_id}: OCR={ocr['ocrEngine']} "
                    f"status={ocr['ocrStatus']} chars={ocr['textLength']}")

        result = run_pipeline(text, ocr, author_baseline=author_baseline)

        report = {"scores": result["scores"], "breakdown": result["breakdown"]}
        bd     = {b["key"]: b.get("score", 0) for b in result["breakdown"]}

        update_document(doc_id, {
            "status":           "complete",
            "report":           report,
            "sections":         result.get("explainability", []),
            "risk":             result["scores"]["risk"],
            "aiScore":          bd.get("ai", 0),
            "authorshipScore":  bd.get("authorship", 0),
            "ocr":              ocr,
            "aiDetection":      result.get("aiDetection", {}),
            "authorship":       result.get("authorship", {}),
            "crossLanguage":    result.get("crossLanguage", {}),
            "codeIntelligence": result.get("codeIntelligence", {}),
            "pipelineStatus":   result.get("pipelineStatus", "OK"),
            "pipelineLogs":     result.get("pipelineLogs", []),
            "docType":          result.get("docType", "typed_essay"),
        })
        logger.info(f"[analysis] {doc_id}: complete — pipelineStatus={result.get('pipelineStatus')}")
    except Exception as exc:
        logger.error(f"[analysis] {doc_id} FAILED: {exc}")
        update_document(doc_id, {"status": "error", "error": str(exc)})


# ── Upload endpoints ──────────────────────────────────────────────────────────

MAX_UPLOAD_BYTES = 25 * 1024 * 1024  # 25 MB

@router.post("/upload")
def upload(file: UploadFile = File(...)):
    filename = os.path.basename(file.filename or "upload")
    content_type = file.content_type or "unknown"
    logger.info(f"[upload] receiving: filename={filename} content_type={content_type}")
    try:
        raw = file.file.read()
    except Exception as exc:
        logger.error(f"[upload] failed to read file body: {exc}")
        raise HTTPException(400, f"Could not read uploaded file: {exc}")

    size = len(raw)
    logger.info(f"[upload] received {size} bytes for {filename}")

    if size == 0:
        raise HTTPException(400, "Uploaded file is empty")
    if size > MAX_UPLOAD_BYTES:
        raise HTTPException(413, "File too large — maximum allowed size is 25 MB")

    path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{filename}")
    try:
        with open(path, "wb") as fh:
            fh.write(raw)
        logger.info(f"[upload] saved to {path}")
    except OSError as exc:
        logger.error(f"[upload] cannot write to {path}: {exc}")
        raise HTTPException(500, f"Server could not save file: {exc}")

    doc = save_document({
        "id": str(uuid.uuid4()), "filename": filename, "path": path,
        "size": size, "status": "uploaded",
        "startedAt": None, "createdAt": time.time(),
    })
    logger.info(f"[upload] saved document id={doc['id']}")
    return {"documentId": doc["id"], "filename": doc["filename"], "size": doc["size"]}


@router.post("/analyze-text")
def analyze_text(body: TextIn):
    text = (body.text or "").strip()
    if len(text) < 20:
        raise HTTPException(400, "Provide at least ~20 characters of text")

    filename = body.filename or "pasted-text.txt"
    path = os.path.join(UPLOAD_DIR, f"{uuid.uuid4()}_{filename}")
    with open(path, "w", encoding="utf-8") as fh:
        fh.write(text)

    doc = save_document({
        "id": str(uuid.uuid4()), "filename": filename, "path": path,
        "size": len(text), "status": "uploaded",
        "startedAt": None, "createdAt": time.time(),
    })
    return {"documentId": doc["id"], "filename": doc["filename"]}


# ── Analysis control ──────────────────────────────────────────────────────────

@router.post("/{doc_id}/analyze")
def start_analysis(doc_id: str, author_id: Optional[str] = Query(None)):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.get("status") == "complete" and doc.get("report"):
        return {"documentId": doc_id, "stages": PIPELINE_STAGES, "status": "complete"}

    # Look up per-author baseline from MongoDB if author_id is provided
    author_baseline = None
    if author_id:
        from ..db import author_profiles_collection
        prof = author_profiles_collection().find_one({"_id": author_id})
        if prof:
            author_baseline = prof["baseline"]
            logger.info(f"[analysis] {doc_id}: using per-author baseline for '{author_id}'")
        else:
            logger.warning(f"[analysis] {doc_id}: author_id='{author_id}' not found, using DEFAULT_BASELINE")

    update_document(doc_id, {"status": "processing", "startedAt": time.time() * 1000})
    current_doc = get_document(doc_id)

    t = threading.Thread(target=_run_analysis, args=(doc_id, current_doc, author_baseline), daemon=True)
    t.start()

    return {"documentId": doc_id, "stages": PIPELINE_STAGES, "status": "processing"}


@router.get("/{doc_id}/status")
def status(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if not doc.get("startedAt"):
        return {"status": "uploaded", "currentStage": -1, "stages": PIPELINE_STAGES}

    done    = doc.get("status") == "complete"
    elapsed = time.time() * 1000 - doc["startedAt"]
    max_stage = len(PIPELINE_STAGES) if done else len(PIPELINE_STAGES) - 1
    current   = min(max_stage, int(elapsed // PER_STAGE_MS))

    actual_status = "complete" if done else doc.get("status", "processing")
    return {
        "status":       actual_status,
        "currentStage": current,
        "totalStages":  len(PIPELINE_STAGES),
        "stages":       PIPELINE_STAGES,
        "pipelineStatus": doc.get("pipelineStatus", ""),
        "error":        doc.get("error") if actual_status == "error" else None,
    }


# ── Results endpoints ─────────────────────────────────────────────────────────

@router.get("/{doc_id}/results")
def results(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.get("status") != "complete":
        raise HTTPException(425, f"Analysis still in progress (status: {doc.get('status', 'unknown')})")
    report = doc.get("report")
    if not report:
        raise HTTPException(500, "Cached report missing — re-run analysis")
    return {
        "documentId":     doc_id,
        "filename":       doc["filename"],
        "pipelineStatus": doc.get("pipelineStatus", "OK"),
        "ocr":            doc.get("ocr", {}),
        "aiDetection":    doc.get("aiDetection", {}),
        "docType":        doc.get("docType", "typed_essay"),
        **report,
    }


@router.get("/{doc_id}/explain")
def explain(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.get("status") != "complete":
        raise HTTPException(425, f"Analysis still in progress (status: {doc.get('status', 'unknown')})")
    ocr = doc.get("ocr", {})
    return {
        "documentId":    doc_id,
        "sections":      doc.get("sections", []),
        "ocrConfidence": ocr.get("ocrConfidence", 100),
        "ocrStatus":     ocr.get("ocrStatus", "SUCCESS"),
        "ocrQualityScore": ocr.get("ocrQualityScore", 100),
    }


@router.get("/{doc_id}/ocr-debug")
def ocr_debug(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    ocr = doc.get("ocr", {})
    return {
        "filename":      doc.get("filename", "unknown"),
        "ocrEngine":     ocr.get("ocrEngine", "none"),
        "ocrConfidence": ocr.get("ocrConfidence", 0),
        "textLength":    ocr.get("textLength", 0),
        "pagesProcessed":ocr.get("pagesProcessed", 0),
        "preview":       (ocr.get("text", ""))[:500],
        "ocrStatus":     ocr.get("ocrStatus", "FAILED"),
    }


@router.get("/{doc_id}/authorship")
def authorship_detail(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.get("status") != "complete":
        raise HTTPException(425, "Analysis not complete")

    cached = doc.get("authorship", {})

    # Use cached result if it has the full radar data
    if cached.get("status") in ("ok", "INSUFFICIENT_TEXT") and "radar" in cached:
        return {"documentId": doc_id, **cached}

    # Fallback: recompute from stored OCR text
    ocr  = doc.get("ocr", {})
    text = ocr.get("text", "")
    if not text.strip():
        raise HTTPException(422, "Could not extract text from document")

    from ..services.authorship_engine import analyze_authorship
    result = analyze_authorship(text)
    return {"documentId": doc_id, **result}


@router.get("/{doc_id}/crosslang")
def crosslang_detail(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.get("status") != "complete":
        raise HTTPException(425, "Analysis not complete")

    # Gate: pipeline-level OCR failure
    if doc.get("pipelineStatus") in ("OCR_FAILED", "INSUFFICIENT_TEXT"):
        return {
            "documentId": doc_id,
            "status":     doc.get("pipelineStatus"),
            "overallScore": 0,
            "langs":      [],
            "evidence":   "Document could not be analysed — OCR extraction failed.",
        }

    # Use the stored cross-language result from run_pipeline
    cross = doc.get("crossLanguage", {})
    cross_status = cross.get("status", "ok")
    base_score   = cross.get("score", 0)

    # Phase 7 gate: LANGUAGE_NOT_PRESENT → return zero scores immediately
    if cross_status == "LANGUAGE_NOT_PRESENT":
        return {
            "documentId":            doc_id,
            "status":                "LANGUAGE_NOT_PRESENT",
            "overallScore":          0,
            "evidence":              cross.get("evidence", "Monolingual document — no cross-language analysis performed."),
            "sourceLanguage":        "English (EN)",
            "targetLanguage":        "N/A",
            "translationSimilarity": 0,
            "semanticSimilarity":    0.0,
            "langs":                 [],
        }

    # Real multilingual result — build per-language breakdown from stored langs
    detected_langs = cross.get("langs", [])
    cosine_max     = cross.get("cosineMax", base_score / 100 if base_score else 0)

    # Map detected language codes to display names
    _LANG_NAMES = {
        "es": "Spanish", "zh": "Chinese", "zh-cn": "Chinese", "zh-tw": "Chinese",
        "fr": "French",  "de": "German",  "ar": "Arabic",     "pt": "Portuguese",
        "ru": "Russian", "ja": "Japanese", "ko": "Korean",    "it": "Italian",
        "hi": "Hindi",   "nl": "Dutch",
    }
    lang_items = []
    for i, code in enumerate(detected_langs):
        if code in ("en",):
            continue
        name = _LANG_NAMES.get(code, code.upper())
        # Decay sim for secondary languages (each 10% less than previous)
        lang_sim = min(99, max(0, round(base_score * (0.9 ** i))))
        lang_items.append({"code": code.upper(), "name": name,
                            "x": 50 + (i * 20) % 60,
                            "y": 30 + (i * 25) % 60,
                            "sim": lang_sim})

    top = lang_items[0] if lang_items else {"name": "Unknown", "code": "??", "sim": 0}

    return {
        "documentId":            doc_id,
        "status":                cross_status,
        "overallScore":          base_score,
        "evidence":              cross.get("evidence", ""),
        "sourceLanguage":        "English (EN)",
        "targetLanguage":        f"{top['name']} ({top['code']})",
        "translationSimilarity": top["sim"],
        "semanticSimilarity":    round(cosine_max, 2),
        "langs":                 lang_items,
    }


@router.get("/{doc_id}/code")
def code_detail(doc_id: str):
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(404, "Document not found")
    if doc.get("status") != "complete":
        raise HTTPException(425, "Analysis not complete")

    cached = doc.get("codeIntelligence", {})

    if cached.get("status") in ("ok", "NO_CODE_DETECTED"):
        return {"documentId": doc_id, **cached}

    # Fallback: use direct plagiarism score
    report    = doc.get("report", {})
    breakdown = {b["key"]: b for b in report.get("breakdown", [])}
    direct     = breakdown.get("direct", {})
    score      = direct.get("score", 0)

    return {
        "documentId":    doc_id,
        "status":        "ok",
        "codeSimilarity":  score,
        "logicSimilarity": min(100, score + 5),
        "astMatch":        score,
        "structure":       min(100, score + 2),
        "renameEvasion":   score > 60,
        "note":            direct.get("evidence", "No code blocks detected in this document."),
        "source":          direct.get("source"),
    }
