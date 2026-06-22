# NuroAI — Plagiarism Intelligence Platform

A multi-dimensional, AI-powered platform that detects AI-generated, translated, conceptual, authorship-based, and code plagiarism — through explainable intelligence, not just text matching.

## Architecture

```
frontend/   React + Vite + TypeScript + Three.js
backend/    FastAPI + MongoDB + PyTorch ML pipeline
```

## Quick Start

### Backend
```bash
cd backend
pip install -r requirements.txt
# Copy .env.example to .env and set MONGODB_URI
python -m uvicorn app.main:app --host 0.0.0.0 --port 4001
```

### Frontend
```bash
cd frontend
npm install
# Optional: create .env.local with VITE_API_URL=http://localhost:4001
npm run dev
```

Open http://localhost:5173

## Detection Layers

1. **OCR Extraction** — Tesseract + TrOCR + PyMuPDF
2. **Semantic Analysis** — sentence-transformers (all-mpnet-base-v2)
3. **Translation Analysis** — Script-based multilingual detection
4. **Authorship Verification** — 12-feature stylometry
5. **AI Detection** — 8-signal ensemble (RoBERTa, DeBERTa, GPT-2, vocabulary analysis)
6. **Code Intelligence** — AST + pattern matching
7. **Neural Evidence** — Explainable AI span detection
8. **Final Report** — Risk scoring + verdict

## Deployment

See `frontend/DEPLOYMENT_CHECKLIST.md` for full Vercel + Render + MongoDB Atlas deployment guide.

## Environment Variables

**Backend** (`.env`):
```
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=nuroai
```

**Frontend** (`.env.local`):
```
VITE_API_URL=http://localhost:4001
```
