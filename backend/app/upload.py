from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import Accountant, Upload

router = APIRouter()


@router.post("/upload")
def upload_file(
    file: UploadFile = File(...),
    client_id: int = Form(...),
    table_type: str = Form(...),
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if not file.filename.endswith(".xlsx"):
        raise HTTPException(status_code=400, detail="Only .xlsx files are supported")
    content = file.file.read()
    if len(content) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File exceeds 10 MB limit")
    return {"detail": "Upload endpoint — not yet implemented"}


@router.get("/uploads")
def list_uploads(
    client_id: int,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    uploads = session.exec(
        select(Upload)
        .where(Upload.accountant_id == user.id, Upload.client_id == client_id)
        .order_by(Upload.created_at.desc())
    ).all()
    return uploads
