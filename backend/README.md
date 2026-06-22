# NuroAI Backend (FastAPI + MongoDB)

A FastAPI REST API for the NuroAI plagiarism intelligence platform, with data
stored in **MongoDB**. Same endpoints and same port (4000) as the other backends.
Interactive API docs at **/docs**.

> **Honesty note:** Direct-plagiarism (n-gram overlap), authorship (stylometry),
> and code comparison (token normalization) use **real algorithms**. AI detection
> is a transparent **heuristic**; cross-language / idea plagiarism are
> **placeholders** marked in the code. A production-shaped skeleton you extend.

---

## Step 1 — Get a MongoDB to connect to

Pick ONE option.

### Option A — Local MongoDB (runs on your PC)
1. Download **MongoDB Community Server**: <https://www.mongodb.com/try/download/community>
2. Install it. On Windows, check **"Install MongoDB as a Service"** during setup —
   that makes it start automatically, listening on `mongodb://localhost:27017`.
3. (Optional) Install **MongoDB Compass** (a visual UI, offered in the installer)
   to see your data.
4. Verify it's running — in Command Prompt:
   ```cmd
   sc query MongoDB
   ```
   `STATE: RUNNING` means you're good. The default `.env` already points here, so
   no config needed.

### Option B — MongoDB Atlas (free cloud, no install)
1. Make a free account at <https://www.mongodb.com/atlas> and create a free
   (M0) cluster.
2. Add a database user (username + password) and allow network access from your
   IP (or `0.0.0.0/0` while testing).
3. Click **Connect → Drivers** and copy the connection string. It looks like:
   `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority`
4. Put it in your `.env` (see Step 2) as `MONGODB_URI`.

---

## Step 2 — Run the backend (Command Prompt)

```cmd
cd Desktop\nuroai-backend-fastapi-mongo
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
copy .env.example .env
python run.py
```

- The `copy .env.example .env` line creates your config file. Open `.env` in a
  text editor only if you're using Atlas (paste your connection string there).
  For a local install, the defaults already work.
- On success you'll see `MongoDB connected OK` and the server URLs.

Test it:
- Health (now reports DB status): <http://localhost:4000/api/health>
- Interactive docs: <http://localhost:4000/docs>

Stop with `Ctrl + C`. Next time: `cd` in, `venv\Scripts\activate.bat`, `python run.py`.
Requires **Python 3.10+**.

> If health shows `"database": "unreachable"`, MongoDB isn't running or the URI is
> wrong. Start the service (Option A step 4) or fix `MONGODB_URI` in `.env`.

---

## What changed from the in-memory version

Only the data layer. `app/store.py` now reads/writes a MongoDB `documents`
collection instead of a Python dict — but the function names
(`save_document`, `get_document`, `update_document`, `list_documents`) are
identical, so the routers and engine are unchanged. Your uploaded/analyzed
documents now **persist after a restart**.

New files: `app/db.py` (connection) and `.env` (settings).

---

## API reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET  | `/api/health` | Server + database status |
| GET  | `/api/dashboard/overview` | Cards + all chart data |
| POST | `/api/documents/upload` | Upload a file (form field `file`) |
| POST | `/api/documents/analyze-text` | Send raw text `{ text }` (easiest) |
| POST | `/api/documents/{id}/analyze` | Start the 8-stage pipeline |
| GET  | `/api/documents/{id}/status` | Poll pipeline progress |
| GET  | `/api/documents/{id}/results` | Scores + detection breakdown |
| GET  | `/api/documents/{id}/explain` | Suspicious sections + reasoning |
| POST | `/api/authorship/analyze` | Writing-DNA radar `{ submission, baseline }` |
| POST | `/api/crosslang/analyze` | Cross-language mapping `{ text }` |
| POST | `/api/code/compare` | Code similarity `{ left, right }` |

---

## Project structure

```
nuroai-backend-fastapi-mongo/
├─ requirements.txt
├─ .env.example                 # copy to .env
├─ run.py
├─ app/
│  ├─ main.py                   # FastAPI app + CORS + DB startup check
│  ├─ db.py                     # MongoDB connection (NEW)
│  ├─ store.py                  # data access via MongoDB
│  ├─ schemas.py                # Pydantic request models
│  ├─ data/corpus.py            # reference corpus
│  ├─ services/
│  │  ├─ text_features.py       # real text math
│  │  └─ analysis_engine.py     # detection layers → report
│  └─ routers/                  # one router per feature
└─ uploads/                     # created automatically
```

## Where to upgrade to "real"

- **AI detection** → replace the heuristic in `analysis_engine.py > detect_ai`.
- **Cross-language** → add a translation API + multilingual embeddings in `routers/crosslang.py`.
- **Direct plagiarism at scale** → index real sources; MongoDB Atlas Vector Search is one option.
- **PDF/DOCX extraction** → add `pdfplumber` and `python-docx` in the upload route.
- **Connect the React frontend** → it calls `http://localhost:4000/api/...`; CORS is enabled.
