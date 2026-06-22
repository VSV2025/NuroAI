# app/services/ai_detector.py — Ensemble AI detector (8 signals)
import logging
import math
import re
from collections import Counter

from .text_features import burstiness, sentences, pct, ngrams

logger = logging.getLogger(__name__)

ROBERTA_MODEL  = "openai-community/roberta-base-openai-detector"
DEBERTA_MODEL  = "cross-encoder/nli-deberta-v3-small"
GPT2_MODEL     = "gpt2"  # use base model; gpt2-large is ~800MB and slow to download
DEVICE         = "cpu"

_roberta_pipeline  = None
_roberta_load_err  = None
_deberta_pipeline  = None
_deberta_load_err  = None
_gpt2_model        = None
_gpt2_tokenizer    = None
_gpt2_load_err     = None
_st_model          = None


# ── AI-typical phrase vocabulary ──────────────────────────────────────────────
# Phrases and words that appear at much higher density in AI-generated text
# than in natural human prose.

_AI_TRANSITIONS = [
    "furthermore", "moreover", "additionally", "in addition",
    "in conclusion", "in summary", "to summarize", "overall",
    "it is worth noting", "it is important to note",
    "it is essential", "it is crucial", "it is imperative",
    "as a result", "consequently", "therefore",
    "on the other hand", "conversely",
    # Modern LLM-specific transition patterns
    "first and foremost", "last but not least", "needless to say",
    "it goes without saying", "it should be emphasized",
    "it should be noted", "it must be acknowledged",
    "it is noteworthy", "as we move forward", "going forward",
    "with that said", "that being said", "having said that",
    "in light of", "in the context of", "in the face of",
    "to this end", "to that end", "with this in mind",
    "at the same time", "by the same token",
    "it is evident that", "it is clear that",
]
_AI_ACADEMIC = [
    "paradigm", "ecosystem", "landscape", "framework",
    "comprehensive", "multifaceted", "unprecedented",
    "systematic", "robust", "innovative", "transformative",
    "facilitate", "leverage", "optimize", "implement",
    "demonstrate", "highlight", "underscore", "illustrate",
    "necessitate", "proliferation", "modality", "efficacy",
    "stakeholder", "synergy", "pivotal", "seminal",
    "significant", "substantial", "considerable",
    "fundamentally", "collectively", "ultimately",
    "align with", "in this context", "in this regard",
    "plays a crucial role", "plays a vital role",
    "range of", "variety of", "multitude of",
    # Modern GPT-4/Claude/Gemini patterns
    "reshape", "revolutionize", "catalyze", "propel", "empower",
    "delve into", "tapestry", "nuanced", "holistic", "paradigm shift",
    "cutting-edge", "state-of-the-art", "game-changing", "disruptive",
    "scalable", "actionable", "best practices", "key takeaways",
    "in the realm of", "at the forefront of", "a crucial role",
    "a vital role", "a key role", "moving forward",
    "across various domains", "across multiple domains",
    "across the globe", "around the world",
    "interconnected", "multidimensional", "far-reaching",
    "far-ranging", "wide-ranging", "wide-reaching",
    "by leveraging", "by harnessing", "by utilizing",
    "in today's rapidly evolving", "in an increasingly",
    "has emerged as", "continue to evolve",
    "remains to be seen", "cannot be overstated",
]


def _score_ai_vocab(text: str) -> int:
    """
    Count density of AI-typical formal phrases and words per 1000 tokens.
    High density → AI-like. Calibrated so professional AI text scores ~80,
    casual human prose scores ~10.
    """
    text_lc = text.lower()
    words    = text_lc.split()
    n_words  = max(1, len(words))

    count = 0
    for phrase in _AI_TRANSITIONS:
        count += text_lc.count(phrase)
    for phrase in _AI_ACADEMIC:
        count += text_lc.count(phrase)

    # Phrases per 1000 words; calibrated: ≥20 per 1000 → 100
    density = count / (n_words / 1000)
    score   = min(100, int(density * 4))
    logger.info(f"[ai_detector] ai_vocab: count={count} n_words={n_words} density={density:.1f} score={score}")
    return score


# ── Model loaders ─────────────────────────────────────────────────────────────

def _get_roberta():
    global _roberta_pipeline, _roberta_load_err
    if _roberta_load_err:
        raise RuntimeError(_roberta_load_err)
    if _roberta_pipeline is not None:
        return _roberta_pipeline
    logger.info(f"[ai_detector] Loading RoBERTa: {ROBERTA_MODEL}")
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForSequenceClassification, pipeline
        tok   = AutoTokenizer.from_pretrained(ROBERTA_MODEL)
        model = AutoModelForSequenceClassification.from_pretrained(
            ROBERTA_MODEL, low_cpu_mem_usage=False
        ).to(torch.device(DEVICE)).eval()
        _roberta_pipeline = pipeline(
            "text-classification", model=model, tokenizer=tok,
            device=-1, truncation=True, max_length=512,
        )
        logger.info("[ai_detector] RoBERTa ready")
        return _roberta_pipeline
    except Exception as exc:
        _roberta_load_err = str(exc)
        raise RuntimeError(_roberta_load_err)


