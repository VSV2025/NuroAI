"""
test_benchmark.py — Final AI detection benchmark.
Four essay types: GPT-4 style, Claude style, Gemini style, Human-written.
Prints AI probability, human probability, authorship risk, confidence.
"""
import os, time, sys
import requests

BASE   = "http://localhost:4001/api"
OUTDIR = os.path.join(os.path.dirname(__file__), "test_docs")
os.makedirs(OUTDIR, exist_ok=True)

# ─────────────────────────────────────────────────────────────────────────────
# Four benchmark essays (~1000 words each)
# ─────────────────────────────────────────────────────────────────────────────

GPT4_ESSAY = """\
The Impact of Artificial Intelligence on Modern Society: A Comprehensive Analysis

Artificial intelligence represents one of the most transformative and paradigm-shifting technological \
developments in human history. The proliferation of AI systems across various domains has fundamentally \
altered the way we approach complex problems, interact with information, and structure our economic \
ecosystems. This comprehensive essay examines the multifaceted impact of artificial intelligence on \
modern society, exploring both its significant benefits and the substantial challenges it presents.

First and foremost, it is essential to acknowledge that AI has demonstrated remarkable capability in \
enhancing productivity and efficiency across numerous industries. In healthcare, machine learning \
algorithms have achieved unprecedented accuracy in diagnosing conditions, facilitating early detection \
and enabling more precise, personalized, and effective treatment modalities. Furthermore, AI-powered \
drug discovery platforms have dramatically accelerated the identification of promising therapeutic \
candidates, reducing development timelines and optimizing resource allocation throughout the process.

Moreover, the economic implications of artificial intelligence are substantial and far-reaching. \
AI could contribute trillions of dollars to the global economy by 2030. This economic value is \
generated through multiple mechanisms, including process automation, enhanced decision-making \
capabilities, and the creation of entirely new product categories. Additionally, AI enables \
organizations to leverage vast quantities of data, thereby unlocking value that was previously \
inaccessible through conventional means.

However, it is important to note that significant challenges and risks are associated with the \
widespread adoption of artificial intelligence. The displacement of workers through automation \
represents a pressing social concern that demands thoughtful policy responses and systematic \
intervention. While historical technological transitions have ultimately generated new forms of \
employment, the pace of AI-driven automation may outstrip the economy's capacity to generate \
suitable replacement opportunities, particularly for workers in routine cognitive and physical \
roles. This necessitates substantial investment in workforce retraining initiatives and \
comprehensive educational reform to ensure equitable distribution of AI's economic benefits.

Furthermore, questions regarding algorithmic bias and fairness present fundamental ethical \
challenges that must be systematically addressed. AI systems trained on historical data inevitably \
encode existing societal biases, potentially perpetuating and amplifying discriminatory patterns \
in high-stakes domains such as criminal justice, lending, and hiring. Addressing these issues \
requires robust technical solutions alongside structural interventions that account for the \
broader social contexts in which these systems operate.

The governance of artificial intelligence presents additional complexity. The development of \
appropriate regulatory frameworks must balance the imperative to foster innovation with the \
necessity of protecting individual rights and societal welfare. International coordination is \
particularly challenging given the competitive dynamics between major AI powers, yet it is \
essential to prevent a regulatory race to the bottom that could compromise safety standards \
globally. In this context, multi-stakeholder collaboration becomes a pivotal component of \
any comprehensive governance strategy.

In conclusion, artificial intelligence represents a transformative force that will continue to \
fundamentally reshape virtually every aspect of modern society. Realizing the full potential of \
this technology while mitigating its risks requires coordinated action across government, \
industry, and civil society. The decisions we make today regarding the development, deployment, \
and governance of artificial intelligence will have profound implications for human flourishing \
in the decades to come. It is therefore imperative that we approach these challenges with both \
urgency and careful deliberation, leveraging a comprehensive, systematic, and collaborative \
framework to navigate this paradigm-defining transition.
"""

