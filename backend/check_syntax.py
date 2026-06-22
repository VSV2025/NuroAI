import ast, sys, os

base = os.path.dirname(os.path.abspath(__file__))
files = [
    "app/services/ocr.py",
    "app/services/ai_detector.py",
    "app/services/authorship_engine.py",
    "app/services/analysis_engine.py",
    "app/routers/documents.py",
]

ok = True
for f in files:
    path = os.path.join(base, f)
    try:
        with open(path, "r", encoding="utf-8") as fh:
            src = fh.read()
        ast.parse(src)
        print(f"OK  {f}")
    except SyntaxError as e:
        print(f"ERR {f}: {e}")
        ok = False
    except FileNotFoundError:
        print(f"MISSING {f}")
        ok = False

sys.exit(0 if ok else 1)
