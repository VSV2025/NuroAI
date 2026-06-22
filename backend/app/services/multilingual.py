# app/services/multilingual.py — cross-language detection via multilingual embeddings + fallback
import logging
import re

import numpy as np

logger = logging.getLogger(__name__)

_FOREIGN_MARKERS = set(
    'ñÑ¿¡áéíóúÁÉÍÓÚàâæèêëîïôœùûüÿÀÂÆÈÊËÎÏÔŒÙÛÜŸäöüÄÖÜßçÇãõÃÕ'
)

_LANG_NAMES = {
    "es": "Spanish", "zh": "Chinese", "zh-cn": "Chinese", "zh-tw": "Chinese",
    "fr": "French",  "de": "German",  "ar": "Arabic",     "pt": "Portuguese",
    "ru": "Russian", "ja": "Japanese", "ko": "Korean",    "it": "Italian",
    "hi": "Hindi",   "nl": "Dutch",   "ta": "Tamil",      "te": "Telugu",
    "ml": "Malayalam", "kn": "Kannada", "bn": "Bengali",  "ur": "Urdu",
}

# ── Embedding model (fastembed ONNX, no torch) ─────────────────────────────────
_embed_model = None
_embed_failed = False


def _get_embed_model():
    global _embed_model, _embed_failed
    if _embed_failed:
        return None
    if _embed_model is None:
        try:
            from fastembed import TextEmbedding
            _embed_model = TextEmbedding(model_name="intfloat/multilingual-e5-small")
            logger.info("[crosslang] fastembed multilingual-e5-small loaded OK")
        except Exception as e:
            logger.warning(f"[crosslang] fastembed unavailable: {e} — using TF-IDF fallback")
            _embed_failed = True
    return _embed_model


def _cosine(a, b) -> float:
    a = np.array(a, dtype=float)
    b = np.array(b, dtype=float)
    norm = np.linalg.norm(a) * np.linalg.norm(b)
    return float(np.dot(a, b) / norm) if norm > 0 else 0.0


def _embed_cosine(text_a: str, text_b: str) -> float:
    """Compute cosine similarity using multilingual embeddings."""
    model = _get_embed_model()
    if model is None:
        return -1.0  # signal to use fallback
    try:
        # multilingual-e5 uses "query: " prefix
        embeddings = list(model.embed([f"query: {text_a[:512]}", f"query: {text_b[:512]}"]))
        sim = _cosine(embeddings[0], embeddings[1])
        logger.info(f"[crosslang] embedding_cosine={sim:.4f}")
        return sim
    except Exception as e:
        logger.warning(f"[crosslang] embed_cosine failed: {e}")
        return -1.0


def _tfidf_cosine(text_a: str, text_b: str, char_level: bool = False) -> float:
    """TF-IDF cosine similarity fallback."""
    try:
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity

        if char_level:
            vec = TfidfVectorizer(analyzer='char_wb', ngram_range=(3, 5), max_features=3000, min_df=1)
        else:
            vec = TfidfVectorizer(ngram_range=(1, 2), max_features=3000, min_df=1)

        matrix = vec.fit_transform([text_a, text_b])
        return float(cosine_similarity(matrix[0], matrix[1])[0][0])
    except Exception as exc:
        logger.warning(f"[multilingual] TF-IDF failed: {exc}")
        return 0.0


def _translate(text: str, source_lang: str) -> str | None:
    """Translate text to English using deep-translator."""
    try:
        from deep_translator import GoogleTranslator
        result = GoogleTranslator(source=source_lang, target="en").translate(text[:2000])
        logger.info(f"[crosslang] translated {len(result)} chars from {source_lang}")
        return result
    except Exception as exc:
        logger.warning(f"[crosslang] translation ({source_lang}→en) failed: {exc}")
        return None


def _keyword_preservation(text1: str, text2: str) -> float:
    """Fraction of content words from text1 present in text2 (language-agnostic)."""
    stopwords = {
        "the","a","an","is","are","was","were","be","been","of","in","on",
        "at","to","for","and","or","but","not","with","from","that","this",
        "it","its","by","as","la","el","es","de","que","en","los","las",
        "un","una","por","con","para","su","se","al","del",
    }
    words1 = {w.lower().strip(".,;:!?") for w in text1.split()
              if w.lower() not in stopwords and len(w) > 3}
    words2_lower = text2.lower()
    if not words1:
        return 0.5
    preserved = sum(1 for w in words1 if w in words2_lower)
    return min(1.0, preserved / len(words1))