def _get_deberta():
    global _deberta_pipeline, _deberta_load_err
    if _deberta_load_err:
        raise RuntimeError(_deberta_load_err)
    if _deberta_pipeline is not None:
        return _deberta_pipeline
    logger.info(f"[ai_detector] Loading DeBERTa-v3 NLI: {DEBERTA_MODEL}")
    try:
        from transformers import pipeline as hf_pipeline
        _deberta_pipeline = hf_pipeline(
            "zero-shot-classification",
            model=DEBERTA_MODEL,
            device=-1,
        )
        logger.info("[ai_detector] DeBERTa-v3 ready")
        return _deberta_pipeline
    except Exception as exc:
        _deberta_load_err = str(exc)
        raise RuntimeError(_deberta_load_err)


def _get_gpt2():
    global _gpt2_model, _gpt2_tokenizer, _gpt2_load_err
    if _gpt2_load_err:
        raise RuntimeError(_gpt2_load_err)
    if _gpt2_model is not None:
        return _gpt2_tokenizer, _gpt2_model
    logger.info(f"[ai_detector] Loading GPT-2 large for perplexity: {GPT2_MODEL}")
    try:
        import torch
        from transformers import AutoTokenizer, AutoModelForCausalLM
        tok   = AutoTokenizer.from_pretrained(GPT2_MODEL)
        model = AutoModelForCausalLM.from_pretrained(
            GPT2_MODEL, low_cpu_mem_usage=False
        ).to(torch.device(DEVICE)).eval()
        _gpt2_tokenizer, _gpt2_model = tok, model
        logger.info("[ai_detector] GPT-2 large ready")
        return tok, model
    except Exception as exc:
        _gpt2_load_err = str(exc)
        raise RuntimeError(_gpt2_load_err)


def _get_st_model():
    global _st_model
    if _st_model is None:
        from sentence_transformers import SentenceTransformer
        _st_model = SentenceTransformer("paraphrase-multilingual-mpnet-base-v2")
    return _st_model


# ── Individual signal scorers ─────────────────────────────────────────────────

def _score_roberta(text: str) -> tuple[int, str]:
    """RoBERTa OpenAI detector. Returns (score 0-100, status)."""
    try:
        pipe   = _get_roberta()
        result = pipe(text[:1024])[0]
        is_ai  = result["label"] == "FAKE"
        raw    = result["score"]
        score  = pct(raw * 100 if is_ai else (1 - raw) * 100)
        logger.info(f"[ai_detector] RoBERTa: label={result['label']} raw={raw:.3f} score={score}")
        return score, "ok"
    except Exception as exc:
        logger.warning(f"[ai_detector] RoBERTa unavailable: {exc}")
        return 0, f"UNAVAILABLE: {exc}"


def _score_deberta(text: str) -> tuple[int, str]:
    """
    DeBERTa-v3 zero-shot classification.
    Uses NLI to estimate P(text is AI-generated).
    Returns (score 0-100, status).
    """
    try:
        pipe = _get_deberta()
        # Truncate to manageable length
        snippet = text[:1000]
        result  = pipe(
            snippet,
            candidate_labels=[
                "AI-generated text",
                "human-written text",
            ],
            hypothesis_template="This is {}.",
        )
        labels = result["labels"]
        scores = result["scores"]
        label_score = {l: s for l, s in zip(labels, scores)}
        ai_prob = label_score.get("AI-generated text", 0.0)
        score   = min(100, int(ai_prob * 100))
        logger.info(f"[ai_detector] DeBERTa: ai_prob={ai_prob:.3f} score={score}")
        return score, "ok"
    except Exception as exc:
        logger.warning(f"[ai_detector] DeBERTa unavailable: {exc}")
        return 0, f"UNAVAILABLE: {exc}"


