# run.py — starts the FastAPI server with uvicorn
import logging
from dotenv import load_dotenv
import uvicorn

load_dotenv()
logging.basicConfig(level=logging.INFO, format="%(levelname)s:%(name)s:%(message)s")

if __name__ == "__main__":
    print("\n  NuroAI backend (FastAPI + MongoDB) starting")
    print("  -> http://localhost:4000")
    print("  -> health check:    http://localhost:4000/api/health")
    print("  -> interactive docs: http://localhost:4000/docs\n")
    uvicorn.run("app.main:app", host="0.0.0.0", port=4001, reload=False)