def _structural_similarity(text1: str, text2: str) -> float:
    """Sentence count ratio and length ratio as structural proxy."""
    def sent_count(t):
        return max(1, t.count(".") + t.count("!") + t.count("?"))
    sent_ratio = min(sent_count(text1), sent_count(text2)) / max(sent_count(text1), sent_count(text2))
    len_ratio  = min(len(text1), len(text2)) / max(len(text1), len(text2))
    return (sent_ratio + len_ratio) / 2


def _script_languages(text: str) -> list:
    sample = text[:3000]
    detected = ["en"]

    if any('一' <= c <= '鿿' or '㐀' <= c <= '䶿' for c in sample):
        detected.append("zh")

    if any('぀' <= c <= 'ヿ' for c in sample) and "zh" not in detected:
        detected.append("ja")

    if any('가' <= c <= '힯' for c in sample):
        detected.append("ko")

    if any('Ѐ' <= c <= 'ӿ' for c in sample):
        detected.append("ru")

    if any('؀' <= c <= 'ۿ' for c in sample):
        detected.append("ar")

    if any('ऀ' <= c <= 'ॿ' for c in sample):
        detected.append("hi")

    if any('֐' <= c <= '׿' for c in sample):
        detected.append("he")

    if sum(1 for c in sample if c in 'ñÑ¿¡áéíóúÁÉÍÓÚ') >= 5:
        detected.append("es")

    fr_chars = sum(1 for c in sample if c in 'àâæçèéêëîïôœùûüÿÀÂÆÇÈÉÊËÎÏÔŒÙÛÜŸ')
    if fr_chars >= 5 and "es" not in detected:
        detected.append("fr")

    if sum(1 for c in sample if c in 'äöüÄÖÜß') >= 5:
        detected.append("de")

    logger.info(f"[multilingual] script analysis: {detected}")
    return detected


def _is_multilingual(text: str) -> tuple:
    if len(text.strip()) < 50:
        return False, ["en"]
    langs = _script_languages(text)
    if len(langs) <= 1:
        return False, langs
    return True, langs


def _looks_english(text: str) -> bool:
    if len(text) < 10:
        return False
    lc = text.lower()
    en_markers = {"the ", " is ", " are ", " was ", " has ", " have ",
                  " of ", " in ", " to ", " and ", " a "}
    return sum(1 for m in en_markers if m in lc) >= 2


def _split_by_language(text: str) -> tuple:
    sentences = re.split(r'(?<=[.!?\n])\s+', text)
    en_parts, foreign_parts = [], []
    for sent in sentences:
        foreign_count = sum(1 for c in sent if c in _FOREIGN_MARKERS)
        if foreign_count >= 2:
            foreign_parts.append(sent)
        elif _looks_english(sent):
            en_parts.append(sent)
        else:
            foreign_parts.append(sent)
    return " ".join(en_parts).strip(), " ".join(foreign_parts).strip()


