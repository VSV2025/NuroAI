# app/services/semantic.py  — Phase 3: sentence-transformer idea plagiarism
import re
import numpy as np
from ..data.corpus import REFERENCE_CORPUS
from .text_features import pct

_model = None

def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer("sentence-transformers/all-mpnet-base-v2")
    return _model


def _cosine(a: np.ndarray, b: np.ndarray) -> float:
    denom = np.linalg.norm(a) * np.linalg.norm(b)
    return float(np.dot(a, b) / denom) if denom > 1e-8 else 0.0


def _chunk(text: str, size: int = 100) -> list[str]:
    ws = text.split()
    return [
        " ".join(ws[i: i + size])
        for i in range(0, len(ws), size)
        if len(ws[i: i + size]) >= 8
    ]


def detect_idea_plagiarism(text: str) -> dict:
    try:
        model = _get_model()
        chunks = _chunk(text) or [text[:500]]
        corpus_texts = [r["text"] for r in REFERENCE_CORPUS]
        all_embs = model.encode(chunks + corpus_texts, convert_to_numpy=True, show_progress_bar=False)
        chunk_embs = all_embs[: len(chunks)]
        corpus_embs = all_embs[len(chunks):]

        best_sim, best_ref, best_chunk = 0.0, None, ""
        for ci, ce in enumerate(chunk_embs):
            for ri, re_emb in enumerate(corpus_embs):
                sim = _cosine(ce, re_emb)
                if sim > best_sim:
                    best_sim, best_ref, best_chunk = sim, REFERENCE_CORPUS[ri], chunks[ci]

        concepts = re.findall(r"[a-z]{5,}", best_chunk.lower())[:5]
        score = pct(best_sim * 140)
        return {
            "score": score,
            "confidence": 85,
            "evidence": (
                f"Highest semantic similarity {best_sim:.2f} against "
                f"'{best_ref['source'] if best_ref else 'corpus'}'."
            ),
            "reasoning": (
                "all-mpnet-base-v2 sentence embeddings; cosine similarity "
                "across document chunks vs reference corpus."
            ),
            "source": best_ref["source"] if best_ref else None,
            "concepts": concepts,
        }
    except Exception as exc:
        return {
            "score": 33,
            "confidence": 55,
            "evidence": f"Model unavailable: {exc}",
            "reasoning": "Fallback: semantic model could not be loaded.",
        }
