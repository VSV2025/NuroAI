# app/services/authorship_engine.py — Enhanced stylometry with NLTK POS tagging
import logging

from .text_features import (
    avg_sentence_length, vocabulary_richness, avg_word_length,
    punctuation_density, burstiness, flesch_reading_ease,
    hapax_ratio, function_word_ratio, pct,
)

logger = logging.getLogger(__name__)

DEFAULT_BASELINE = {
    "avg_sentence_len":    18.0,
    "vocabulary_richness": 0.55,
    "avg_word_len":         4.5,
    "punctuation_density":  6.0,
    "burstiness":           8.0,
    "flesch":              62.0,
    "hapax_ratio":          0.60,
    "function_word_ratio":  0.45,
    "pos_noun_ratio":       0.28,
    "pos_verb_ratio":       0.16,
    "pos_adj_ratio":        0.08,
}


def _pos_ratios(text: str) -> dict[str, float]:
    try:
        import nltk
        tokens = nltk.word_tokenize(text[:4000])
        tags = nltk.pos_tag(tokens)
        total = len(tags)
        if total == 0:
            return {"pos_noun_ratio": 0.0, "pos_verb_ratio": 0.0, "pos_adj_ratio": 0.0}
        nouns = sum(1 for _, t in tags if t in ("NN", "NNS", "NNP", "NNPS"))
        verbs = sum(1 for _, t in tags if t.startswith("VB"))
        adjs  = sum(1 for _, t in tags if t in ("JJ", "JJR", "JJS"))
        return {
            "pos_noun_ratio": nouns / total,
            "pos_verb_ratio": verbs / total,
            "pos_adj_ratio":  adjs  / total,
        }
    except Exception as exc:
        logger.warning(f"[authorship] POS tagging failed: {exc}")
        return {"pos_noun_ratio": 0.0, "pos_verb_ratio": 0.0, "pos_adj_ratio": 0.0}


def _extract_features(text: str) -> dict:
    pos = _pos_ratios(text)
    sl  = avg_sentence_length(text)
    vr  = vocabulary_richness(text)
    wl  = avg_word_length(text)
    pd  = punctuation_density(text)
    b   = burstiness(text)
    fl  = flesch_reading_ease(text)
    hr  = hapax_ratio(text)
    fwr = function_word_ratio(text)
    return {
        "avg_sentence_len":    sl,
        "vocabulary_richness": vr,
        "avg_word_len":        wl,
        "punctuation_density": pd,
        "burstiness":          b,
        "flesch":              fl,
        "hapax_ratio":         hr,
        "function_word_ratio": fwr,
        **pos,
    }


def analyze_authorship(text: str, baseline: dict | None = None) -> dict:
    if len(text.strip()) < 50:
        return {
            "status":  "INSUFFICIENT_TEXT",
            "radar":   [],
            "metrics": [],
            "risk":    0,
            "verdict": "Insufficient text",
            "detail":  "Less than 50 characters extracted — cannot perform stylometric analysis.",
        }

    base = baseline or DEFAULT_BASELINE
    sub  = _extract_features(text)

    # ── Radar chart (6 axes, 0-100) ──────────────────────────────────────────
    radar = [
        {
            "k": "Rhythm",
            "a": pct(base["avg_sentence_len"]    / 30 * 100),
            "b": pct(sub["avg_sentence_len"]     / 30 * 100),
        },
        {
            "k": "Vocabulary",
            "a": pct(base["vocabulary_richness"] * 100),
            "b": pct(sub["vocabulary_richness"]  * 100),
        },
        {
            "k": "Syntax",
            "a": pct(base["avg_word_len"]        / 7  * 100),
            "b": pct(sub["avg_word_len"]         / 7  * 100),
        },
        {
            "k": "Consistency",
            "a": pct(100 - base["burstiness"]   / 15 * 100),
            "b": pct(100 - sub["burstiness"]    / 15 * 100),
        },
        {
            "k": "Punctuation",
            "a": pct(base["punctuation_density"] / 12 * 100),
            "b": pct(sub["punctuation_density"]  / 12 * 100),
        },
        {
            "k": "Burstiness",
            "a": pct(base["burstiness"]          / 15 * 100),
            "b": pct(sub["burstiness"]           / 15 * 100),
        },
    ]

    # ── Risk ─────────────────────────────────────────────────────────────────
    avg_div = sum(abs(r["a"] - r["b"]) for r in radar) / len(radar)
    risk    = pct(avg_div)
    sigma   = round(avg_div / 18, 1)

    # ── 6 metric cards ────────────────────────────────────────────────────────
    metrics = [
        {"k": "Writing Rhythm",        "v": radar[0]["b"]},
        {"k": "Vocabulary Complexity", "v": radar[1]["b"]},
        {"k": "Sentence Structure",    "v": radar[2]["b"]},
        {"k": "Writing Consistency",   "v": radar[3]["b"]},
        {"k": "Author Similarity",     "v": max(0, 100 - risk)},
        {"k": "Behavioral Signature",  "v": radar[5]["b"]},
    ]

    # ── POS-based extra detail ────────────────────────────────────────────────
    pos_note = ""
    noun_diff = abs(sub["pos_noun_ratio"] - base["pos_noun_ratio"])
    verb_diff = abs(sub["pos_verb_ratio"] - base["pos_verb_ratio"])
    if noun_diff > 0.08:
        pos_note = f" Noun ratio {sub['pos_noun_ratio']:.2f} vs baseline {base['pos_noun_ratio']:.2f}."
    elif verb_diff > 0.06:
        pos_note = f" Verb ratio {sub['pos_verb_ratio']:.2f} vs baseline {base['pos_verb_ratio']:.2f}."

    verdict = ("Authorship inconsistency detected" if risk >= 50
               else "Consistent with author baseline")
    detail  = (
        f"Submission diverges {sigma}σ from the established writing DNA across 6 stylometric dimensions.{pos_note}"
        if sigma > 0 else
        "Writing style aligns with expected author baseline."
    )

    return {
        "status":  "ok",
        "radar":   radar,
        "metrics": metrics,
        "risk":    risk,
        "verdict": verdict,
        "detail":  detail,
        "features": {
            "avg_sentence_len":    round(sub["avg_sentence_len"], 2),
            "vocabulary_richness": round(sub["vocabulary_richness"], 3),
            "burstiness":          round(sub["burstiness"], 2),
            "flesch":              round(sub["flesch"], 1),
            "hapax_ratio":         round(sub["hapax_ratio"], 3),
            "pos_noun_ratio":      round(sub["pos_noun_ratio"], 3),
            "pos_verb_ratio":      round(sub["pos_verb_ratio"], 3),
            "pos_adj_ratio":       round(sub["pos_adj_ratio"], 3),
        },
    }
