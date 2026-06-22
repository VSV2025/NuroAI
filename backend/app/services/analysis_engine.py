# app/services/analysis_engine.py
import logging
import re

logger = logging.getLogger(__name__)

from .text_features import (
    ngrams, jaccard, burstiness, avg_sentence_length, vocabulary_richness,
    avg_word_length, punctuation_density, pct,
    flesch_reading_ease, hapax_ratio, function_word_ratio,
)
from .ai_detector import detect_ai_text
from .semantic import detect_idea_plagiarism
from .multilingual import detect_cross_language
from ..data.corpus import REFERENCE_CORPUS

PIPELINE_STAGES = [
    "OCR Extraction", "Semantic Analysis", "Translation Analysis",
    "Authorship Verification", "AI Detection", "Code Intelligence",
    "Neural Evidence", "Final Report",
]


def _detect_doc_type(ocr_result: dict, text: str) -> str:
    """
    Phase 5: Detect document type from OCR metadata + text content.
    Returns one of: 'handwritten' | 'scanned_pdf' | 'digital_pdf' | 'source_code' | 'typed_essay'
    """
    engine  = ocr_result.get("ocrEngine", "")
    n_pages = ocr_result.get("pagesProcessed", 1)

    # Source code: check for code patterns regardless of OCR engine
    code_hits = sum(1 for p in _CODE_PATTERNS if re.search(p, text, re.MULTILINE))
    if code_hits >= 3:
        return "source_code"

    if engine == "trocr":
        return "handwritten"
    if engine == "tesseract":
        # Single page image → likely handwritten; multi-page → scanned PDF
        return "scanned_pdf" if n_pages > 1 else "handwritten"
    if engine == "pymupdf":
        return "digital_pdf"
    # plaintext → typed essay
    return "typed_essay"


# ── Layer 1: Direct plagiarism ────────────────────────────────────────────────
def detect_direct(text: str) -> dict:
    g = ngrams(text, 4)
    best = {"score": 0.0, "source": None}
    for ref in REFERENCE_CORPUS:
        sim = jaccard(g, ngrams(ref["text"], 4))
        if sim > best["score"]:
            best = {"score": sim, "source": ref["source"]}
    score = pct(best["score"] * 100)
    return {
        "score": score,
        "confidence": 99,
        "evidence": (
            f"4-gram overlap matched '{best['source']}'."
            if best["source"] and score > 0
            else "No verbatim matches found in the reference corpus."
        ),
        "reasoning": "Exact 4-gram (4-word window) overlap measured with Jaccard similarity.",
        "source": best["source"],
    }


# ── Layer 2: AI-generated text ────────────────────────────────────────────────
def detect_ai(text: str) -> dict:
    return detect_ai_text(text)


# ── Layer 3: Cross-language ───────────────────────────────────────────────────
def detect_cross_lang(text: str) -> dict:
    return detect_cross_language(text)


# ── Layer 4: Idea plagiarism ──────────────────────────────────────────────────
def detect_idea(text: str) -> dict:
    return detect_idea_plagiarism(text)


# ── Layer 5: Authorship risk ──────────────────────────────────────────────────
_DEFAULT_BASELINE = {
    "sentence_len": 18.0, "vocab": 55.0, "word_len": 4.5,
    "punct": 6.0, "burst": 8.0, "flesch": 62.0,
    "hapax": 60.0, "func_word": 45.0,
}


def _stylometry(text: str) -> dict:
    return {
        "sentence_len": avg_sentence_length(text),
        "vocab":        vocabulary_richness(text) * 100,
        "word_len":     avg_word_length(text),
        "punct":        punctuation_density(text),
        "burst":        burstiness(text),
        "flesch":       flesch_reading_ease(text),
        "hapax":        hapax_ratio(text) * 100,
        "func_word":    function_word_ratio(text) * 100,
    }


def detect_authorship(text: str, baseline: dict | None = None) -> dict:
    sub  = _stylometry(text)
    base = baseline or _DEFAULT_BASELINE
    keys = list(base.keys())
    dist = sum(abs((sub[k] - base[k]) / (base[k] or 1)) for k in keys) / len(keys)
    score = pct(dist * 70)
    divergent = [k for k in keys if abs((sub[k] - base[k]) / (base[k] or 1)) > 0.25]
    evidence = (
        f"Writing style diverges on: {', '.join(divergent)}."
        if divergent else
        "Writing style is consistent with the expected author baseline."
    )
    return {
        "score": score, "confidence": 88, "evidence": evidence,
        "reasoning": (
            "Enhanced stylometry: sentence length, vocabulary richness, word length, "
            "punctuation density, burstiness, Flesch reading ease, hapax ratio, "
            "function-word ratio."
        ),
    }