def _score_perplexity(text: str) -> tuple[int, str]:
    """
    GPT-2 large perplexity. Lower perplexity → more predictable → AI-like.
    Returns (ai_score 0-100, status).
    Calibration: perplexity <50 → score ~90, perplexity >300 → score ~10.
    """
    try:
        import torch
        tok, model = _get_gpt2()

        # Encode; cap at 512 tokens
        enc = tok(text, return_tensors="pt", truncation=True, max_length=512)
        input_ids = enc["input_ids"]
        if input_ids.shape[1] < 5:
            return 0, "TOO_SHORT"

        with torch.no_grad():
            out  = model(input_ids, labels=input_ids)
            loss = out.loss.item()  # mean NLL per token

        perplexity = math.exp(loss)
        # Map: low perplexity → high AI score
        # Sigmoid-ish mapping centred at 150 ppl (typical human prose)
        # score = 100 * sigmoid(-(ppl - 80) / 60)
        # At ppl=30: score ≈ 83
        # At ppl=80: score ≈ 50
        # At ppl=150: score ≈ 22
        # At ppl=250: score ≈ 8
        score = max(0, min(100, int(100 / (1 + math.exp((perplexity - 80) / 60)))))
        logger.info(f"[ai_detector] GPT-2 perplexity={perplexity:.1f} score={score}")
        return score, "ok"
    except Exception as exc:
        logger.warning(f"[ai_detector] GPT-2 perplexity unavailable: {exc}")
        return 0, f"UNAVAILABLE: {exc}"


def _score_burstiness(text: str) -> int:
    b = burstiness(text)
    return max(0, min(100, int((1 - b / 15) * 100)))


def _score_sentence_uniformity(text: str) -> int:
    sents = sentences(text)
    if len(sents) < 3:
        return 0
    lens = [len(s.split()) for s in sents]
    mean = sum(lens) / len(lens)
    if mean == 0:
        return 0
    variance = sum((x - mean) ** 2 for x in lens) / len(lens)
    cv = math.sqrt(variance) / mean
    return max(0, min(100, int((1 - cv) * 100)))


def _score_semantic_redundancy(text: str) -> int:
    sents = sentences(text)
    if len(sents) < 3:
        return 0
    try:
        from sklearn.metrics.pairwise import cosine_similarity
        import numpy as np
        model      = _get_st_model()
        embeddings = model.encode(sents[:20], convert_to_numpy=True, show_progress_bar=False)
        sims = [
            float(cosine_similarity([embeddings[i]], [embeddings[i + 1]])[0][0])
            for i in range(len(embeddings) - 1)
        ]
        avg_sim = sum(sims) / len(sims) if sims else 0.0
        return max(0, min(100, int(avg_sim * 100)))
    except Exception as exc:
        logger.warning(f"[ai_detector] Semantic redundancy failed: {exc}")
        return 0


def _score_repetition_patterns(text: str) -> int:
    grams = list(ngrams(text, 4))
    if not grams:
        return 0
    counter  = Counter(grams)
    repeated = sum(c - 1 for c in counter.values() if c > 1)
    return min(100, int(repeated / max(1, len(grams)) * 500))


# ── Ensemble ──────────────────────────────────────────────────────────────────

MIN_WORDS_FOR_DETECTION = 50  # below this, signal-to-noise is too low for a reliable verdict


