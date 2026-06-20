from fastapi import APIRouter, Depends
from sqlmodel import Session

from app.auth import get_current_user
from app.database import get_session
from app.models import Accountant
from app.schemas import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/chat")
def chat(
    body: ChatRequest,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return ChatResponse(
        answer_text="Chat endpoint — not yet implemented",
        chart_config=None,
    )