CLAUDE_ESSAY = """\
Understanding AI's Impact: A Balanced Perspective

It is worth noting at the outset that artificial intelligence represents both one of the most \
significant technological developments of our era and one of the most challenging to evaluate \
comprehensively. In this analysis, I will attempt to systematically examine the key dimensions \
of AI's societal impact, while acknowledging the genuine uncertainty that surrounds many of \
these questions.

To begin with, the economic dimensions of AI adoption are substantial and multifaceted. \
AI is demonstrating the capacity to automate a comprehensive range of cognitive tasks that \
were previously considered the exclusive domain of human expertise. Furthermore, the \
productivity gains associated with AI implementation are significant and well-documented \
across multiple industries. It is important to note, however, that the distribution of \
these gains raises important questions about equity and access that must be systematically \
addressed by policymakers and stakeholders alike.

Additionally, the labor market implications of AI deserve careful consideration. While it \
is tempting to view automation purely through the lens of job displacement, a more nuanced \
analysis reveals a complex landscape of transformation rather than simple substitution. \
Moreover, historical evidence suggests that technological transitions ultimately generate \
new categories of employment, though the pace and distribution of this transition represents \
a significant policy challenge. It is essential to acknowledge that workers in routine \
cognitive roles face disproportionate exposure to automation risk, necessitating robust \
retraining frameworks and comprehensive social support systems.

From a governance perspective, the challenge of developing appropriate regulatory frameworks \
for AI is particularly complex. It is worth noting that the technology evolves considerably \
faster than regulatory systems, creating persistent gaps between capability and oversight. \
Furthermore, the global nature of AI development creates significant coordination challenges, \
as different jurisdictions apply different standards and prioritize different values. \
In this context, international cooperation becomes not merely beneficial but essential \
to preventing regulatory arbitrage that could undermine safety and fairness objectives.

The ethical dimensions of AI deployment are equally significant and multifaceted. \
Algorithmic bias represents a well-documented problem, as training data systematically \
reflects historical patterns of inequality. It is important to note that these biases \
can perpetuate and amplify discrimination in high-stakes domains, including criminal \
justice, healthcare, financial services, and employment. Addressing this requires \
comprehensive technical solutions alongside fundamental changes to data collection \
and model evaluation practices.

Moreover, the concentration of advanced AI capabilities in a small number of large \
technology organizations raises important questions about power, accountability, and \
the distribution of benefits. The ecosystem of AI development is currently characterized \
by significant asymmetries between those who develop and deploy these systems and those \
who are subject to their effects. This necessitates robust mechanisms for transparency, \
accountability, and meaningful participation by affected communities in AI governance.

In conclusion, artificial intelligence represents a transformative and paradigm-shifting \
force with profound implications for society. Realizing its benefits while systematically \
mitigating its risks requires comprehensive, coordinated action across multiple domains. \
The decisions made today regarding AI development and governance will fundamentally \
shape the trajectory of human flourishing for decades to come.
"""

