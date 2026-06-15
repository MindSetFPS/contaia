from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.auth import get_current_user
from app.db import get_connection

router = APIRouter()


@router.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    client_id: int = Form(...),
    table_type: str = Form(...),
    user: dict = Depends(get_current_user),
):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")
    content = file.file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit")
    return {"detail": "Upload endpoint — not yet implemented"}


@router.get("/uploads")
def list_uploads(client_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    rows = conn.execute(
        """SELECT id, filename, table_type, period_id, rows_processed, rows_skipped, created_at
           FROM uploads
           WHERE accountant_id = ? AND client_id = ?
           ORDER BY created_at DESC""",
        (user["id"], client_id),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]
