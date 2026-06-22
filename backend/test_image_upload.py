import requests, time, sys

BASE = "http://localhost:4001/api"

def upload(path, name):
    with open(path, "rb") as f:
        r = requests.post(f"{BASE}/documents/upload", files={"file": (name, f)})
    return r.json()["documentId"]

def analyze(doc_id):
    requests.post(f"{BASE}/documents/{doc_id}/analyze")

def wait(doc_id, timeout=120):
    for _ in range(timeout):
        s = requests.get(f"{BASE}/documents/{doc_id}/status").json()
        if s.get("status") == "complete": return True
        if s.get("status") == "error": return False
        time.sleep(1)
    return False

print("Uploading test_image.png ...")
did = upload(r"C:\Users\drgsr\Downloads\test_image.png", "test_image.png")
print(f"Document ID: {did}")
analyze(did)
print("Analysis started, waiting...")
ok = wait(did)
print(f"Status: {'complete' if ok else 'FAILED'}")

if ok:
    res  = requests.get(f"{BASE}/documents/{did}/results").json()
    exp  = requests.get(f"{BASE}/documents/{did}/explain").json()
    auth = requests.get(f"{BASE}/documents/{did}/authorship")
    cl   = requests.get(f"{BASE}/documents/{did}/crosslang")
    code = requests.get(f"{BASE}/documents/{did}/code")

    scores = res.get("scores", {})
    print(f"\nIMAGE FILE")
    print(f"  Authenticity : {scores.get('authenticity')}%")
    print(f"  Risk         : {scores.get('risk')}%")
    print(f"  Confidence   : {scores.get('confidence')}%")

    secs = exp.get("sections", [])
    print(f"\n  Explainable AI sections: {len(secs)}")
    for i, s in enumerate(secs[:3]):
        text = s.get("text", "")[:80]
        print(f"    [{i}] {repr(text)}")

    if auth.status_code == 422:
        print(f"\n  Authorship: {auth.json()} (expected - no text extractable from image)")
    else:
        print(f"\n  Authorship status: {auth.status_code}")

    print(f"\n  Cross-lang: {cl.json()}")
