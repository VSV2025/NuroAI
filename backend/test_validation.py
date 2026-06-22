"""
test_validation.py — End-to-end validation with 5 real document types.
Prints full metrics per document, then PASS/FAIL for every module.
"""
import io, os, struct, time, zlib
import requests

BASE    = "http://localhost:4001/api"
OUTDIR  = os.path.join(os.path.dirname(__file__), "test_docs")
os.makedirs(OUTDIR, exist_ok=True)

PASS_COUNT = 0
FAIL_COUNT = 0
results_by_doc = {}

# ── helpers ────────────────────────────────────────────────────────────────────

def _check(label, ok, detail=""):
    global PASS_COUNT, FAIL_COUNT
    sym = "PASS" if ok else "FAIL"
    if ok:
        PASS_COUNT += 1
    else:
        FAIL_COUNT += 1
    print(f"  [{sym}]  {label}" + (f"  ({detail})" if detail else ""))

def _upload(path):
    with open(path, "rb") as fh:
        r = requests.post(f"{BASE}/documents/upload",
                          files={"file": (os.path.basename(path), fh)})
    r.raise_for_status()
    return r.json()["documentId"]

def _analyze_and_wait(doc_id, timeout=180):
    requests.post(f"{BASE}/documents/{doc_id}/analyze").raise_for_status()
    for _ in range(timeout):
        s = requests.get(f"{BASE}/documents/{doc_id}/status").json()
        if s.get("status") == "complete":
            return True
        if s.get("status") == "error":
            return False
        time.sleep(1)
    return False

def _collect(doc_id):
    results  = requests.get(f"{BASE}/documents/{doc_id}/results").json()
    auth     = requests.get(f"{BASE}/documents/{doc_id}/authorship").json()
    cl       = requests.get(f"{BASE}/documents/{doc_id}/crosslang").json()
    exp      = requests.get(f"{BASE}/documents/{doc_id}/explain").json()
    code     = requests.get(f"{BASE}/documents/{doc_id}/code").json()
    ocr_dbg  = requests.get(f"{BASE}/documents/{doc_id}/ocr-debug").json()
    return results, auth, cl, exp, code, ocr_dbg

def _print_metrics(label, doc_id, results, auth, cl, exp, code, ocr_dbg):
    ai  = results.get("aiDetection", {})
    ocr = results.get("ocr", ocr_dbg)
    print(f"\n{'='*62}")
    print(f"  {label}")
    print(f"{'='*62}")
    print(f"  doc_id              : {doc_id}")
    print(f"  OCR engine          : {ocr.get('ocrEngine','?')}")
    print(f"  OCR confidence      : {ocr.get('ocrConfidence','?')}%")
    print(f"  Extracted text len  : {ocr.get('textLength', ocr_dbg.get('textLength','?'))} chars")
    print(f"  OCR status          : {ocr.get('ocrStatus','?')}")
    print(f"  Pipeline status     : {results.get('pipelineStatus','?')}")
    print(f"  AI probability      : {ai.get('aiProbability','?')}%")
    print(f"  Human probability   : {ai.get('humanProbability','?')}%")
    print(f"  AI verdict          : {ai.get('verdict','?')}")
    print(f"  AI subScores        : {ai.get('subScores',{})}")
    print(f"  Authorship risk     : {auth.get('risk','?')}%")
    print(f"  Authorship verdict  : {auth.get('verdict','?')}")
    auth_features = auth.get('features', {})
    if auth_features:
        print(f"  Auth features       : burst={auth_features.get('burstiness','?'):.2f}  "
              f"vocab={auth_features.get('vocabulary_richness','?'):.3f}  "
              f"flesch={auth_features.get('flesch','?'):.1f}")
    print(f"  Cross-lang score    : {cl.get('overallScore','?')}%")
    langs = cl.get("langs", [])
    if langs:
        print(f"  Cross-lang langs    : " +
              "  ".join(f"{l['code']}={l['sim']}%" for l in langs))
    secs = exp.get("sections", [])
    print(f"  Explainability spans: {len(secs)}")
    code_status = code.get("status","?")
    code_sim    = code.get("codeSimilarity", 0)
    print(f"  Code status         : {code_status}  similarity={code_sim}%")


