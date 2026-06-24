import json

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from app.auth import get_current_user
from app.database import get_session
from app.llm import get_completion, get_completion_stream
from app.models import Accountant
from app.schemas import ChatRequest, ChatResponse

router = APIRouter()

SYSTEM_PROMPT = """Eres un asistente financiero experto para contadores públicos en México.
Tu labor es analizar la información financiera de los clientes y responder preguntas con claridad.
Sé preciso, profesional y responde siempre en español.
Si no tienes los datos para responder, indícalo claramente."""

def build_messages(body: ChatRequest) -> list[dict]:
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    for entry in body.history:
        messages.append(entry)
    messages.append({"role": "user", "content": body.message})
    return messages


@router.post("/chat")
def chat(
    request: Request,
    body: ChatRequest,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    messages = build_messages(body)

    if body.stream:
        return _stream_response(messages)

    try:
        answer = get_completion(messages)
    except Exception as e:
        raise HTTPException(status_code=502, detail=str(e))

    return ChatResponse(
        answer_text=answer,
        chart_config=None,
    )


def _stream_response(messages: list[dict]):
    def generate():
        try:
            for chunk in get_completion_stream(messages):
                data = {}
                if chunk["content"]:
                    data["content"] = chunk["content"]
                if chunk["thinking"]:
                    data["thinking"] = chunk["thinking"]
                if data:
                    yield f"data: {json.dumps(data)}\n\n"
        except Exception:
            yield f"data: {json.dumps({'error': 'Stream error'})}\n\n"
        yield "data: [DONE]\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