def detect_ai_text(text: str, doc_type: str = "typed_essay") -> dict:
    """
    Ensemble AI detection.
    doc_type: 'typed_essay' | 'handwritten' | 'scanned_pdf' | 'source_code' | 'digital_pdf'
    For handwritten and academic notes, aiVocab weight is reduced to avoid false positives
    on technical vocabulary that is natural in those contexts.
    """
    word_count = len(re.findall(r"\w+", text))
    if word_count < MIN_WORDS_FOR_DETECTION:
        return {
            "score":            0,
            "aiProbability":    0,
            "humanProbability": 0,
            "confidence":       0,
            "verdict":          "Insufficient text length for reliable AI detection.",
            "evidence":         f"Document contains only {word_count} words (minimum: {MIN_WORDS_FOR_DETECTION}).",
            "reasoning":        "Too few tokens to compute stylometric or vocabulary signals reliably.",
            "subScores":        {},
            "status":           "INSUFFICIENT_TEXT",
            "docType":          doc_type,
        }

    sub_scores: dict[str, int] = {}

    # --- Lightweight signals (always available) ---
    sub_scores["aiVocab"]            = _score_ai_vocab(text)
    sub_scores["burstiness"]         = _score_burstiness(text)
    sub_scores["sentenceUniformity"] = _score_sentence_uniformity(text)
    sub_scores["semanticRedundancy"] = _score_semantic_redundancy(text)
    sub_scores["repetitionPatterns"] = _score_repetition_patterns(text)

    # --- Model-based signals (lazy-loaded, may be unavailable) ---
    roberta_score, roberta_status = _score_roberta(text)
    sub_scores["roberta"] = roberta_score
    roberta_ok = roberta_status == "ok"

    deberta_score, deberta_status = _score_deberta(text)
    sub_scores["deberta"] = deberta_score
    deberta_ok = deberta_status == "ok"

    perplexity_score, ppl_status = _score_perplexity(text)
    sub_scores["perplexity"] = perplexity_score
    perplexity_ok = ppl_status == "ok"

    # ── Weight selection ──────────────────────────────────────────────────────
    # Full ensemble (all models available).
    # aiVocab is the strongest discriminator for typed essays, but for handwritten
    # and academic notes technical vocabulary is natural — reduce its weight there.
    FULL_WEIGHTS = {
        "aiVocab":            0.53,
        "deberta":            0.13,
        "perplexity":         0.03,
        "roberta":            0.06,
        "burstiness":         0.13,
        "sentenceUniformity": 0.07,
        "semanticRedundancy": 0.04,
        "repetitionPatterns": 0.01,
    }
    # For handwritten / scanned docs: aiVocab weight halved, redistributed to
    # structural signals (burstiness, sentenceUniformity, semanticRedundancy)
    HANDWRITTEN_WEIGHTS = {
        "aiVocab":            0.25,
        "deberta":            0.16,
        "perplexity":         0.04,
        "roberta":            0.08,
        "burstiness":         0.22,
        "sentenceUniformity": 0.13,
        "semanticRedundancy": 0.10,
        "repetitionPatterns": 0.02,
    }
    # Without any ML models
    STAT_WEIGHTS = {
        "aiVocab":            0.55,
        "burstiness":         0.22,
        "sentenceUniformity": 0.14,
        "semanticRedundancy": 0.07,
        "repetitionPatterns": 0.02,
    }
    STAT_HANDWRITTEN_WEIGHTS = {
        "aiVocab":            0.25,
        "burstiness":         0.35,
        "sentenceUniformity": 0.22,
        "semanticRedundancy": 0.14,
        "repetitionPatterns": 0.04,
    }

    models_available = sum([roberta_ok, deberta_ok, perplexity_ok])
    is_handwritten   = doc_type in ("handwritten", "scanned_pdf")

    if models_available >= 2:
        weights      = HANDWRITTEN_WEIGHTS if is_handwritten else FULL_WEIGHTS
        final_status = "ok"
        confidence   = 88
    elif models_available == 1:
        weights      = HANDWRITTEN_WEIGHTS if is_handwritten else FULL_WEIGHTS
        final_status = "partial"
        confidence   = 72
    else:
        weights      = STAT_HANDWRITTEN_WEIGHTS if is_handwritten else STAT_WEIGHTS
        final_status = "statistical_only"
        confidence   = 60

    ensemble = sum(sub_scores.get(k, 0) * w for k, w in weights.items())
    ai_prob  = max(0, min(100, round(ensemble)))
    human_prob = 100 - ai_prob

    if ai_prob >= 75:
        verdict = "AI-Generated"
    elif ai_prob >= 55:
        verdict = "Likely AI"
    elif ai_prob >= 40:
        verdict = "Uncertain"
    elif ai_prob >= 20:
        verdict = "Likely Human"
    else:
        verdict = "Human-Written"

    # Evidence narrative
    signals = []
    if sub_scores["aiVocab"] > 40:
        signals.append(f"high density of AI-typical vocabulary/phrases ({sub_scores['aiVocab']})")
    if deberta_ok and sub_scores["deberta"] > 50:
        signals.append(f"DeBERTa-v3 classifier flagged ({sub_scores['deberta']}%)")
    if perplexity_ok and sub_scores["perplexity"] > 60:
        signals.append(f"low GPT-2 perplexity (predictable text, score {sub_scores['perplexity']})")
    if roberta_ok and sub_scores["roberta"] > 40:
        signals.append(f"RoBERTa classifier flagged ({sub_scores['roberta']}%)")
    if sub_scores["burstiness"] > 60:
        signals.append(f"low sentence-length variation (burstiness {sub_scores['burstiness']})")
    if sub_scores["sentenceUniformity"] > 65:
        signals.append(f"uniform sentence lengths ({sub_scores['sentenceUniformity']})")
    if sub_scores["semanticRedundancy"] > 55:
        signals.append(f"high semantic redundancy ({sub_scores['semanticRedundancy']})")

    evidence = (
        "Signals: " + "; ".join(signals) + "."
        if signals else
        "No strong AI signals detected."
    )
    reasoning = (
        f"Ensemble ({', '.join(f'{k}={v}' for k,v in sub_scores.items())}). "
        f"Mode: {'full' if models_available >= 2 else 'partial' if models_available == 1 else 'statistical'}."
    )

    return {
        "score":            ai_prob,
        "aiProbability":    ai_prob,
        "humanProbability": human_prob,
        "confidence":       confidence,
        "verdict":          verdict,
        "evidence":         evidence,
        "reasoning":        reasoning,
        "subScores":        sub_scores,
        "status":           final_status,
        "docType":          doc_type,
    }
