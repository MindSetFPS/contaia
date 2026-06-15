from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.models import ChatRequest, ChatResponse

router = APIRouter()


@router.post("/chat")
def chat(body: ChatRequest, user: dict = Depends(get_current_user)):
    return ChatResponse(
        answer_text="Chat endpoint — not yet implemented",
        chart_config=None,
    )