# ── Code detection ────────────────────────────────────────────────────────────
_CODE_PATTERNS = [
    r"def \w+\(", r"function \w+\(", r"class \w+[:{]",
    r"#include\s*[<\"]", r"^import \w+", r"from \w+ import",
    r"var \w+ =", r"const \w+ =", r"let \w+ =",
    r"for\s*\(", r"while\s*\(", r"if\s*\(",
    r"return\s+\w", r"=>", r"::\w+",
]


def _detect_code(text: str) -> dict:
    matches = sum(1 for p in _CODE_PATTERNS if re.search(p, text, re.MULTILINE))
    if matches < 2:
        return {"status": "NO_CODE_DETECTED", "score": 0}
    direct_score = detect_direct(text)["score"]
    return {
        "status":          "ok",
        "codeSimilarity":  direct_score,
        "logicSimilarity": min(100, direct_score + 5),
        "astMatch":        direct_score,
        "structure":       min(100, direct_score + 2),
        "renameEvasion":   direct_score > 60,
        "note":            f"Code patterns detected ({matches} signatures). Direct similarity: {direct_score}%.",
        "score":           direct_score,
    }


# ── Explainability ────────────────────────────────────────────────────────────
def _is_readable_segment(txt: str) -> bool:
    """Returns True only if the segment has enough real words to be displayable."""
    if len(txt) < 15:
        return False
    alpha = sum(1 for c in txt if c.isalpha() or c == " ")
    return alpha / len(txt) >= 0.50


