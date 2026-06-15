from fastapi import APIRouter, Depends, Query

from app.auth import get_current_user
from app.db import get_connection

router = APIRouter()


@router.get("/dashboard")
def dashboard(
    client_id: int = Query(...),
    period_id: str | None = Query(None),
    user: dict = Depends(get_current_user),
):
    return {"detail": "Dashboard endpoint — not yet implemented"}
