import requests
import time
import json

BASE = "http://localhost:4001/api"

def upload(path, name):
    with open(path, "rb") as f:
        r = requests.post(f"{BASE}/documents/upload", files={"file": (name, f)})
    return r.json()["documentId"]

def analyze(doc_id):
    requests.post(f"{BASE}/documents/{doc_id}/analyze")

def wait(doc_id, timeout=180):
    for _ in range(timeout):
        s = requests.get(f"{BASE}/documents/{doc_id}/status").json()
        if s.get("status") == "complete":
            return True
        if s.get("status") == "error":
            return False
        time.sleep(1)
    return False

def get_all(doc_id):
    results   = requests.get(f"{BASE}/documents/{doc_id}/results").json()
    authorship = requests.get(f"{BASE}/documents/{doc_id}/authorship").json()
    crosslang  = requests.get(f"{BASE}/documents/{doc_id}/crosslang").json()
    code       = requests.get(f"{BASE}/documents/{doc_id}/code").json()
    return results, authorship, crosslang, code

def print_report(label, doc_id, results, authorship, crosslang, code):
    scores = results.get("scores", {})
    print(f"\n{'='*60}")
    print(f"  {label}")
    print(f"{'='*60}")
    print(f"  Document ID   : {doc_id}")
    print(f"  Authenticity  : {scores.get('authenticity', '?')}%")
    print(f"  Risk          : {scores.get('risk', '?')}%")
    print(f"  Confidence    : {scores.get('confidence', '?')}%")
    print(f"  Threat level  : {scores.get('threat', '?')}")
    print()
    print("  AUTHORSHIP METRICS:")
    for m in authorship.get("metrics", []):
        print(f"    {m['k']:<25} {m['v']}")
    print(f"    Risk: {authorship.get('risk')}  Verdict: {authorship.get('verdict')}")
    print()
    print("  CROSS-LANGUAGE METRICS:")
    print(f"    Overall score : {crosslang.get('overallScore')}%")
    for l in crosslang.get("langs", []):
        print(f"    {l['code']} ({l['name']:<8}): {l['sim']}%")
    print()
    print("  CODE INTELLIGENCE METRICS:")
    print(f"    Code Similarity  : {code.get('codeSimilarity')}%")
    print(f"    Logic Similarity : {code.get('logicSimilarity')}%")
    print(f"    AST Match        : {code.get('astMatch')}%")
    print(f"    Structure        : {code.get('structure')}%")
    print(f"    Rename Evasion   : {code.get('renameEvasion')}")
    print(f"    Note             : {code.get('note', '')[:80]}")

files = [
    (r"C:\Users\drgsr\Downloads\test_ai_generated.txt",  "test_ai_generated.txt",  "AI-GENERATED TEXT"),
    (r"C:\Users\drgsr\Downloads\test_human_written.txt", "test_human_written.txt", "HUMAN-WRITTEN TEXT"),
]

doc_ids = []
for path, name, label in files:
    print(f"Uploading {name}...")
    did = upload(path, name)
    doc_ids.append((did, label))
    analyze(did)
    print(f"  ID: {did}  (analysis started)")

print("\nWaiting for analyses to complete...")
for did, label in doc_ids:
    ok = wait(did)
    print(f"  {label}: {'complete' if ok else 'FAILED'}")

for did, label in doc_ids:
    res, auth, cl, code = get_all(did)
    print_report(label, did, res, auth, cl, code)

print("\n" + "="*60)
print("DONE")