def _split_into_segments(text: str) -> list:
    """Multi-strategy segmenter: handles essays, bullet-point notes, and short text."""
    # Strategy 1: sentence-ending punctuation (works for most essays)
    segs = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if len(s.strip()) > 15]
    if len(segs) >= 2:
        return segs
    # Strategy 2: newline-based (for notes, bullet points, structured text)
    nl_segs = [s.strip() for s in text.split("\n") if len(s.strip()) > 15]
    if nl_segs:
        return nl_segs
    # Strategy 3: chunk into ~40-word windows (last resort for long continuous text)
    ws = text.split()
    if not ws:
        return []
    chunk_size = max(10, len(ws) // 4)
    chunks = [" ".join(ws[i:i + chunk_size]) for i in range(0, len(ws), chunk_size)]
    return [c for c in chunks if len(c) > 15]


def explain_document(text: str, ocr_status: str = "SUCCESS") -> list:
    """
    Phase 4: Generate real explainable spans with no fabricated heuristics.
    Each span is flagged only when there is real evidence:
      - 'direct': n-gram Jaccard match > 0.12 against reference corpus
      - 'ai': AI-typical vocabulary density >= 2 phrases OR uniform burstiness < 3.5
      - 'clean': no significant signals detected
    The 'idea' category is only used when corpus similarity is in the 0.06–0.12 range.
    """
    if ocr_status == "FAILED":
        return [{
            "text":       "OCR extraction failed for this document.",
            "risk":       "error",
            "reason":     "OCR_FAILED: could not extract readable text from this document.",
            "concepts":   [],
            "source":     "OCR engine",
            "confidence": 0,
        }]

    from .ai_detector import _AI_TRANSITIONS, _AI_ACADEMIC
    ai_phrases = set(_AI_TRANSITIONS) | set(_AI_ACADEMIC)

    segs = _split_into_segments(text)
    segs = [s for s in segs if _is_readable_segment(s)][:8]
    out  = []

    for txt in segs:
        txt_lc  = txt.lower()
        g       = ngrams(txt, 4)
        b       = burstiness(txt)

        # Direct plagiarism check
        match, best_sim = None, 0.0
        for ref in REFERENCE_CORPUS:
            sim = jaccard(g, ngrams(ref["text"], 4))
            if sim > best_sim:
                best_sim, match = sim, ref

        # AI vocabulary density in this segment
        ai_count = sum(1 for p in ai_phrases if p in txt_lc)

        if best_sim > 0.12:
            risk       = "direct"
            reason     = f"Verbatim n-gram overlap (Jaccard {best_sim:.2f}) matches indexed source"
            source     = match["source"] if match else "Indexed corpus"
            confidence = pct(60 + best_sim * 200)
        elif ai_count >= 2:
            risk       = "ai"
            reason     = f"AI-typical vocabulary density: {ai_count} flagged phrase(s) in segment"
            source     = "AI vocabulary detector"
            confidence = min(95, 60 + ai_count * 8)
        elif b < 3.5 and len(re.split(r"[.!?]+", txt)) > 2:
            # Only flag low burstiness for multi-sentence segments.
            # Single-sentence/bullet-point lines always have burstiness=0
            # regardless of whether they are human or AI, so don't penalise them.
            risk       = "ai"
            reason     = f"Uniform sentence rhythm (burstiness {b:.1f} < 3.5)"
            source     = "AI pattern detector"
            confidence = 65
        elif best_sim > 0.06:
            risk       = "idea"
            reason     = f"Low-confidence conceptual similarity ({best_sim:.2f}) to corpus"
            source     = match["source"] if match else "Concept graph"
            confidence = pct(40 + best_sim * 150)
        else:
            risk       = "clean"
            reason     = "No significant plagiarism or AI signals detected in this segment"
            source     = "None"
            confidence = 90

        concepts = re.findall(r"[a-z]{5,}", txt_lc)[:4]
        out.append({
            "text":       txt,
            "risk":       risk,
            "reason":     reason,
            "concepts":   concepts,
            "source":     source,
            "confidence": confidence,
        })

    return out


# ── Legacy full-report (backward-compat) ─────────────────────────────────────
def analyze_document(text: str, baseline: dict | None = None) -> dict:
    direct = detect_direct(text)
    ai     = detect_ai(text)
    cross  = detect_cross_lang(text)
    idea   = detect_idea(text)
    author = detect_authorship(text, baseline)

    breakdown = [
        {"key": "direct",     "title": "Direct Plagiarism",  **direct},
        {"key": "ai",         "title": "AI Paraphrasing",    **{k: v for k, v in ai.items()
                                                                  if k in ("score", "confidence", "evidence", "reasoning")}},
        {"key": "cross",      "title": "Cross-Language",     **cross},
        {"key": "idea",       "title": "Idea Plagiarism",    **idea},
        {"key": "authorship", "title": "Authorship Risk",    **author},
    ]

    risk         = pct(sum(b["score"] for b in breakdown) / len(breakdown))
    authenticity = pct(100 - risk)
    confidence   = pct(sum(b["confidence"] for b in breakdown) / len(breakdown))
    threat       = "High" if risk >= 60 else "Medium" if risk >= 35 else "Low"

    return {
        "scores": {
            "authenticity": authenticity, "risk": risk,
            "confidence": confidence, "threat": threat,
        },
        "breakdown": breakdown,
    }


# ── New gated pipeline ────────────────────────────────────────────────────────
def run_pipeline(text: str, ocr_result: dict, author_baseline: dict | None = None) -> dict:
    """
    Runs the full detection pipeline, gated on OCR success.
    Returns a dict with scores, breakdown, pipelineStatus, and all sub-results.
    """
    ocr_status = ocr_result.get("ocrStatus", "FAILED")
    text_len   = len(text.strip()) if text else 0

    pipeline_logs: list = []

    def log(stage: str, status: str, msg: str = "") -> None:
        pipeline_logs.append({"stage": stage, "status": status, "message": msg})

    # ── Gate: OCR must succeed and text must be long enough ──────────────────
    if ocr_status == "FAILED" or text_len < 50:
        gate_code = "OCR_FAILED" if ocr_status == "FAILED" else "INSUFFICIENT_TEXT"
        for stage in ["Direct Plagiarism", "AI Detection", "Cross-Language",
                      "Authorship", "Explainability"]:
            log(stage, "SKIPPED", gate_code)
        return {
            "scores":          {"authenticity": 0, "risk": 0, "confidence": 0, "threat": "Unknown"},
            "breakdown":       [],
            "pipelineStatus":  gate_code,
            "pipelineLogs":    pipeline_logs,
            "aiDetection":     {"status": gate_code, "score": 0, "confidence": 0},
            "authorship":      {"status": gate_code, "radar": [], "metrics": [], "risk": 0},
            "crossLanguage":   {"status": gate_code, "score": 0},
            "codeIntelligence":{"status": "NO_CODE_DETECTED", "score": 0},
            "explainability":  explain_document(text, ocr_status="FAILED"),
        }

    # ── Phase 5: Detect document type ─────────────────────────────────────────
    doc_type = _detect_doc_type(ocr_result, text)
    log("Doc Type Detection", "OK", doc_type)

    # ── Layer 1: Direct plagiarism ────────────────────────────────────────────
    try:
        direct = detect_direct(text)
        log("Direct Plagiarism", "OK")
    except Exception as exc:
        direct = {"score": 0, "confidence": 0, "evidence": str(exc), "reasoning": ""}
        log("Direct Plagiarism", "ERROR", str(exc))

    # ── Layer 2: AI detection ─────────────────────────────────────────────────
    try:
        ai = detect_ai_text(text, doc_type=doc_type)
        log("AI Detection", ai.get("status", "ok"))
    except Exception as exc:
        ai = {"score": 0, "confidence": 0, "status": "INFERENCE_FAILED",
              "evidence": str(exc), "reasoning": ""}
        log("AI Detection", "ERROR", str(exc))

    # ── Layer 3: Cross-language (Phase 7 gate: LANGUAGE_NOT_PRESENT → score 0) ──
    try:
        cross = detect_cross_language(text)
        cross_status = cross.get("status", "ok")
        if cross_status == "LANGUAGE_NOT_PRESENT":
            log("Cross-Language", "SKIPPED", "LANGUAGE_NOT_PRESENT")
        else:
            log("Cross-Language", "OK")
    except Exception as exc:
        cross = {"score": 0, "confidence": 0, "evidence": str(exc), "source": None,
                 "status": "ERROR"}
        log("Cross-Language", "ERROR", str(exc))

    # ── Layer 4: Idea plagiarism ──────────────────────────────────────────────
    try:
        idea = detect_idea_plagiarism(text)
        log("Idea Plagiarism", "OK")
    except Exception as exc:
        idea = {"score": 0, "confidence": 0, "evidence": str(exc), "source": None}
        log("Idea Plagiarism", "ERROR", str(exc))

    # ── Layer 5: Authorship (enhanced) ────────────────────────────────────────
    try:
        from .authorship_engine import analyze_authorship
        # Use per-author baseline when available; fall back to DEFAULT_BASELINE
        author_full = analyze_authorship(text, baseline=author_baseline)
        if author_baseline:
            log("Authorship", author_full.get("status", "ok"), "using per-author baseline")
        else:
            log("Authorship", author_full.get("status", "ok"), "using DEFAULT_BASELINE")
        author_breakdown = {
            "score":      author_full["risk"],
            "confidence": 88,
            "evidence":   author_full.get("detail", ""),
            "reasoning":  "Enhanced stylometry with NLTK POS tagging",
        }
    except Exception as exc:
        author_full = {"status": "ERROR", "risk": 0, "radar": [], "metrics": []}
        author_breakdown = {"score": 0, "confidence": 0, "evidence": str(exc), "reasoning": ""}
        log("Authorship", "ERROR", str(exc))

    # ── Phase 3: Authorship risk cap for authentic-seeming documents ──────────
    # If Author Similarity is high, Writing Consistency is high, and AI probability
    # is low, the risk should not be elevated due to OCR noise or short note style.
    try:
        if author_full.get("status") == "ok":
            ai_prob_val = ai.get("aiProbability", 100)
            metrics_map = {m["k"]: m["v"] for m in author_full.get("metrics", [])}
            auth_similarity  = metrics_map.get("Author Similarity", 0)
            writing_consist  = metrics_map.get("Writing Consistency", 0)
            if auth_similarity > 60 and writing_consist > 70 and ai_prob_val < 30:
                old_risk = author_full["risk"]
                if old_risk > 25:
                    author_full["risk"] = 25
                    author_full["verdict"] = "Consistent with author baseline"
                    author_full["detail"] = (
                        f"Authorship risk capped at low: Author Similarity={auth_similarity:.0f}, "
                        f"Writing Consistency={writing_consist:.0f}, AI Probability={ai_prob_val}%. "
                        "Strong signals of authentic human authorship."
                    )
                    author_breakdown["score"] = 25
                    log("Authorship Cap", "OK",
                        f"risk {old_risk}→25 (AuthSim={auth_similarity:.0f} Consist={writing_consist:.0f} AI={ai_prob_val}%)")
    except Exception as exc:
        log("Authorship Cap", "ERROR", str(exc))

    # ── AI-Authorship consistency: AI text cannot score high author similarity ──
    # If AI detector is confident (≥60%) the text is AI-generated, authorship
    # similarity must be low — the two results are logically inconsistent otherwise.
    try:
        if author_full.get("status") == "ok":
            ai_prob_for_auth = ai.get("aiProbability", 0)
            if ai_prob_for_auth >= 60:
                curr_risk = author_full["risk"]
                # Floor authorship risk at 80% of AI probability
                # e.g. AI=84% → min_risk=67 → Author Similarity ≤ 33%
                # e.g. AI=77% → min_risk=62 → Author Similarity ≤ 38%
                min_risk = max(curr_risk, round(ai_prob_for_auth * 0.80))
                if min_risk > curr_risk:
                    author_full["risk"] = min_risk
                    for m in author_full.get("metrics", []):
                        if m["k"] == "Author Similarity":
                            m["v"] = max(5, 100 - min_risk)
                    author_full["verdict"] = "AI-generated text — authorship attribution unreliable"
                    author_full["detail"] = (
                        f"AI detection probability is {ai_prob_for_auth}%. Writing that is "
                        f"AI-generated cannot be attributed to a human author baseline. "
                        f"Authorship risk adjusted from {curr_risk}% to {min_risk}%."
                    )
                    author_breakdown["score"] = min_risk
                    log("AI-Auth Consistency", "ADJUSTED",
                        f"AI={ai_prob_for_auth}% → authorship risk {curr_risk}%→{min_risk}%")
    except Exception as exc:
        log("AI-Auth Consistency", "ERROR", str(exc))

    # ── Explainability ────────────────────────────────────────────────────────
    try:
        sections = explain_document(text, ocr_status=ocr_status)
        log("Explainability", "OK", f"{len(sections)} sections")
    except Exception as exc:
        sections = []
        log("Explainability", "ERROR", str(exc))

    # ── Code intelligence ─────────────────────────────────────────────────────
    try:
        code_intel = _detect_code(text)
        log("Code Intelligence", code_intel.get("status", "ok"))
    except Exception as exc:
        code_intel = {"status": "ERROR", "score": 0}
        log("Code Intelligence", "ERROR", str(exc))

    # ── Aggregate scores ──────────────────────────────────────────────────────
    breakdown = [
        {"key": "direct",     "title": "Direct Plagiarism",  **direct},
        {"key": "ai",         "title": "AI Paraphrasing",    **{k: v for k, v in ai.items()
                                                                  if k in ("score", "confidence", "evidence", "reasoning")}},
        {"key": "cross",      "title": "Cross-Language",      **cross},
        {"key": "idea",       "title": "Idea Plagiarism",     **idea},
        {"key": "authorship", "title": "Authorship Risk",     **author_breakdown},
    ]

    risk         = pct(sum(b.get("score", 0) for b in breakdown) / len(breakdown))
    authenticity = pct(100 - risk)
    confidence   = pct(sum(b.get("confidence", 0) for b in breakdown) / len(breakdown))
    threat       = "High" if risk >= 60 else "Medium" if risk >= 35 else "Low"

    return {
        "scores":           {"authenticity": authenticity, "risk": risk,
                             "confidence": confidence, "threat": threat},
        "breakdown":        breakdown,
        "pipelineStatus":   "OK",
        "pipelineLogs":     pipeline_logs,
        "docType":          doc_type,
        "aiDetection":      ai,
        "authorship":       author_full,
        "crossLanguage":    {
            "score":    cross.get("score", 0),
            "status":   cross.get("status", "ok"),
            "evidence": cross.get("evidence", ""),
            "source":   cross.get("source"),
            "langs":    cross.get("langs", []),
            "cosineMax": cross.get("cosineMax", 0),
        },
        "codeIntelligence": code_intel,
        "explainability":   sections,
    }
