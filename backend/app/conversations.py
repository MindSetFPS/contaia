from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, text
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.llm.client import OLLAMA_MODEL, client as llm_client
from app.models import Accountant, Conversation, Message
from app.schemas import (
    ConversationCreate,
    ConversationResponse,
    ConversationUpdate,
    GenerateTitleRequest,
    MessageResponse,
)

router = APIRouter()

MAX_CONVERSATIONS = 32


@router.get("/chat/conversations")
def list_conversations(
    client_id: int,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    rows = session.exec(
        text("""
            SELECT
                c.id,
                c.client_id,
                c.title,
                COUNT(m.id) FILTER (WHERE m.role IN ('user', 'assistant')) AS message_count,
                c.created_at::text,
                c.last_message_at::text
            FROM conversations c
            LEFT JOIN messages m ON m.conversation_id = c.id
            WHERE c.accountant_id = :accountant_id AND c.client_id = :client_id
            GROUP BY c.id
            ORDER BY c.last_message_at DESC
        """),
        params={"accountant_id": user.id, "client_id": client_id},
    ).all()

    return [
        ConversationResponse(
            id=r.id,
            client_id=r.client_id,
            title=r.title,
            message_count=r.message_count,
            last_message_at=r.last_message_at,
            created_at=r.created_at,
        )
        for r in rows
    ]


@router.post("/chat/conversations", status_code=201)
def create_conversation(
    body: ConversationCreate,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    count = session.exec(
        select(func.count(Conversation.id)).where(
            Conversation.accountant_id == user.id
        )
    ).one()
    if count >= MAX_CONVERSATIONS:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "limit_reached",
                "message": f"Has alcanzado el límite de {MAX_CONVERSATIONS} conversaciones. Elimina una antes de crear otra.",
                "conversation_count": count,
            },
        )

    conv = Conversation(
        accountant_id=user.id,
        client_id=body.client_id,
        title=body.title or "Nueva conversación",
    )
    session.add(conv)
    session.commit()
    session.refresh(conv)
    return conv


@router.put("/chat/conversations/{conversation_id}")
def update_conversation(
    conversation_id: int,
    body: ConversationUpdate,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    conv = session.exec(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.accountant_id == user.id,
        )
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    conv.title = body.title
    session.add(conv)
    session.commit()
    session.refresh(conv)
    return conv


@router.delete("/chat/conversations/{conversation_id}")
def delete_conversation(
    conversation_id: int,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    conv = session.exec(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.accountant_id == user.id,
        )
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    session.delete(conv)
    session.commit()
    return {"detail": "Deleted"}


@router.get("/chat/conversations/{conversation_id}/messages")
def get_messages(
    conversation_id: int,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    conv = session.exec(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.accountant_id == user.id,
        )
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    ).all()

    return [
        MessageResponse(
            id=m.id,
            role=m.role,
            content=m.content,
            chart_config=m.chart_config,
            created_at=m.created_at.isoformat() if m.created_at else "",
        )
        for m in messages
    ]


@router.post("/chat/conversations/{conversation_id}/generate-title")
def generate_title(
    conversation_id: int,
    body: GenerateTitleRequest,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    conv = session.exec(
        select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.accountant_id == user.id,
        )
    ).first()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    messages = session.exec(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at.asc())
    ).all()

    if not messages:
        raise HTTPException(status_code=400, detail="No hay mensajes para generar título")

    model = body.model or OLLAMA_MODEL

    conversation_text = "\n".join(f"{m.role}: {m.content}" for m in messages)
    prompt = "Escribe un título corto, general y descriptivo (máximo 6 palabras) que englobe la temática de la conversación para la siguiente conversación financiera. Responde solo con el título, sin comillas, puntuación ni explicación adicional.\n\nConversación:\n" + conversation_text

    try:
        print(f"[generate_title] calling ollama model={model}", flush=True)
        response = llm_client.generate(
            model=model,
            think=False,
            stream=False,
            prompt=prompt,
            options={
                "temperature": 1, 
                },
        )
        print(response)
        title = (response.response or "").strip().strip('"').strip("'").strip()
        if not title:
            title = "Nueva conversación"
        print(f"[generate_title] success: title={title!r}", flush=True)
    except Exception as e:
        print(f"[generate_title] ERROR: {e}", flush=True)
        raise HTTPException(status_code=502, detail=f"Error al generar título: {e}")

    conv.title = title
    session.add(conv)
    session.commit()

    return {"title": title}
