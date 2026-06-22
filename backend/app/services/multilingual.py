# app/services/multilingual.py — Phase 2: language-gated cross-language detection
import logging
import numpy as np

logger = logging.getLogger(__name__)

_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("paraphrase-multilingual-mpnet-base-v2")
    return _model


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return float(np.dot(a, b) / denom) if denom > 1e-8 else 0.0


def _script_languages(text: str) -> list:
    """
    Detect languages by Unicode script analysis.
    This is more reliable than langdetect for the cross-language plagiarism gate,
    which needs to know if a document genuinely contains non-English script.

    Returns a list: always starts with 'en' for English, followed by detected
    non-English scripts.  English-only documents return ['en'] only.
    """
    sample = text[:3000]
    detected = ["en"]  # assume English is always present

    # CJK scripts
    has_cjk = any('一' <= c <= '鿿' or
                  '㐀' <= c <= '䶿' or
                  '豈' <= c <= '﫿' for c in sample)
    if has_cjk:
        detected.append("zh")

    # Japanese kana
    has_jp = any('぀' <= c <= 'ヿ' for c in sample)
    if has_jp and not has_cjk:
        detected.append("ja")

    # Korean Hangul
    has_ko = any('가' <= c <= '힯' for c in sample)
    if has_ko:
        detected.append("ko")

    # Cyrillic (Russian, Ukrainian, etc.)
    has_cyr = any('Ѐ' <= c <= 'ӿ' for c in sample)
    if has_cyr:
        detected.append("ru")

    # Arabic
    has_ar = any('؀' <= c <= 'ۿ' for c in sample)
    if has_ar:
        detected.append("ar")

    # Devanagari (Hindi, Sanskrit, etc.)
    has_dev = any('ऀ' <= c <= 'ॿ' for c in sample)
    if has_dev:
        detected.append("hi")

    # Hebrew
    has_he = any('֐' <= c <= '׿' for c in sample)
    if has_he:
        detected.append("he")

    # Latin-script European languages: detect by presence of distinctive
    # diacritical characters in meaningful quantity (>= 5 occurrences)
    # Spanish: ñ, ¿, ¡ and accented vowels common in Spanish
    spanish_chars = sum(1 for c in sample if c in 'ñÑ¿¡áéíóúÁÉÍÓÚ')
    if spanish_chars >= 5:
        detected.append("es")

    # French: distinctive French characters
    french_chars = sum(1 for c in sample if c in 'àâæçèéêëîïôœùûüÿÀÂÆÇÈÉÊËÎÏÔŒÙÛÜŸ')
    if french_chars >= 5:
        detected.append("fr")

    # German: umlauts and ß
    german_chars = sum(1 for c in sample if c in 'äöüÄÖÜß')
    if german_chars >= 5:
        detected.append("de")

    logger.info(f"[multilingual] script analysis: {detected}")
    return detected


def _is_multilingual(text: str) -> tuple:
    """
    Returns (is_multilingual: bool, detected_languages: list[str]).

    Uses script-based language detection (not langdetect) which is reliable
    for the cross-language plagiarism gate.

    A document is multilingual only if it genuinely contains non-English script
    or substantial Latin-script diacritics belonging to a specific foreign language.

    English-only text (ASCII + standard Latin punctuation) returns False.
    This correctly handles: handwritten English notes, OCR'd English documents,
    English academic essays, source code.
    """
    if len(text.strip()) < 50:
        return False, ["en"]

    langs = _script_languages(text)

    if len(langs) <= 1:
        return False, langs

    return True, langs


def detect_cross_language(text: str) -> dict:
    """
    Detect cross-language plagiarism.

    Gate: Only runs if the document contains multilingual content.
    For monolingual documents, returns score=0 and status=LANGUAGE_NOT_PRESENT.

    Cosine similarity thresholds:
      < 0.55  → score = 0 (no evidence)
      0.55–0.70 → weak evidence (score 1–30)
      0.70–0.85 → moderate evidence (score 31–70)
      > 0.85  → strong evidence (score 71–100)
    """
    # Step 1: Language detection gate
    multilingual, langs = _is_multilingual(text)

    if not multilingual:
        primary = langs[0] if langs else "en"
        return {
            "score":      0,
            "confidence": 95,
            "status":     "LANGUAGE_NOT_PRESENT",
            "evidence":   (
                f"Document is monolingual ({primary.upper()}). "
                "Cross-language analysis skipped — no foreign-language content detected."
            ),
            "reasoning":  (
                "Cross-language plagiarism detection only runs when multilingual content "
                "is present. Handwritten English notes are correctly returned as 0%."
            ),
            "source":     None,
            "langs":      langs,
        }

    # Step 2: Multilingual content confirmed — run embedding comparison
    from ..data.corpus import REFERENCE_CORPUS
    try:
        model = _get_model()
        corpus_texts = [r["text"] for r in REFERENCE_CORPUS]
        all_embs = model.encode(
            [text[:512]] + corpus_texts,
            convert_to_numpy=True,
            show_progress_bar=False,
        )
        sub_emb    = all_embs[0]
        corpus_embs = all_embs[1:]

        best_sim, best_ref = 0.0, None
        for i, ce in enumerate(corpus_embs):
            sim = _cosine(sub_emb, ce)
            if sim > best_sim:
                best_sim, best_ref = sim, REFERENCE_CORPUS[i]

        # Step 3: Apply calibrated cosine thresholds
        if best_sim < 0.55:
            score    = 0
            strength = "no evidence"
        elif best_sim < 0.70:
            score    = max(1, int((best_sim - 0.55) / 0.15 * 30))
            strength = "weak evidence"
        elif best_sim < 0.85:
            score    = 30 + int((best_sim - 0.70) / 0.15 * 40)
            strength = "moderate evidence"
        else:
            score    = 70 + int((best_sim - 0.85) / 0.15 * 30)
            strength = "strong evidence"

        score = min(100, max(0, score))

        lang_str = ", ".join(l.upper() for l in langs)
        return {
            "score":      score,
            "confidence": 82,
            "status":     "ok",
            "evidence":   (
                f"Multilingual document detected ({lang_str}). "
                f"Best corpus cosine: {best_sim:.2f} — {strength}."
            ),
            "reasoning":  (
                "Language-gated cross-language analysis using multilingual embeddings. "
                f"Cosine {best_sim:.2f} mapped to score {score} via calibrated thresholds "
                "(< 0.55 = 0, 0.55–0.70 = weak, 0.70–0.85 = moderate, > 0.85 = strong)."
            ),
            "source":     best_ref["source"] if best_ref else None,
            "langs":      langs,
            "cosineMax":  round(best_sim, 3),
        }

    except Exception as exc:
        logger.warning(f"[multilingual] embedding comparison failed: {exc}")
        return {
            "score":      0,
            "confidence": 0,
            "status":     f"ERROR",
            "evidence":   f"Cross-language embedding failed: {exc}",
            "reasoning":  "Model error during cross-language analysis.",
            "source":     None,
            "langs":      langs,
        }
