# app/routers/crosslang.py
from fastapi import APIRouter
from ..schemas import CrossLangIn
from ..services.multilingual import detect_cross_language

router = APIRouter()


# POST /api/crosslang/analyze   Body: { text }
@router.post("/analyze")
def analyze(body: CrossLangIn):
    text = (body.text or "").strip()
    if not text:
        return {
            "status":                "NO_TEXT",
            "overallScore":          0,
            "sourceLanguage":        "Unknown",
            "targetLanguage":        "N/A",
            "translationSimilarity": 0,
            "semanticSimilarity":    0.0,
            "langs":                 [],
            "evidence":              "No text provided.",
        }

    result = detect_cross_language(text)
    base_score  = result.get("score", 0)
    cross_status = result.get("status", "ok")
    langs        = result.get("langs", [])
    cosine_max   = result.get("cosineMax", base_score / 100 if base_score else 0)

    if cross_status == "LANGUAGE_NOT_PRESENT":
        return {
            "status":                "LANGUAGE_NOT_PRESENT",
            "overallScore":          0,
            "sourceLanguage":        "English (EN)",
            "targetLanguage":        "N/A",
            "translationSimilarity": 0,
            "semanticSimilarity":    0.0,
            "langs":                 [],
            "evidence":              result.get("evidence", "Monolingual document."),
        }

    _LANG_NAMES = {
        "es": "Spanish", "zh": "Chinese", "zh-cn": "Chinese", "zh-tw": "Chinese",
        "fr": "French",  "de": "German",  "ar": "Arabic",     "pt": "Portuguese",
        "ru": "Russian", "ja": "Japanese", "ko": "Korean",    "it": "Italian",
    }
    lang_items = []
    for i, code in enumerate(langs):
        if code in ("en",):
            continue
        name     = _LANG_NAMES.get(code, code.upper())
        lang_sim = min(99, max(0, round(base_score * (0.9 ** i))))
        lang_items.append({"code": code.upper(), "name": name,
                            "similarity": lang_sim})

    top = lang_items[0] if lang_items else {"name": "Unknown", "code": "??", "similarity": 0}

    return {
        "status":                cross_status,
        "overallScore":          base_score,
        "sourceLanguage":        "English (EN)",
        "targetLanguage":        f"{top['name']} ({top['code']})",
        "translationSimilarity": top["similarity"],
        "semanticSimilarity":    round(cosine_max, 2),
        "langs":                 lang_items,
        "evidence":              result.get("evidence", ""),
        "mapping":               [{"code": l["code"], "name": l["name"],
                                   "similarity": l["similarity"]} for l in lang_items],
    }
