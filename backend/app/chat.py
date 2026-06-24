import json

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from sqlmodel import Session

from app.auth import get_current_user
from app.database import get_session
from app.llm import agent_loop, get_completion_stream
from app.models import Accountant
from app.schemas import ChatRequest, ChatResponse

router = APIRouter()

SYSTEM_PROMPT = """Eres un asistente financiero experto para contadores públicos en México.
Tu labor es analizar la información financiera de los clientes y responder preguntas con claridad.
Sé preciso, profesional y responde siempre en español.
Si no tienes los datos para responder, indícalo claramente.

Tienes acceso a las siguientes herramientas:
- `get_schema`: consulta la estructura de la base de datos. Úsala para conocer las tablas y columnas disponibles antes de escribir SQL.
- `execute_sql`: ejecuta consultas SQL de solo lectura. En tu SQL puedes usar `:accountant_id` y `:client_id` como parámetros nombrados — el sistema los reemplazará automáticamente con los valores correctos del contador y cliente autenticados. Todas las tablas tienen columnas `accountant_id` y `client_id`. No escribas valores literales para estos campos."""

# - `generate_chart`: ejecuta una consulta SQL de resumen y genera una configuración de gráfico JSON. La primera columna del resultado se usa como etiquetas y las siguientes como datos numéricos. Úsala cuando necesites visualizar datos."""

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

    print(f"[chat] user={user.id} client={body.client_id} stream={body.stream} history_len={len(body.history)} message_len={len(body.message)}", flush=True)

    if body.stream:
        return _stream_response(messages, session, user.id, body.client_id)

    try:
        answer = agent_loop(messages, session, user.id, body.client_id)
        print(f"[chat] answer len={len(answer)}", flush=True)
    except Exception as e:
        print(f"[chat] ERROR: {e}", flush=True)
        raise HTTPException(status_code=502, detail=str(e))

    return ChatResponse(
        answer_text=answer,
        chart_config=None,
    )


def _stream_response(messages: list[dict], session: Session, accountant_id: int, client_id: int):
    def generate():
        try:
            for chunk in get_completion_stream(messages, session, accountant_id, client_id, options={"temperature": 0.7, "num_ctx": 65536}):
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
