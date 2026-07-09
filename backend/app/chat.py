import json
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlalchemy import func
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.llm import get_completion_stream
from app.models import Accountant, Conversation, Message
from app.schemas import ChatRequest

router = APIRouter()

MAX_MESSAGES = 512

SYSTEM_PROMPT = """Eres un asistente financiero experto para contadores públicos en México.
Tu labor es analizar la información financiera de los clientes y responder preguntas con claridad.
Sé preciso, profesional y responde siempre en español.
Si no tienes los datos para responder, indícalo claramente.

Tienes acceso a las siguientes herramientas:
- `get_schema`: consulta la estructura de la base de datos. Úsala para conocer las tablas y columnas disponibles antes de escribir SQL.
- `execute_sql`: ejecuta consultas SQL de solo lectura. En tu SQL puedes usar `:accountant_id` y `:client_id` como parámetros nombrados — el sistema los reemplazará automáticamente con los valores correctos del contador y cliente autenticados. Todas las tablas tienen columnas `accountant_id` y `client_id`. No escribas valores literales para estos campos.
- `generate_chart`: ejecuta una consulta SQL de resumen y genera una configuración de gráfico JSON. La primera columna del resultado se usa como etiquetas y las siguientes como datos numéricos. Úsala cuando necesites visualizar datos."""


def _load_history(session: Session, conversation_id: int, accountant_id: int) -> list[dict]:
    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    ).all()

    history = []
    for m in messages:
        entry = {"role": m.role, "content": m.content}
        if m.chart_config:
            entry["chart_config"] = m.chart_config
        history.append(entry)
    return history


def _save_message(
    session: Session,
    conversation_id: int,
    role: str,
    content: str,
    chart_config: dict | None = None,
) -> Message:
    msg = Message(
        conversation_id=conversation_id,
        role=role,
        content=content,
        chart_config=chart_config,
    )
    session.add(msg)
    return msg


@router.post("/chat")
def chat(
    request: Request,
    body: ChatRequest,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    conv = session.exec(
        select(Conversation).where(
            Conversation.id == body.conversation_id,
            Conversation.accountant_id == user.id,
        )
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg_count = session.exec(
        select(func.count(Message.id)).where(
            Message.conversation_id == body.conversation_id,
            Message.role.in_(["user", "assistant"]),
        )
    ).one()
    if msg_count >= MAX_MESSAGES:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "limit_reached",
                "message": f"Esta conversación ha alcanzado el límite de {MAX_MESSAGES} mensajes. Crea una nueva conversación para continuar.",
            },
        )

    history = _load_history(session, body.conversation_id, user.id)
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages.extend(history)
    messages.append({"role": "user", "content": body.message})

    _save_message(session, body.conversation_id, "user", body.message)
    session.commit()

    return _stream_response(
        messages, session, user.id, conv.client_id, body.conversation_id
    )


def _stream_response(
    messages: list[dict],
    session: Session,
    accountant_id: int,
    client_id: int,
    conversation_id: int,
):
    full_content = ""
    full_chart_config = None

    def generate():
        nonlocal full_content, full_chart_config
        try:
            for chunk in get_completion_stream(
                messages, session, accountant_id, client_id,
                options={"temperature": 0.7, "num_ctx": 65536},
            ):
                if chunk.get("content"):
                    full_content += chunk["content"]
                if chunk.get("chart_config"):
                    full_chart_config = chunk["chart_config"]
                data = {}
                if chunk.get("content"):
                    data["content"] = chunk["content"]
                if chunk.get("thinking"):
                    data["thinking"] = chunk["thinking"]
                if chunk.get("chart_config"):
                    data["chart_config"] = chunk["chart_config"]
                if data:
                    yield f"data: {json.dumps(data)}\n\n"
        except Exception as e:
            print(f"[chat] stream error: {e}", flush=True)
            yield f"data: {json.dumps({'error': 'Stream error'})}\n\n"
        finally:
            content = full_content or "Lo siento, no pude generar una respuesta completa."
            _save_message(
                session,
                conversation_id,
                "assistant",
                content,
                full_chart_config,
            )
            conv = session.exec(
                select(Conversation).where(Conversation.id == conversation_id)
            ).first()
            if conv:
                conv.last_message_at = datetime.utcnow()
                session.add(conv)
            session.commit()
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