def run(label, path):
    print(f"\nUploading [{label}] …", end=" ", flush=True)
    doc_id = _upload(path)
    print(f"id={doc_id[:8]}  analysing…", end=" ", flush=True)
    ok = _analyze_and_wait(doc_id)
    if not ok:
        print("FAILED")
        results_by_doc[label] = None
        return
    print("done")
    res, auth, cl, exp, code, ocr_dbg = _collect(doc_id)
    _print_metrics(label, doc_id, res, auth, cl, exp, code, ocr_dbg)
    results_by_doc[label] = {
        "doc_id": doc_id,
        "results": res, "auth": auth, "cl": cl,
        "exp": exp, "code": code, "ocr_dbg": ocr_dbg,
    }


# ── Document 1: Handwritten simulation (image with hand-drawn text) ────────────
def _make_handwritten_png():
    """Draw multi-line text on a PNG. Pure black on white gives best OCR accuracy."""
    from PIL import Image, ImageDraw, ImageFont
    W, H = 800, 1100
    img  = Image.new("RGB", (W, H), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.load_default(size=48)
    except TypeError:
        font = ImageFont.load_default()

    lines = [
        "Dear Journal,",
        "Today was an unusual day. I woke up early",
        "and noticed the sky had turned a strange",
        "shade of orange. My neighbour was outside",
        "watering her roses despite the wind.",
        "We talked for a while about the garden",
        "and about how quickly the seasons change.",
        "Later I walked to the market on Birch Street",
        "and bought fresh bread and some tomatoes.",
        "The bread was warm and smelled wonderful.",
        "On the way home I passed the old library",
        "and remembered my father used to take me",
        "there every Saturday morning as a child.",
        "It is strange how smells bring back memories.",
        "I think I will go back tomorrow.",
        "Best, A.",
    ]
    y = 40
    for line in lines:
        draw.text((40, y), line, fill=(0, 0, 0), font=font)
        y += 62
    path = os.path.join(OUTDIR, "handwritten_sim.png")
    img.save(path, dpi=(150, 150))
    return path

# Document 2: AI-generated text
AI_TEXT = """\
Artificial intelligence represents a transformative paradigm shift in modern society.
The integration of machine learning algorithms into everyday workflows demonstrates
significant potential for optimization. Furthermore, natural language processing
capabilities enable automated systems to facilitate communication effectively.
The proliferation of deep neural networks has accelerated progress across multiple domains.
Additionally, reinforcement learning methodologies provide robust frameworks for
autonomous decision-making processes. These technological advancements collectively
contribute to a comprehensive ecosystem of intelligent automation systems.
The systematic implementation of these tools yields measurable improvements in efficiency.
Organizations across diverse sectors are actively exploring integration strategies.
The potential for productivity enhancement is substantial and well-documented.
"""

# Document 3: Human-written typed
HUMAN_TEXT = """\
I've been trying to fix the leak under my kitchen sink for three weeks now.
Every time I think I've sorted it, I come home to another puddle on the floor.
Last Tuesday I bought a new washer from the hardware shop -- the guy behind the counter
said it was definitely the right size -- but when I got home it didn't quite fit.
My partner suggested calling a plumber but honestly the quotes we've been given are
ridiculous. Seventy quid just to come and look at it? You're having a laugh.
So I watched about fourteen YouTube videos and ordered a set of spanners online.
The spanners arrived yesterday. Wrong size, obviously. Sent them back this morning.
The thing is I know I could fix this if I just had the right tools and a bit more patience.
My dad could fix anything around the house. I should have paid more attention.
Anyway, the bucket under the sink is doing its job for now. Progress, I suppose.
"""

# Document 4: Scanned PDF simulation (PDF containing an image, no selectable text)
def _make_scanned_pdf():
    """Create an image-only PDF by saving a PIL image directly as PDF (no selectable text)."""
    from PIL import Image, ImageDraw, ImageFont
    W, H = 800, 1100
    img  = Image.new("RGB", (W, H), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    try:
        font_lg = ImageFont.load_default(size=44)
        font_sm = ImageFont.load_default(size=32)
    except TypeError:
        font_lg = font_sm = ImageFont.load_default()

    lines = [
        ("UNIVERSITY EXAMINATION PAPER", font_lg),
        ("Subject: Introduction to Computer Science", font_sm),
        ("Time allowed: 2 hours", font_sm),
        ("", font_sm),
        ("Question 1: Compiler vs Interpreter", font_sm),
        ("An interpreter executes source code line by line.", font_sm),
        ("A compiler translates the entire source into machine code.", font_sm),
        ("", font_sm),
        ("Question 2: Explain recursion with an example.", font_sm),
        ("Recursion is when a function calls itself with a smaller input.", font_sm),
        ("Base case: factorial of zero equals one.", font_sm),
        ("Recursive: factorial of n equals n times factorial of n minus one.", font_sm),
        ("", font_sm),
        ("Question 3: Stack versus queue.", font_sm),
        ("A stack is last in first out.", font_sm),
        ("A queue is first in first out.", font_sm),
    ]
    y = 60
    for text, font in lines:
        if text:
            draw.text((60, y), text, fill=(0, 0, 0), font=font)
        y += 55

    # PIL native PDF save — image-only PDF, no selectable text layer
    pdf_path = os.path.join(OUTDIR, "scanned_exam.pdf")
    img.save(pdf_path, "PDF", resolution=150)
    return pdf_path

# Document 5: Source code file
CODE_TEXT = """\
import os
import json
from typing import List, Dict, Optional

class DocumentProcessor:
    def __init__(self, upload_dir: str):
        self.upload_dir = upload_dir
        os.makedirs(upload_dir, exist_ok=True)

    def process(self, filepath: str) -> Dict:
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")
        ext = os.path.splitext(filepath)[1].lower()
        if ext == ".txt":
            return self._read_text(filepath)
        elif ext == ".json":
            return self._read_json(filepath)
        else:
            raise ValueError(f"Unsupported file type: {ext}")

    def _read_text(self, path: str) -> Dict:
        with open(path, "r", encoding="utf-8") as f:
            content = f.read()
        return {"type": "text", "length": len(content), "lines": content.count("\\n")}

    def _read_json(self, path: str) -> Dict:
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
        return {"type": "json", "keys": list(data.keys()) if isinstance(data, dict) else []}

def batch_process(paths: List[str], upload_dir: str) -> List[Dict]:
    processor = DocumentProcessor(upload_dir)
    results = []
    for p in paths:
        try:
            results.append(processor.process(p))
        except Exception as e:
            results.append({"error": str(e), "path": p})
    return results

if __name__ == "__main__":
    sample_paths = ["data.txt", "config.json"]
    output = batch_process(sample_paths, "./uploads")
    for r in output:
        print(r)
"""

# ── Build all docs ────────────────────────────────────────────────────────────
def _write(name, content):
    path = os.path.join(OUTDIR, name)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return path

print("Building test documents …")
hw_path    = _make_handwritten_png()
ai_path    = _write("ai_generated.txt", AI_TEXT)
human_path = _write("human_typed.txt", HUMAN_TEXT)
scan_path  = _make_scanned_pdf()
code_path  = _write("processor.py", CODE_TEXT)

# ── Run all uploads ───────────────────────────────────────────────────────────
run("Handwritten (image)",     hw_path)
run("AI-generated text",       ai_path)
run("Human-written typed",     human_path)
run("Scanned PDF",             scan_path)
run("Source code (.py)",       code_path)

# ── PASS/FAIL checks ─────────────────────────────────────────────────────────
print(f"\n\n{'='*62}")
print("  MODULE VERIFICATION")
print(f"{'='*62}")

def _get(label):
    return results_by_doc.get(label)

hw    = _get("Handwritten (image)")
ai    = _get("AI-generated text")
human = _get("Human-written typed")
scan  = _get("Scanned PDF")
code  = _get("Source code (.py)")

# ── OCR Module ────────────────────────────────────────────────────────────────
print("\n  OCR MODULE")
if hw:
    ocr_hw = hw["results"].get("ocr", hw["ocr_dbg"])
    _check("Handwritten image not OCR_FAILED",
           ocr_hw.get("ocrStatus") != "FAILED",
           f"status={ocr_hw.get('ocrStatus')} engine={ocr_hw.get('ocrEngine')}")
    _check("Handwritten image extracted some text",
           ocr_hw.get("textLength", 0) > 10,
           f"textLength={ocr_hw.get('textLength')}")
if scan:
    ocr_sc = scan["results"].get("ocr", scan["ocr_dbg"])
    _check("Scanned PDF not OCR_FAILED",
           ocr_sc.get("ocrStatus") != "FAILED",
           f"status={ocr_sc.get('ocrStatus')} engine={ocr_sc.get('ocrEngine')}")
    _check("Scanned PDF used non-plaintext OCR",
           ocr_sc.get("ocrEngine") in ("paddleocr", "tesseract", "trocr"),
           f"engine={ocr_sc.get('ocrEngine')}")
if ai:
    ocr_ai = ai["results"].get("ocr", {})
    _check("Text files use plaintext engine",
           ocr_ai.get("ocrEngine") == "plaintext",
           f"engine={ocr_ai.get('ocrEngine')}")

# ── AI Detection Module ───────────────────────────────────────────────────────
print("\n  AI DETECTION MODULE")
if ai and human:
    ai_prob_ai    = ai["results"].get("aiDetection", {}).get("aiProbability", 0)
    ai_prob_human = human["results"].get("aiDetection", {}).get("aiProbability", 0)
    _check("AI text scores higher aiProbability than human text",
           ai_prob_ai > ai_prob_human,
           f"ai={ai_prob_ai}% vs human={ai_prob_human}%")
    _check("Human text humanProbability > 50",
           human["results"].get("aiDetection", {}).get("humanProbability", 0) > 50,
           f"humanProbability={human['results'].get('aiDetection',{}).get('humanProbability')}")
if ai:
    ai_det = ai["results"].get("aiDetection", {})
    _check("AI detection has verdict",
           bool(ai_det.get("verdict")), f"verdict={ai_det.get('verdict')}")
    _check("AI detection has subScores",
           bool(ai_det.get("subScores")), f"subScores={ai_det.get('subScores')}")
    _check("AI detection status is ok",
           ai_det.get("status") == "ok", f"status={ai_det.get('status')}")

# ── Authorship Module ─────────────────────────────────────────────────────────
print("\n  AUTHORSHIP MODULE")
if ai and human:
    auth_ai    = ai["auth"]
    auth_human = human["auth"]
    risk_ai    = auth_ai.get("risk", 0)
    risk_human = auth_human.get("risk", 0)
    _check("Different documents have different authorship risk scores",
           risk_ai != risk_human,
           f"ai_risk={risk_ai} human_risk={risk_human}")
    feat_ai = auth_ai.get("features", {})
    feat_hm = auth_human.get("features", {})
    burst_diff = abs(feat_ai.get("burstiness", 0) - feat_hm.get("burstiness", 0))
    _check("Burstiness differs between AI and human text",
           burst_diff > 0.5,
           f"ai={feat_ai.get('burstiness','?'):.2f} human={feat_hm.get('burstiness','?'):.2f}")
    _check("Authorship radar chart present for AI text",
           len(auth_ai.get("radar", [])) == 6,
           f"radar_len={len(auth_ai.get('radar', []))}")
    _check("Authorship radar chart present for human text",
           len(auth_human.get("radar", [])) == 6)

# ── Cross-Language Module ─────────────────────────────────────────────────────
print("\n  CROSS-LANGUAGE MODULE")
if ai and human:
    cl_ai    = ai["cl"].get("overallScore", 0)
    cl_human = human["cl"].get("overallScore", 0)
    # Phase 2: monolingual English documents should return 0% (LANGUAGE_NOT_PRESENT)
    _check("Cross-language: monolingual docs return 0%",
           cl_ai == 0 and cl_human == 0,
           f"ai={cl_ai}% human={cl_human}%")
if ai:
    cl_status = ai["cl"].get("status", "?")
    # Phase 7: English-only document must trigger LANGUAGE_NOT_PRESENT gate
    _check("Cross-language returns LANGUAGE_NOT_PRESENT for English-only docs",
           cl_status == "LANGUAGE_NOT_PRESENT",
           f"status={cl_status}")

# ── Explainability Module ─────────────────────────────────────────────────────
print("\n  EXPLAINABILITY MODULE")
if ai:
    secs_ai = ai["exp"].get("sections", [])
    _check("AI text has explainability evidence spans",
           len(secs_ai) > 0, f"sections={len(secs_ai)}")
    if secs_ai:
        first = secs_ai[0]
        _check("Evidence span has text field", bool(first.get("text")))
        _check("Evidence span has risk classification", bool(first.get("risk")))
        _check("Evidence span has reason", bool(first.get("reason")))
if human:
    secs_hm = human["exp"].get("sections", [])
    _check("Human text has explainability evidence spans",
           len(secs_hm) > 0, f"sections={len(secs_hm)}")

# ── Code Intelligence Module ──────────────────────────────────────────────────
print("\n  CODE INTELLIGENCE MODULE")
if code:
    code_resp = code["code"]
    _check("Code file detected as code",
           code_resp.get("status") == "ok",
           f"status={code_resp.get('status')}")
    _check("Code file has codeSimilarity score",
           "codeSimilarity" in code_resp,
           f"keys={list(code_resp.keys())}")
if human:
    human_code = human["code"]
    _check("Prose document returns NO_CODE_DETECTED",
           human_code.get("status") == "NO_CODE_DETECTED",
           f"status={human_code.get('status')}")

# ── Pipeline Gate Module ──────────────────────────────────────────────────────
print("\n  PIPELINE GATE MODULE")
for lbl in ["AI-generated text", "Human-written typed", "Source code (.py)"]:
    d = _get(lbl)
    if d:
        _check(f"{lbl}: pipelineStatus=OK",
               d["results"].get("pipelineStatus") == "OK",
               f"pipelineStatus={d['results'].get('pipelineStatus')}")

# ── Hardcoded-value scan ──────────────────────────────────────────────────────
print("\n  HARDCODED VALUE SCAN")
import subprocess, sys
src = r"C:\Users\drgsr\Downloads\nuroai\src\App.tsx"
patterns = [r"v:\s*88\b", r"v:\s*76\b", r"v:\s*82\b", r"v:\s*91\b",
            r"sim:\s*84\b", r"sim:\s*71\b", r"sim:\s*66\b", r"sim:\s*58\b",
            r'"value":\s*84\b', r'"value":\s*71\b']
found = []
try:
    with open(src, encoding="utf-8") as f:
        content = f.read()
    import re
    for p in patterns:
        if re.search(p, content):
            found.append(p)
except Exception as e:
    found.append(f"(scan error: {e})")
_check("No hardcoded demo metric values in App.tsx",
       len(found) == 0,
       f"found: {found}" if found else "clean")

# ── Summary ────────────────────────────────────────────────────────────────────
print(f"\n{'='*62}")
print(f"  TOTAL:  {PASS_COUNT} PASSED  |  {FAIL_COUNT} FAILED")
print(f"{'='*62}")
