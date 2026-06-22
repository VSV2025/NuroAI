# app/routers/code.py
import re
from fastapi import APIRouter, HTTPException
from ..schemas import CodeIn
from ..services.text_features import jaccard, pct

router = APIRouter()

KEYWORDS = {
    "function", "return", "for", "while", "if", "else", "let", "const", "var",
    "class", "def", "import", "from", "public", "private", "static", "void",
    "int", "string", "new", "this", "true", "false", "null",
}


def tokenize(code):
    no_comments = re.sub(r"//.*$", "", code, flags=re.M)
    no_comments = re.sub(r"/\*[\s\S]*?\*/", "", no_comments)
    return re.findall(r"[A-Za-z_]\w*|[{}();=+\-*/<>.,\[\]]", no_comments)


def normalize(tokens):
    """Replace identifiers (non-keywords) with a generic token so renamed
    variables look identical — this beats 'rename to evade' cheating."""
    return ["ID" if (re.fullmatch(r"[A-Za-z_]\w*", t) and t not in KEYWORDS) else t
            for t in tokens]


def shingles(tokens, k=3):
    return {" ".join(tokens[i:i + k]) for i in range(len(tokens) - k + 1)}


def structure(tokens):
    """Control-flow signature: keywords/braces only, ignoring all names."""
    return {t for t in tokens if t in KEYWORDS or t in "{}();"}


# POST /api/code/compare   Body: { left, right }
@router.post("/compare")
def compare(body: CodeIn):
    left = body.left or ""
    right = body.right or ""
    if not left.strip() or not right.strip():
        raise HTTPException(400, "Provide both 'left' and 'right' code samples")

    lt, rt = tokenize(left), tokenize(right)
    raw_sim = jaccard(shingles(lt), shingles(rt))                        # surface match
    norm_sim = jaccard(shingles(normalize(lt)), shingles(normalize(rt)))   # ignores names
    struct_sim = jaccard(structure(lt), structure(rt))                   # control-flow shape
    rename_evasion = (norm_sim - raw_sim) > 0.25

    return {
        "codeSimilarity": pct(norm_sim * 100),
        "logicSimilarity": pct(struct_sim * 100),
        "astMatch": pct(((norm_sim + struct_sim) / 2) * 100),
        "structure": pct(struct_sim * 100),
        "rawSimilarity": pct(raw_sim * 100),
        "renameEvasion": rename_evasion,
        "note": "Identifiers differ but structure/logic are near-identical — likely "
                "variable-rename evasion." if rename_evasion else "No strong rename-evasion signal.",
    }
