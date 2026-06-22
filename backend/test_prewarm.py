"""Pre-warm DeBERTa and GPT-2 models before the benchmark."""
import requests, time, os

BASE   = "http://localhost:4001/api"
OUTDIR = os.path.join(os.path.dirname(__file__), "test_docs")
os.makedirs(OUTDIR, exist_ok=True)

TEXT = """\
Artificial intelligence demonstrates significant potential for transforming society. \
Furthermore, the proliferation of machine learning systems is generating substantial \
economic value. Moreover, it is important to note that these developments necessitate \
comprehensive governance frameworks. Additionally, stakeholders must leverage robust \
systematic approaches to facilitate optimal outcomes in this rapidly evolving landscape.
Additionally, organizations must implement innovative paradigm-shifting strategies to \
optimize their workflows and ensure significant productivity gains across multiple domains. \
It is worth noting that the multifaceted nature of these transformative developments \
requires a fundamentally systematic and comprehensive response from policymakers.
"""

path = os.path.join(OUTDIR, "prewarm.txt")
with open(path, "w", encoding="utf-8") as f:
    f.write(TEXT)

print("Uploading pre-warm document...")
with open(path, "rb") as fh:
    r = requests.post(f"{BASE}/documents/upload", files={"file": ("prewarm.txt", fh)})
r.raise_for_status()
doc_id = r.json()["documentId"]
print(f"doc_id={doc_id[:8]}")

requests.post(f"{BASE}/documents/{doc_id}/analyze").raise_for_status()
print("Analysis started — waiting up to 360s for models to load...")

for i in range(360):
    s = requests.get(f"{BASE}/documents/{doc_id}/status").json()
    status = s.get("status")
    if i % 30 == 0:
        print(f"  {i}s: status={status}")
    if status == "complete":
        break
    if status == "error":
        print("Analysis errored")
        break
    time.sleep(1)
else:
    print("Timed out")
    exit(1)

res = requests.get(f"{BASE}/documents/{doc_id}/results").json()
ai  = res.get("aiDetection", {})
print(f"\nPre-warm complete. AI probability={ai.get('aiProbability')}%")
print(f"Sub-scores: {ai.get('subScores', {})}")
print(f"Status: {ai.get('status')}")
