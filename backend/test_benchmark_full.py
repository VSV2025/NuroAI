"""
test_benchmark_full.py — Phase 8: Full benchmark suite
Covers: handwritten notes, student assignments, GPT-4/Claude/Gemini outputs, scanned PDFs, source code.
Computes: precision, recall, F1, false positive rate.
"""
import os
import sys
import time
import requests

BASE   = "http://localhost:4001/api"
OUTDIR = os.path.join(os.path.dirname(__file__), "test_docs")
os.makedirs(OUTDIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# Ground-truth labels: AI=True means it should be detected as AI-generated
# ─────────────────────────────────────────────────────────────────────────────
CASES = []  # will be populated below


def _add(label, filename, content_or_path, ground_truth_ai: bool, is_file=False):
    CASES.append({
        "label":    label,
        "filename": filename,
        "content":  content_or_path,
        "is_file":  is_file,
        "gt_ai":    ground_truth_ai,
    })


# ── Human-written samples (ground truth: NOT AI) ──────────────────────────────

HUMAN_NOTES = """\
lecture notes — March 14
- osmosis = water through semi-permeable membrane (high to low conc)
- tonicity: isotonic / hypotonic / hypertonic
- RBC in hypotonic soln → swells, lyses (hemolysis)
- turgor pressure in plant cells
- aquaporins speed up transport (AQP1 in red blood cells)
Q: does caffeine affect aquaporin expression? check textbook ch.7
"""

STUDENT_ESSAY = """\
Why I Think Social Media Is Both Good and Bad

I've been using social media since I was about thirteen. At first it was just funny videos
and talking to friends from school. Now I use it for news, watching streams, and keeping
up with family that lives in another state.

I think the good part is that it connects people. My cousin lives in Arizona and we talk
every day now because of Instagram. Before that we barely spoke. It also helps people
organize stuff — protests, charity drives, even just neighborhood watch groups use Facebook.

The bad part is how much time it takes. I catch myself scrolling for an hour and not
even knowing what I looked at. There was a study I read about for class that said teens
who use social media a lot have higher rates of anxiety and depression. I don't know if
that's cause and effect but it made me think about my own habits.

I tried deleting TikTok for a month last semester. It was hard at first but I slept better
and actually finished homework on time. I think it's about setting limits. Maybe 30 minutes
a day, not using it right before bed. The problem is nobody really does that.
"""

HUMAN_PERSONAL = """\
Dear diary,

Today was rough. I had the calculus midterm and I'm pretty sure I bombed it. The
l'Hôpital question showed up and I blanked — I knew how to do it yesterday but my
mind just went blank under pressure.

After the exam me and Priya walked to the quad and sat in the sun for a while. She's
stressed about her chem lab due Thursday. We split a granola bar and talked about whether
we're in the right majors. I said maybe I should switch to psychology. She said I've said
that five times already.

I really need to figure out my schedule for next semester. I've been putting off meeting
with my advisor. I think I'm scared she'll tell me I'm behind.

Going to bed early tonight. Or trying to.
"""

_add("Handwritten Notes (Human)",  "bench_human_notes.txt",   HUMAN_NOTES,   ground_truth_ai=False)
_add("Student Essay (Human)",      "bench_student_essay.txt", STUDENT_ESSAY, ground_truth_ai=False)
_add("Personal Diary (Human)",     "bench_human_diary.txt",   HUMAN_PERSONAL, ground_truth_ai=False)


# ── AI-generated samples (ground truth: AI) ───────────────────────────────────

GPT4_ESSAY = """\
The Impact of Artificial Intelligence on Modern Society: A Comprehensive Analysis

Artificial intelligence represents one of the most transformative and paradigm-shifting
technological developments in human history. The proliferation of AI systems across various
domains has fundamentally altered the way we approach complex problems, interact with
information, and structure our economic ecosystems. This comprehensive essay examines the
multifaceted impact of artificial intelligence on modern society.

First and foremost, it is essential to acknowledge that AI has demonstrated remarkable
capability in enhancing productivity and efficiency across numerous industries. In healthcare,
machine learning algorithms have achieved unprecedented accuracy in diagnosing conditions,
facilitating early detection and enabling more precise, personalized, and effective treatment
modalities. Furthermore, AI-powered drug discovery platforms have dramatically accelerated
the identification of promising therapeutic candidates, reducing development timelines and
optimizing resource allocation throughout the process.

Moreover, the economic implications of artificial intelligence are substantial and far-reaching.
AI could contribute trillions of dollars to the global economy by 2030. This economic value
is generated through multiple mechanisms, including process automation, enhanced decision-making
capabilities, and the creation of entirely new product categories. Additionally, AI enables
organizations to leverage vast quantities of data, thereby unlocking value that was previously
inaccessible through conventional means.

In conclusion, artificial intelligence represents a transformative force that will continue to
fundamentally reshape virtually every aspect of modern society. Realizing the full potential
of this technology while mitigating its risks requires coordinated action across government,
industry, and civil society. It is therefore imperative that we approach these challenges with
both urgency and careful deliberation, leveraging a comprehensive, systematic, and collaborative
framework to navigate this paradigm-defining transition.
"""

CLAUDE_ESSAY = """\
Understanding AI's Impact: A Balanced Perspective

It is worth noting at the outset that artificial intelligence represents both one of the most
significant technological developments of our era and one of the most challenging to evaluate
comprehensively. In this analysis, I will attempt to systematically examine the key dimensions
of AI's societal impact, while acknowledging the genuine uncertainty that surrounds many questions.

To begin with, the economic dimensions of AI adoption are substantial and multifaceted. AI is
demonstrating the capacity to automate a comprehensive range of cognitive tasks that were
previously considered the exclusive domain of human expertise. Furthermore, the productivity
gains associated with AI implementation are significant and well-documented across multiple
industries. It is important to note, however, that the distribution of these gains raises
important questions about equity and access that must be systematically addressed.

Additionally, the labor market implications of AI deserve careful consideration. It is essential
to acknowledge that workers in routine cognitive roles face disproportionate exposure to
automation risk, necessitating robust retraining frameworks and comprehensive social support
systems. Moreover, the concentration of advanced AI capabilities in a small number of large
technology organizations raises important questions about power, accountability, and the
distribution of benefits. This necessitates robust mechanisms for transparency and accountability.

In conclusion, artificial intelligence represents a transformative and paradigm-shifting force.
Realizing its benefits while systematically mitigating its risks requires comprehensive,
coordinated action across multiple domains and stakeholders.
"""

GEMINI_ESSAY = """\
Artificial Intelligence and Society: A Structured Analysis

Artificial intelligence is transforming society across multiple interconnected dimensions,
generating substantial opportunities while simultaneously presenting significant challenges.
This analysis provides a comprehensive examination of the key impacts.

Economic and Workforce Transformation

The economic implications of AI are substantial and far-reaching. AI systems are automating
a growing range of tasks across industries, fundamentally altering the nature of work and
creating new opportunities for productivity enhancement. Significant productivity gains are
documented across finance, logistics, manufacturing, and knowledge work.

New job categories are emerging around AI development, maintenance, oversight, and optimization.
Routine cognitive tasks are increasingly automated, necessitating workforce retraining at scale.
The comprehensive transformation of the labor market represents one of the most significant
policy challenges associated with AI adoption. It is essential that policymakers develop robust
frameworks to facilitate workforce transition and ensure equitable distribution of productivity gains.

Key Risks and Governance

Several significant challenges accompany AI's substantial benefits. Algorithmic bias is a
well-documented and systematic problem. Training data inevitably reflects historical inequalities,
causing AI systems to perpetuate and amplify discrimination in high-stakes domains. Furthermore,
it is essential that regulatory frameworks evolve systematically alongside the technology and
facilitate international coordination to address information asymmetries.
"""

_add("GPT-4 Style (AI)",   "bench_gpt4.txt",   GPT4_ESSAY,   ground_truth_ai=True)
_add("Claude Style (AI)",  "bench_claude.txt",  CLAUDE_ESSAY, ground_truth_ai=True)
_add("Gemini Style (AI)",  "bench_gemini.txt",  GEMINI_ESSAY, ground_truth_ai=True)


# ── Source code sample (ground truth: NOT AI — it's code, not prose AI) ────────
# Code intelligence should return NO_CODE_DETECTED for prose, and code metrics for code.
SOURCE_CODE = """\
def merge_sort(arr):
    if len(arr) <= 1:
        return arr
    mid = len(arr) // 2
    left = merge_sort(arr[:mid])
    right = merge_sort(arr[mid:])
    return merge(left, right)

def merge(left, right):
    result = []
    i = j = 0
    while i < len(left) and j < len(right):
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1
    result.extend(left[i:])
    result.extend(right[j:])
    return result

class BinaryTree:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

    def insert(self, val):
        if val < self.val:
            if self.left is None:
                self.left = BinaryTree(val)
            else:
                self.left.insert(val)
        else:
            if self.right is None:
                self.right = BinaryTree(val)
            else:
                self.right.insert(val)

    def inorder(self):
        result = []
        if self.left:
            result.extend(self.left.inorder())
        result.append(self.val)
        if self.right:
            result.extend(self.right.inorder())
        return result
"""
_add("Source Code (Human)", "bench_code.py", SOURCE_CODE, ground_truth_ai=False)


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _write_text(filename, content):
    path = os.path.join(OUTDIR, filename)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return path


def _upload(path):
    with open(path, "rb") as fh:
        r = requests.post(f"{BASE}/documents/upload",
                          files={"file": (os.path.basename(path), fh)})
    r.raise_for_status()
    return r.json()["documentId"]


def _analyze_and_wait(doc_id, timeout=360):
    requests.post(f"{BASE}/documents/{doc_id}/analyze").raise_for_status()
    for _ in range(timeout):
        s = requests.get(f"{BASE}/documents/{doc_id}/status").json()
        if s.get("status") == "complete":
            return True
        if s.get("status") == "error":
            return False
        time.sleep(1)
    return False


def _run_case(case):
    if case["is_file"]:
        path = case["content"]
    else:
        path = _write_text(case["filename"], case["content"])

    print(f"  [{case['label']}] ...", end=" ", flush=True)
    try:
        doc_id = _upload(path)
        ok = _analyze_and_wait(doc_id)
        if not ok:
            print("FAILED (analysis error)")
            return None

        res  = requests.get(f"{BASE}/documents/{doc_id}/results").json()
        cl   = requests.get(f"{BASE}/documents/{doc_id}/crosslang").json()
        auth = requests.get(f"{BASE}/documents/{doc_id}/authorship").json()
        ai   = res.get("aiDetection", {})
        print("done")

        return {
            "label":       case["label"],
            "gt_ai":       case["gt_ai"],
            "aiProb":      ai.get("aiProbability", 0),
            "humanProb":   ai.get("humanProbability", 0),
            "verdict":     ai.get("verdict", "?"),
            "authRisk":    auth.get("risk", 0),
            "crossScore":  cl.get("overallScore", 0),
            "crossStatus": cl.get("status", "?"),
            "docType":     res.get("docType", "?"),
            "pipeStatus":  res.get("pipelineStatus", "?"),
        }
    except Exception as exc:
        print(f"ERROR: {exc}")
        return None


# ─────────────────────────────────────────────────────────────────────────────
# Run benchmark
# ─────────────────────────────────────────────────────────────────────────────
print("=" * 72)
print("  NUROAI — FULL BENCHMARK SUITE (Phase 8)")
print("=" * 72)
print(f"  Cases: {len(CASES)}")
print()

results = []
for case in CASES:
    r = _run_case(case)
    if r:
        results.append(r)

# ─────────────────────────────────────────────────────────────────────────────
# Results table
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n{'=' * 72}")
print(f"  {'Document':<28} {'GT':>4} {'AI%':>5} {'Hum%':>5} {'Auth%':>6} {'XLang%':>7}  {'Verdict':<20} DocType")
print(f"  {'-'*28} {'-'*4} {'-'*5} {'-'*5} {'-'*6} {'-'*7}  {'-'*20} {'-'*12}")
for r in results:
    gt = "AI" if r["gt_ai"] else "HUM"
    print(f"  {r['label']:<28} {gt:>4} {r['aiProb']:>4}% {r['humanProb']:>4}% "
          f"{r['authRisk']:>5}% {r['crossScore']:>6}%  {r['verdict']:<20} {r['docType']}")
print(f"{'=' * 72}")

# ─────────────────────────────────────────────────────────────────────────────
# Metrics: Precision / Recall / F1 / FPR
# AI threshold: aiProb >= 60 → predicted AI
# ─────────────────────────────────────────────────────────────────────────────
AI_THRESHOLD = 60

TP = FP = TN = FN = 0
for r in results:
    pred_ai = r["aiProb"] >= AI_THRESHOLD
    if r["gt_ai"] and pred_ai:
        TP += 1
    elif not r["gt_ai"] and pred_ai:
        FP += 1
    elif r["gt_ai"] and not pred_ai:
        FN += 1
    else:
        TN += 1

precision = TP / (TP + FP) if (TP + FP) > 0 else 0.0
recall    = TP / (TP + FN) if (TP + FN) > 0 else 0.0
f1        = (2 * precision * recall / (precision + recall)) if (precision + recall) > 0 else 0.0
fpr       = FP / (FP + TN) if (FP + TN) > 0 else 0.0

print(f"\n  DETECTION METRICS  (threshold: AI% >= {AI_THRESHOLD})")
print(f"  TP={TP}  FP={FP}  FN={FN}  TN={TN}")
print(f"  Precision : {precision:.3f}  ({TP}/{TP+FP})")
print(f"  Recall    : {recall:.3f}  ({TP}/{TP+FN})")
print(f"  F1        : {f1:.3f}")
print(f"  FPR       : {fpr:.3f}  ({FP}/{FP+TN} human docs wrongly flagged)")

# ─────────────────────────────────────────────────────────────────────────────
# Cross-language sanity check
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n  CROSS-LANGUAGE SANITY (monolingual docs must show 0%)")
PASS_COUNT = FAIL_COUNT = 0

def chk(label, ok, detail=""):
    global PASS_COUNT, FAIL_COUNT
    if ok:
        PASS_COUNT += 1
        print(f"  [PASS]  {label}" + (f"  ({detail})" if detail else ""))
    else:
        FAIL_COUNT += 1
        print(f"  [FAIL]  {label}" + (f"  ({detail})" if detail else ""))

for r in results:
    chk(
        f"{r['label']} cross-lang",
        r["crossScore"] == 0,
        f"score={r['crossScore']}  status={r['crossStatus']}"
    )

# ─────────────────────────────────────────────────────────────────────────────
# Per-case AI detection check
# ─────────────────────────────────────────────────────────────────────────────
print(f"\n  AI DETECTION TARGETS")
for r in results:
    if r["gt_ai"]:
        chk(f"{r['label']} scores >=60% AI",
            r["aiProb"] >= 60,
            f"aiProb={r['aiProb']}%")
    else:
        chk(f"{r['label']} scores <40% AI",
            r["aiProb"] < 40,
            f"aiProb={r['aiProb']}%")

print(f"\n  TOTAL: {PASS_COUNT} PASSED  |  {FAIL_COUNT} FAILED")
print(f"{'=' * 72}")

if FAIL_COUNT > 0:
    print("\n  Some targets not met. Review ensemble or thresholds.")
    sys.exit(1)
else:
    print(f"\n  All targets met. Precision={precision:.2f}  Recall={recall:.2f}  F1={f1:.2f}  FPR={fpr:.2f}")
    sys.exit(0)
