# app/routers/authorship.py
from fastapi import APIRouter, HTTPException
from ..schemas import AuthorshipIn
from ..services.text_features import (
    avg_sentence_length, vocabulary_richness, avg_word_length,
    punctuation_density, burstiness, pct,
)

router = APIRouter()

DEFAULT = {"sentence_len": 18, "vocab": 0.55, "word_len": 4.5, "punct": 6, "burst": 8}


def _features(t):
    return {
        "sentence_len": avg_sentence_length(t),
        "vocab": vocabulary_richness(t),
        "word_len": avg_word_length(t),
        "punct": punctuation_density(t),
        "burst": burstiness(t),
    }


def _norm(v, mx):
    return pct((v / mx) * 100)


# POST /api/authorship/analyze
# Body: { submission, baseline? } → the 6 Writing-DNA radar metrics (0..100).
@router.post("/analyze")
def analyze(body: AuthorshipIn):
    submission = body.submission or ""
    baseline = body.baseline or ""
    if len(submission.strip()) < 20:
        raise HTTPException(400, "Provide a submission of at least ~20 characters")

    sub = _features(submission)
    base = _features(baseline) if len(baseline.strip()) >= 20 else DEFAULT

    radar = [
        {"metric": "Rhythm", "baseline": _norm(base["sentence_len"], 30), "submission": _norm(sub["sentence_len"], 30)},
        {"metric": "Vocabulary", "baseline": pct(base["vocab"] * 100), "submission": pct(sub["vocab"] * 100)},
        {"metric": "Syntax", "baseline": _norm(base["word_len"], 7), "submission": _norm(sub["word_len"], 7)},
        {"metric": "Consistency", "baseline": 100 - _norm(base["burst"], 15), "submission": 100 - _norm(sub["burst"], 15)},
        {"metric": "Punctuation", "baseline": _norm(base["punct"], 12), "submission": _norm(sub["punct"], 12)},
        {"metric": "Burstiness", "baseline": _norm(base["burst"], 15), "submission": _norm(sub["burst"], 15)},
    ]

    divergence = sum(abs(r["baseline"] - r["submission"]) for r in radar) / len(radar)
    risk = pct(divergence)

    return {
        "radar": radar,
        "risk": risk,
        "verdict": "Authorship inconsistency detected" if risk >= 50 else "Consistent with author baseline",
        "detail": f"Submission diverges {divergence / 18:.1f}σ from the established writing DNA.",
    }
