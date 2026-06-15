import os
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from starlette.responses import FileResponse

from app.db import init_db

load_dotenv()

app = FastAPI(title="ContaIA")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.auth import router as auth_router
from app.upload import router as upload_router
from app.chat import router as chat_router
from app.dashboard import router as dashboard_router
from app.insights import router as insights_router

app.include_router(auth_router, prefix="/api/auth")
app.include_router(upload_router, prefix="/api")
app.include_router(chat_router, prefix="/api")
app.include_router(dashboard_router, prefix="/api")
app.include_router(insights_router, prefix="/api")

_here = Path(__file__).resolve().parent
# local dev: backend/app/main.py → ../../frontend/dist
# docker:    /app/app/main.py        → ../frontend/dist
FRONTEND_DIR = (
    _here.parent.parent / "frontend" / "dist"
    if (_here.parent.parent / "frontend" / "dist").exists()
    else _here.parent / "frontend" / "dist"
)


@app.get("/{full_path:path}")
def serve_frontend(full_path: str):
    if full_path.startswith("api/"):
        from fastapi.responses import JSONResponse
        return JSONResponse({"detail": "Not Found"}, status_code=404)

    index = FRONTEND_DIR / "index.html"
    if not index.exists():
        from fastapi.responses import JSONResponse
        return JSONResponse({"detail": "Not Found"}, status_code=404)

    file_path = FRONTEND_DIR / full_path
    if file_path.exists() and file_path.is_file():
        return FileResponse(str(file_path))

    return FileResponse(str(index))


@app.on_event("startup")
def on_startup():
    init_db()
