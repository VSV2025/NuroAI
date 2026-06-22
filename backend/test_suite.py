"""
test_suite.py — NuroAI end-to-end test suite
Tests 7 document types using the requests library only (no multipart PowerShell).
"""
import io
import json
import os
import sys
import time

import requests

BASE = "http://localhost:4001"
UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "test_docs")
os.makedirs(UPLOAD_DIR, exist_ok=True)

PASS = 0
FAIL = 0


def _create_text_file(name: str, content: str) -> str:
    path = os.path.join(UPLOAD_DIR, name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return path


def upload_and_analyze(path: str, label: str) -> dict | None:
    filename = os.path.basename(path)
    print(f"\n{'='*60}")
    print(f"TEST: {label}  [{filename}]")
    print("="*60)

    with open(path, "rb") as fh:
        r = requests.post(f"{BASE}/api/documents/upload",
                          files={"file": (filename, fh)})
    if r.status_code != 200:
        print(f"  UPLOAD FAILED: {r.status_code} {r.text[:200]}")
        return None

    doc_id = r.json()["documentId"]
    print(f"  Uploaded  doc_id={doc_id}")

    r2 = requests.post(f"{BASE}/api/documents/{doc_id}/analyze")
    if r2.status_code != 200:
        print(f"  ANALYZE FAILED: {r2.status_code} {r2.text[:200]}")
        return None
    print("  Analysis started")

    # poll status
    for _ in range(60):
        time.sleep(2)
        s = requests.get(f"{BASE}/api/documents/{doc_id}/status").json()
        if s.get("status") == "complete":
            break
    else:
        print("  TIMEOUT waiting for analysis")
        return None

    res = requests.get(f"{BASE}/api/documents/{doc_id}/results")
    if res.status_code != 200:
        print(f"  RESULTS FAILED: {res.status_code} {res.text[:200]}")
        return None

    data = res.json()
    return data


def check(label: str, condition: bool, detail: str = "") -> None:
    global PASS, FAIL
    if condition:
        PASS += 1
        print(f"  PASS  {label}" + (f" — {detail}" if detail else ""))
    else:
        FAIL += 1
        print(f"  FAIL  {label}" + (f" — {detail}" if detail else ""))


def run_test(label: str, path: str, assertions) -> None:
    data = upload_and_analyze(path, label)
    if data is None:
        global FAIL
        FAIL += 1
        print(f"  FAIL  upload/analysis pipeline returned None")
        return
    assertions(data)


# ─── Test 1: Human essay ─────────────────────────────────────────────────────
HUMAN_ESSAY = _create_text_file("human_essay.txt", """\
The relationship between technology and education has always been complex.
When the printing press was invented, scholars feared it would make people lazy.
Similar anxieties surrounded television, calculators, and the internet.
Yet each technology ultimately expanded access to information in ways that
previous generations could not have imagined. The key distinction is not
between using technology and avoiding it, but between passive consumption
and active engagement. A student who uses a calculator without understanding
arithmetic is poorly served; one who uses it to explore mathematical patterns
is enriched. This same principle applies to every generation of educational tools.
""")

def test_human_essay(data):
    s = data.get("scores", {})
    ai = data.get("aiDetection", {})
    check("pipelineStatus OK", data.get("pipelineStatus") == "OK",
          f"got {data.get('pipelineStatus')}")
    check("authenticity > 0", s.get("authenticity", 0) > 0,
          f"authenticity={s.get('authenticity')}")
    check("AI probability < 70", (ai.get("aiProbability") or 0) < 70,
          f"aiProbability={ai.get('aiProbability')}")
    check("humanProbability present", ai.get("humanProbability") is not None)
    check("verdict present", bool(ai.get("verdict")))

run_test("Human essay", HUMAN_ESSAY, test_human_essay)


# ─── Test 2: AI-generated essay ──────────────────────────────────────────────
AI_ESSAY = _create_text_file("ai_essay.txt", """\
Artificial intelligence represents a transformative paradigm shift in modern society.
The integration of machine learning algorithms into everyday workflows demonstrates
significant potential for optimization. Furthermore, natural language processing
capabilities enable automated systems to facilitate communication. The proliferation
of deep neural networks has accelerated progress across multiple domains.
Additionally, reinforcement learning methodologies provide robust frameworks for
autonomous decision-making. These technological advancements collectively contribute
to a comprehensive ecosystem of intelligent automation. The systematic implementation
of these tools yields measurable improvements in efficiency metrics.
""")

def test_ai_essay(data):
    ai = data.get("aiDetection", {})
    check("pipelineStatus OK", data.get("pipelineStatus") == "OK")
    check("aiProbability present", ai.get("aiProbability") is not None)
    check("humanProbability present", ai.get("humanProbability") is not None)
    check("subScores present", bool(ai.get("subScores")),
          f"subScores={ai.get('subScores')}")
    check("verdict present", bool(ai.get("verdict")))

run_test("AI essay", AI_ESSAY, test_ai_essay)


# ─── Test 3: Source code file ─────────────────────────────────────────────────
CODE_FILE = _create_text_file("fibonacci.py", """\
def fibonacci(n):
    if n <= 0:
        return []
    elif n == 1:
        return [0]
    seq = [0, 1]
    while len(seq) < n:
        seq.append(seq[-1] + seq[-2])
    return seq

class FibonacciCalculator:
    def __init__(self, limit):
        self.limit = limit

    def compute(self):
        return fibonacci(self.limit)

if __name__ == "__main__":
    calc = FibonacciCalculator(10)
    print(calc.compute())
""")

def test_code_file(data):
    code = requests.get(
        f"{BASE}/api/documents/{data['documentId']}/code"
    ).json()
    check("pipelineStatus OK", data.get("pipelineStatus") == "OK")
    check("code status present", "status" in code,
          f"code response keys: {list(code.keys())}")
    check("OCR engine is plaintext",
          data.get("ocr", {}).get("ocrEngine") == "plaintext",
          f"ocrEngine={data.get('ocr', {}).get('ocrEngine')}")

run_test("Source code file (.py)", CODE_FILE, test_code_file)


# ─── Test 4: Empty document ───────────────────────────────────────────────────
EMPTY_FILE = _create_text_file("empty.txt", "")

def test_empty(data):
    ps = data.get("pipelineStatus")
    check("pipelineStatus is INSUFFICIENT_TEXT or OCR_FAILED",
          ps in ("INSUFFICIENT_TEXT", "OCR_FAILED"),
          f"pipelineStatus={ps}")

run_test("Empty document", EMPTY_FILE, test_empty)


# ─── Test 5: Short text (<50 chars) ──────────────────────────────────────────
SHORT_FILE = _create_text_file("short.txt", "Hello world.")

def test_short(data):
    ps = data.get("pipelineStatus")
    check("pipeline blocked on short text",
          ps in ("INSUFFICIENT_TEXT", "OCR_FAILED"),
          f"pipelineStatus={ps}")

run_test("Short text (<50 chars)", SHORT_FILE, test_short)


# ─── Test 6: Mixed-language document ─────────────────────────────────────────
MULTILANG_FILE = _create_text_file("multilang.txt", """\
El aprendizaje automático ha transformado múltiples industrias.
Die künstliche Intelligenz verändert die Welt grundlegend.
L'intelligence artificielle révolutionne notre façon de travailler.
Machine learning algorithms process vast amounts of information efficiently.
La inteligencia artificial tiene un gran impacto en la educación moderna.
Diese Technologie ermöglicht es uns, komplexe Probleme zu lösen.
Les systèmes d'IA apprennent à partir de données massives.
Deep neural networks have demonstrated remarkable capabilities in recent years.
""")

def test_multilang(data):
    s = data.get("scores", {})
    check("pipelineStatus OK", data.get("pipelineStatus") == "OK")
    check("scores returned", all(k in s for k in ("authenticity", "risk", "confidence")))
    cross_r = requests.get(
        f"{BASE}/api/documents/{data['documentId']}/crosslang"
    ).json()
    check("crosslang response has langs", isinstance(cross_r.get("langs"), list))

run_test("Mixed-language document", MULTILANG_FILE, test_multilang)


# ─── Test 7: PNG image ────────────────────────────────────────────────────────
try:
    from PIL import Image, ImageDraw, ImageFont
    import numpy as np

    img = Image.new("RGB", (400, 120), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((10, 40), "Sample text for OCR testing.", fill=(0, 0, 0))
    img_path = os.path.join(UPLOAD_DIR, "sample.png")
    img.save(img_path)

    def test_image(data):
        ocr = data.get("ocr", {})
        check("OCR engine is paddleocr or trocr or failed",
              ocr.get("ocrEngine") in ("paddleocr", "trocr", "none", "plaintext", None),
              f"ocrEngine={ocr.get('ocrEngine')}")
        check("ocrStatus present", "ocrStatus" in ocr,
              f"ocr keys: {list(ocr.keys())}")

    run_test("PNG image", img_path, test_image)

except ImportError:
    print("\nSKIP  PNG image test (PIL not installed)")


# ─── Summary ──────────────────────────────────────────────────────────────────
print(f"\n{'='*60}")
print(f"RESULTS:  {PASS} passed,  {FAIL} failed")
print("="*60)
sys.exit(0 if FAIL == 0 else 1)
