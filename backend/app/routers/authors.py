# app/routers/authors.py — Per-author baseline enrollment
from typing import List
from fastapi import APIRouter, UploadFile, File, HTTPException

router = APIRouter()


def _get_collection():
    from ..db import author_profiles_collection
    return author_profiles_collection()


# POST /api/authors/{author_id}/enroll
# Body: multipart files (1–5 verified human documents)
@router.post("/{author_id}/enroll")
async def enroll_author(author_id: str, files: List[UploadFile] = File(...)):
    """
    Enroll verified human-written documents for an author.
    Extracts stylometric features, averages them, and stores as the author's baseline.
    AI-generated content is rejected (AI% >= 60 blocks enrollment).
    """
    from ..services.authorship_engine import _extract_features
    from ..services.ai_detector import detect_ai_text

    all_features = []
    rejected_ai  = []
    rejected_short = []

    for f in files[:5]:
        raw = await f.read()
        text = raw.decode("utf-8", errors="ignore").strip()

        if len(text.split()) < 50:
            rejected_short.append(f.filename)
            continue

        # Reject AI-generated content from becoming part of a human baseline
        ai = detect_ai_text(text)
        if ai.get("aiProbability", 0) >= 60:
            rejected_ai.append(f.filename)
            continue

        features = _extract_features(text)
        all_features.append(features)

    if not all_features:
        raise HTTPException(
            400,
            "No valid documents enrolled. "
            f"Rejected (AI-generated): {rejected_ai}. "
            f"Rejected (too short): {rejected_short}. "
            "Provide 1–5 verified human-written documents of at least 50 words each."
        )

    # Average all feature vectors
    keys = list(all_features[0].keys())
    baseline = {k: sum(f[k] for f in all_features) / len(all_features) for k in keys}

    _get_collection().update_one(
        {"_id": author_id},
        {"$set": {
            "baseline":  baseline,
            "doc_count": len(all_features),
            "rejected_ai":    rejected_ai,
            "rejected_short": rejected_short,
        }},
        upsert=True,
    )

    return {
        "author_id":      author_id,
        "enrolled":       len(all_features),
        "rejected_ai":    rejected_ai,
        "rejected_short": rejected_short,
        "baseline_keys":  list(baseline.keys()),
        "preview": {
            "burstiness":          round(baseline.get("burstiness", 0), 2),
            "vocabulary_richness": round(baseline.get("vocabulary_richness", 0), 3),
            "avg_sentence_len":    round(baseline.get("avg_sentence_len", 0), 1),
        },
    }


# GET /api/authors/{author_id}/baseline
@router.get("/{author_id}/baseline")
def get_baseline(author_id: str):
    doc = _get_collection().find_one({"_id": author_id})
    if not doc:
        raise HTTPException(404, f"No baseline found for author '{author_id}'. "
                                 "Enroll documents first via POST /api/authors/{author_id}/enroll")
    baseline = doc["baseline"]
    return {
        "author_id":  author_id,
        "doc_count":  doc.get("doc_count", 0),
        "baseline": {k: round(v, 4) for k, v in baseline.items()},
    }


# GET /api/authors
@router.get("")
def list_authors():
    authors = [
        {"author_id": d["_id"], "doc_count": d.get("doc_count", 0)}
        for d in _get_collection().find({}, {"baseline": 0})
    ]
    return {"authors": authors, "count": len(authors)}


# DELETE /api/authors/{author_id}
@router.delete("/{author_id}")
def delete_author(author_id: str):
    result = _get_collection().delete_one({"_id": author_id})
    if result.deleted_count == 0:
        raise HTTPException(404, f"Author '{author_id}' not found")
    return {"deleted": author_id}