def detect_cross_language(text: str) -> dict:
    """
    Detect cross-language plagiarism in a single document.

    Primary: fastembed multilingual-e5-small (ONNX, no torch)
             Embeds EN and foreign portions directly → high cosine for translations
    Fallback: deep-translator (Google Translate) + TF-IDF cosine

    Final Score = 50% embedding + 20% translation_alignment + 15% structure + 15% keyword
    """
    multilingual, langs = _is_multilingual(text)

    if not multilingual:
        primary = langs[0] if langs else "en"
        logger.info(f"[crosslang] LANGUAGE_NOT_PRESENT primary={primary}")
        return {
            "score":                      0,
            "confidence":                 95,
            "status":                     "LANGUAGE_NOT_PRESENT",
            "evidence":                   (
                f"Document is monolingual ({primary.upper()}). "
                "Cross-language analysis skipped — no foreign-language content detected."
            ),
            "reasoning":                  "Language-gated: only runs on multilingual documents.",
            "source":                     None,
            "langs":                      langs,
            "cosineMax":                  0.0,
            "embedding_similarity":       0.0,
            "translation_similarity":     0.0,
            "structure_similarity":       0.0,
            "keyword_preservation":       0.0,
            "final_cross_language_score": 0,
        }

    non_en_lang = next((l for l in langs if l != "en"), "es")
    logger.info(f"[crosslang] detected src={non_en_lang} tgt=en langs={langs}")

    en_text, foreign_text = _split_by_language(text)
    logger.info(f"[crosslang] en_chars={len(en_text)} foreign_chars={len(foreign_text)}")

    compare_a = en_text if en_text.strip() else text[:1500]
    compare_b = foreign_text if foreign_text.strip() else text[len(text)//2:]

    # ── 1. Embedding similarity (primary) ─────────────────────────────────────
    embedding_sim = _embed_cosine(compare_a, compare_b)
    used_fallback = embedding_sim < 0

    if used_fallback:
        # fastembed unavailable — use TF-IDF on both portions
        embedding_sim = max(
            _tfidf_cosine(compare_a, compare_b, char_level=False),
            _tfidf_cosine(compare_a, compare_b, char_level=True) * 0.9,
        )
        logger.info(f"[crosslang] tfidf_fallback embedding_sim={embedding_sim:.4f}")

    # ── 2. Translation alignment ───────────────────────────────────────────────
    translation_sim = 0.0
    translated_en = _translate(foreign_text if foreign_text.strip() else text[:2000], non_en_lang)
    if translated_en and translated_en.strip():
        if not used_fallback:
            t_sim = _embed_cosine(compare_a, translated_en)
            translation_sim = t_sim if t_sim >= 0 else _tfidf_cosine(compare_a, translated_en)
        else:
            translation_sim = _tfidf_cosine(compare_a, translated_en)
        logger.info(f"[crosslang] translation_similarity={translation_sim:.4f}")
    else:
        translation_sim = embedding_sim * 0.88
        logger.info(f"[crosslang] translation unavailable, fallback translation_sim={translation_sim:.4f}")

    # ── 3. Structural similarity ───────────────────────────────────────────────
    structure_sim = _structural_similarity(compare_a, compare_b)
    logger.info(f"[crosslang] structure_similarity={structure_sim:.4f}")

    # ── 4. Keyword preservation ────────────────────────────────────────────────
    keyword_sim = _keyword_preservation(compare_a, compare_b)
    if translated_en:
        keyword_sim = max(keyword_sim, _keyword_preservation(compare_a, translated_en))
    logger.info(f"[crosslang] keyword_preservation={keyword_sim:.4f}")

    # ── Final weighted score ───────────────────────────────────────────────────
    final = (
        0.50 * embedding_sim +
        0.20 * translation_sim +
        0.15 * structure_sim +
        0.15 * keyword_sim
    )
    logger.info(f"[crosslang] final_score={final:.4f}")

    # cosineMax = max of embedding and translation (best similarity signal)
    cosine_max = max(embedding_sim, translation_sim)

    # Legacy score mapping (kept for backward compatibility with breakdown display)
    sim = cosine_max
    if sim < 0.15:
        score    = max(1, int(sim * 80))
        strength = "weak evidence"
    elif sim < 0.35:
        score    = 10 + int((sim - 0.15) / 0.20 * 25)
        strength = "moderate evidence"
    elif sim < 0.60:
        score    = 35 + int((sim - 0.35) / 0.25 * 35)
        strength = "strong evidence"
    else:
        score    = 70 + int((sim - 0.60) / 0.40 * 30)
        strength = "very strong evidence"
    score = min(100, max(0, score))

    lang_str = ", ".join(l.upper() for l in langs)
    method = "fastembed multilingual-e5-small" if not used_fallback else "TF-IDF + deep-translator"

    return {
        "score":                      score,
        "confidence":                 82,
        "status":                     "ok",
        "evidence":                   (
            f"Multilingual document detected ({lang_str}). "
            f"Embedding similarity: {embedding_sim:.2f}, translation alignment: {translation_sim:.2f} ({strength})."
        ),
        "reasoning":                  (
            f"Method: {method}. "
            f"Final score = 50% embedding + 20% translation + 15% structure + 15% keyword."
        ),
        "source":                     None,
        "langs":                      langs,
        "cosineMax":                  round(cosine_max, 3),
        "embedding_similarity":       round(embedding_sim, 4),
        "translation_similarity":     round(translation_sim, 4),
        "structure_similarity":       round(structure_sim, 4),
        "keyword_preservation":       round(keyword_sim, 4),
        "final_cross_language_score": round(final * 100, 1),
    }