GEMINI_ESSAY = """\
Artificial Intelligence and Society: A Structured Analysis

Artificial intelligence is transforming society across multiple interconnected dimensions, \
generating substantial opportunities while simultaneously presenting significant challenges. \
This analysis provides a comprehensive examination of the key impacts, organized by domain.

Economic and Workforce Transformation

The economic implications of AI are substantial and far-reaching. AI systems are automating \
a growing range of tasks across industries, fundamentally altering the nature of work and \
creating new opportunities for productivity enhancement.

Significant productivity gains are documented across finance, logistics, manufacturing, \
and knowledge work. AI enables organizations to process and leverage vast quantities of \
data more efficiently than was previously possible. New job categories are emerging around \
AI development, maintenance, oversight, and optimization. Routine cognitive tasks are \
increasingly automated, necessitating workforce retraining at scale.

The comprehensive transformation of the labor market represents one of the most significant \
policy challenges associated with AI adoption. It is essential that policymakers develop \
robust frameworks to facilitate workforce transition and ensure equitable distribution \
of productivity gains.

Healthcare and Scientific Applications

AI demonstrates particular promise in healthcare and scientific research, facilitating \
capabilities that were not previously achievable. Machine learning models achieve \
accuracy comparable to specialists in medical imaging analysis. AI-accelerated drug \
discovery significantly optimizes the therapeutic development pipeline. Predictive \
models enable early identification of at-risk patients, facilitating preventive \
intervention. These capabilities could substantially expand access to quality healthcare, \
particularly in underserved regions and resource-constrained settings.

Key Risks and Governance Challenges

Several significant challenges accompany AI's substantial benefits.

Algorithmic bias is a well-documented and systematic problem. Training data inevitably \
reflects historical inequalities, causing AI systems to perpetuate and amplify \
discrimination in high-stakes domains. Privacy risks increase substantially as AI \
enables more sophisticated surveillance and comprehensive data analysis. The concentration \
of advanced AI capabilities in a small number of large technology organizations \
raises fundamental questions about accountability, market power, and governance.

Regulatory frameworks must be developed that balance innovation with protection, \
facilitate international coordination, address technical complexity and information \
asymmetries, and provide meaningful accountability mechanisms. Furthermore, it is \
essential that these frameworks evolve systematically alongside the technology.

The Path Forward

The societal impact of AI will fundamentally depend on choices made by developers, \
policymakers, and users over the coming years. Getting this right requires sustained, \
comprehensive attention from diverse stakeholders. A systematic approach to AI governance, \
grounded in robust evidence and guided by clear principles, represents the most viable \
pathway to realizing AI's substantial potential while mitigating its significant risks.
"""

HUMAN_ESSAY = """\
Why I Keep Changing My Mind About AI

I've been trying to write this essay for about three weeks. I keep starting it, getting \
a paragraph or two in, and then deleting everything because I realize I'm just saying \
what I think people want to hear, or what sounds smart, rather than what I actually believe.

So let me try something different. The truth is I change my mind about AI probably every \
other week, and I'm not sure that's a problem. Here's where I landed this morning.

I work as a high school history teacher. That means I watch technology supposedly \
revolutionize education while trying to explain to fifteen-year-olds why the printing \
press mattered. I know every generation thinks its moment is the hinge point of history. \
Often they're wrong. But sometimes they're right, and the printing press really did \
change everything, just slowly and unevenly.

Last spring I had a student — I'll call him Marcus — who struggled all year with writing. \
Not because he lacked ideas, but because something about putting words on a page froze \
him up. He'd sit there staring at a blank document for forty minutes and hand in nothing. \
Then he started using an AI tool to get a rough draft, something to push back against \
and rewrite. His essays got dramatically better. Not because the AI was writing them — \
they were clearly his thinking — but because he'd found a way past whatever blocked him. \
I don't know what to do with that. It seems genuinely good. It also makes me uneasy \
in ways I can't quite articulate.

Meanwhile, other students started turning in technically fine essays that said absolutely \
nothing. I could usually tell — not from any telltale phrasing, but because the thinking \
wasn't there. No weird jumps, no opinions, no voice. Smooth and correct and empty. \
I find that more discouraging than a bad essay, honestly. A bad essay shows someone tried.

My brother-in-law does paralegal work. His firm automated about a third of what his \
department used to do. He still has his job but watches it shrink. He's fifty-seven \
and doesn't exactly see himself retraining as a machine learning engineer. When \
economists say technology always creates new jobs in the end, I want to ask: which end, \
exactly, and for whom?

I don't have a tidy conclusion. I think AI is going to be genuinely transformative. \
I think the disruption will fall hardest on people with the least cushion. I think \
we'll lose some things in the efficiency gains that are worth mourning, even if the \
gains are real. I hope the people making the decisions care about that. Based on \
available evidence, I'm not sure they do.

What I'm more confident about: we need much more specific conversations, not \
sweeping ones about whether AI is good or bad. The useful question is something like: \
should this particular school use this particular tool for this particular purpose, \
and who gets to decide? That's much harder and much less satisfying, but it's the \
question that actually matters.
"""

# ─────────────────────────────────────────────────────────────────────────────
# Upload + analyze helpers
# ─────────────────────────────────────────────────────────────────────────────

def _write(name, content):
    path = os.path.join(OUTDIR, name)
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

