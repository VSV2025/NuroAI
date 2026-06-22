# app/main.py — builds the FastAPI application
from datetime import datetime
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .db import ping
from .routers import dashboard, documents, authorship, crosslang, code, settings, authors


def create_app() -> FastAPI:
    app = FastAPI(
        title="NuroAI Backend",
        description="Plagiarism intelligence platform API (FastAPI + MongoDB)",
        version="1.0.0",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
        allow_credentials=False,
    )

    @app.exception_handler(405)
    async def method_not_allowed(request: Request, exc):
        return JSONResponse(
            status_code=405,
            content={"detail": f"Method {request.method} not allowed. Use POST for uploads."},
            headers={"Access-Control-Allow-Origin": "*"},
        )

    @app.on_event("startup")
    def check_db():
        try:
            ping()
            print("  MongoDB connected OK")
        except Exception as e:
            print("  WARNING: could not reach MongoDB ->", e)
            print("  Start MongoDB (or set MONGODB_URI in .env) and restart.")

    @app.get("/api/debug/explain-src")
    def debug_explain_src():
        import inspect
        from .services.analysis_engine import explain_document
        src = inspect.getsource(explain_document)
        return {"first_100": src[:200]}

    @app.get("/api/health")
    def health():
        db_ok = True
        try:
            ping()
        except Exception:
            db_ok = False
        return {
            "status": "ok",
            "engine": "online",
            "database": "connected" if db_ok else "unreachable",
            "time": datetime.utcnow().isoformat(),
        }

    app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
    app.include_router(documents.router, prefix="/api/documents", tags=["documents"])
    app.include_router(authorship.router, prefix="/api/authorship", tags=["authorship"])
    app.include_router(crosslang.router, prefix="/api/crosslang", tags=["crosslang"])
    app.include_router(code.router, prefix="/api/code", tags=["code"])
    app.include_router(settings.router, prefix="/api/settings", tags=["settings"])
    app.include_router(authors.router, prefix="/api/authors", tags=["authors"])

    return app


app = create_app()
