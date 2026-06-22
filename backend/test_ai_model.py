import requests, time, sys

BASE = "http://localhost:4001/api"

AI_TEXT = """
Artificial intelligence has fundamentally transformed the landscape of modern technology.
The proliferation of large language models has enabled unprecedented capabilities in natural
language understanding and generation. These systems leverage deep neural networks trained on
vast corpora of text data to produce coherent and contextually relevant responses.
The implications of this technological advancement are far-reaching and multifaceted.
Organizations across diverse sectors are actively exploring the integration of AI systems
into their operational workflows. The potential for productivity enhancement is substantial.
"""

HUMAN_TEXT = """
So I've been thinking about this whole AI thing and honestly it's weird. I remember when
my professor first mentioned ChatGPT in class and half the room had never heard of it.
That was maybe two years ago. Now everyone's using it for everything from grocery lists
to term papers. My friend Jake says that's fine. He uses AI for everything now and got
a 94 on his history paper. But when I read it I couldn't tell where Jake ended and the
AI started. Which is kind of the point I guess, but also kind of sad.
"""

def upload_text(text, name):
    r = requests.post(f"{BASE}/documents/analyze-text",
                      json={"text": text.strip(), "filename": name})
    return r.json()["documentId"]

def analyze_and_wait(doc_id, timeout=180):
    requests.post(f"{BASE}/documents/{doc_id}/analyze")
    for _ in range(timeout):
        s = requests.get(f"{BASE}/documents/{doc_id}/status").json()
        if s.get("status") == "complete": return True
        if s.get("status") == "error":
            print(f"  ERROR: {s}")
            return False
        time.sleep(1)
    return False

for label, text in [("AI-GENERATED", AI_TEXT), ("HUMAN-WRITTEN", HUMAN_TEXT)]:
    print(f"\nUploading {label}...")
    did = upload_text(text, f"{label.lower()}.txt")
    print(f"  doc_id: {did}")
    ok = analyze_and_wait(did)
    if not ok:
        print("  FAILED")
        continue

    res = requests.get(f"{BASE}/documents/{did}/results").json()
    bd  = {b["key"]: b for b in res.get("breakdown", [])}
    ai  = bd.get("ai", {})

    print(f"  Authenticity : {res['scores']['authenticity']}%")
    print(f"  Risk         : {res['scores']['risk']}%")
    print(f"  AI score     : {ai.get('score')}%")
    print(f"  AI confidence: {ai.get('confidence')}%")
    print(f"  AI status    : {ai.get('status', 'no status field')}")
    print(f"  AI evidence  : {ai.get('evidence', '')[:100]}")
