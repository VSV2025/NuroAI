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
        # Fallback: TF-IDF cosine similarity against reference corpus (no ML model needed)
        try:
            from sklearn.feature_extraction.text import TfidfVectorizer
            from sklearn.metrics.pairwise import cosine_similarity as sk_cos
            corpus_texts = [r["text"] for r in REFERENCE_CORPUS]
            if corpus_texts:
                vect = TfidfVectorizer(ngram_range=(1, 2), max_features=5000)
                target = text[:2000]
                all_texts = [target] + corpus_texts
                mat = vect.fit_transform(all_texts)
                sims = sk_cos(mat[0:1], mat[1:])[0]
                best_idx = int(sims.argmax())
                best_sim = float(sims[best_idx])
                best_src = REFERENCE_CORPUS[best_idx]["source"]
                score = pct(best_sim * 140)
                return {
                    "score": score,
                    "confidence": 60,
                    "evidence": f"TF-IDF similarity {best_sim:.2f} against '{best_src}' (embedding model unavailable: {exc}).",
                    "reasoning": "Fallback: TF-IDF n-gram cosine similarity used (sentence-transformers unavailable).",
                    "source": best_src,
                    "concepts": [],
                }
        except Exception as fallback_exc:
            pass
        return {
            "score": 0,
            "confidence": 40,
            "evidence": f"Semantic model unavailable: {exc}",
            "reasoning": "Fallback computation also failed — no semantic score available.",
        }