def run_essay(label, content, filename):
    path = _write(filename, content)
    print(f"\nAnalysing [{label}] ...", end=" ", flush=True)
    doc_id = _upload(path)
    ok = _analyze_and_wait(doc_id)
    if not ok:
        print("FAILED")
        return None
    print("done")

    res  = requests.get(f"{BASE}/documents/{doc_id}/results").json()
    auth = requests.get(f"{BASE}/documents/{doc_id}/authorship").json()
    ai   = res.get("aiDetection", {})
    return {
        "label":       label,
        "aiProb":      ai.get("aiProbability", 0),
        "humanProb":   ai.get("humanProbability", 0),
        "verdict":     ai.get("verdict", "?"),
        "confidence":  ai.get("confidence", 0),
        "subScores":   ai.get("subScores", {}),
        "authRisk":    auth.get("risk", 0),
        "status":      ai.get("status", "?"),
    }

# ─────────────────────────────────────────────────────────────────────────────
# Run benchmark
# ─────────────────────────────────────────────────────────────────────────────

print("=" * 66)
print("  NUROAI — FINAL AI DETECTION BENCHMARK")
print("=" * 66)

essays = [
    ("GPT-4 Style",    GPT4_ESSAY,   "bench_gpt4.txt"),
    ("Claude Style",   CLAUDE_ESSAY, "bench_claude.txt"),
    ("Gemini Style",   GEMINI_ESSAY, "bench_gemini.txt"),
    ("Human-Written",  HUMAN_ESSAY,  "bench_human.txt"),
]

results = []
for label, content, fname in essays:
    r = run_essay(label, content, fname)
    if r:
        results.append(r)

# ─────────────────────────────────────────────────────────────────────────────
# Print results table
# ─────────────────────────────────────────────────────────────────────────────

print(f"\n\n{'=' * 66}")
print(f"  {'Document':<18} {'AI%':>5} {'Human%':>7} {'AuthRisk':>9} {'Conf':>5}  Verdict")
print(f"  {'-'*18} {'-'*5} {'-'*7} {'-'*9} {'-'*5}  {'-'*16}")
for r in results:
    print(f"  {r['label']:<18} {r['aiProb']:>4}% {r['humanProb']:>6}% {r['authRisk']:>8}% "
          f"{r['confidence']:>4}%  {r['verdict']}")
print(f"{'=' * 66}")

# Sub-scores breakdown
print(f"\n  Sub-scores detail:")
for r in results:
    ss = r["subScores"]
    parts = "  ".join(f"{k[:4]}={v}" for k, v in ss.items())
    print(f"  {r['label']:<18}  {parts}")

# ─────────────────────────────────────────────────────────────────────────────
# Target evaluation
# ─────────────────────────────────────────────────────────────────────────────

print(f"\n\n{'=' * 66}")
print("  TARGET EVALUATION")
print(f"{'=' * 66}")
print("  Target: AI essays > 70% AI probability")
print("  Target: Human essay < 25% AI probability")
print()

PASS_COUNT = FAIL_COUNT = 0

def chk(label, ok, detail=""):
    global PASS_COUNT, FAIL_COUNT
    if ok:
        PASS_COUNT += 1
        print(f"  [PASS]  {label}" + (f"  ({detail})" if detail else ""))
    else:
        FAIL_COUNT += 1
        print(f"  [FAIL]  {label}" + (f"  ({detail})" if detail else ""))

ai_labels = {"GPT-4 Style", "Claude Style", "Gemini Style"}
for r in results:
    if r["label"] in ai_labels:
        chk(f"{r['label']} scores > 70% AI",
            r["aiProb"] >= 70,
            f"aiProb={r['aiProb']}%")
    else:
        chk(f"{r['label']} scores < 25% AI",
            r["aiProb"] < 25,
            f"aiProb={r['aiProb']}%")

print(f"\n  TOTAL:  {PASS_COUNT} PASSED  |  {FAIL_COUNT} FAILED")
print(f"{'=' * 66}")

if FAIL_COUNT > 0:
    print("\n  AI detection targets not met — ensemble improvement required.")
    sys.exit(1)
else:
    print("\n  All detection targets met.")
    sys.exit(0)
