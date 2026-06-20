from fastapi import APIRouter, Depends, Query
from sqlmodel import Session

from app.auth import get_current_user
from app.database import get_session
from app.models import Accountant

router = APIRouter()


@router.get("/dashboard")
def dashboard(
    client_id: int = Query(...),
    period_date: str | None = Query(None),
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return {"detail": "Dashboard endpoint — not yet implemented"}
