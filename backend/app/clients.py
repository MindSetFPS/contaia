import re

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import Accountant, Client
from app.schemas import ClientCreate, ClientUpdate

router = APIRouter()


def _validate_rfc(rfc: str | None) -> str | None:
    if rfc is None:
        return None
    rfc = rfc.upper().strip()
    if not re.match(r"^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{2,3}$", rfc):
        raise HTTPException(
            status_code=400,
            detail="RFC must be 12 or 13 characters: 3-4 letters + 6 digits + 2-3 alphanumeric",
        )
    return rfc


@router.get("/")
def list_clients(
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    clients = session.exec(
        select(Client).where(Client.accountant_id == user.id).order_by(Client.name)
    ).all()
    return clients


@router.post("/", status_code=201)
def create_client(
    body: ClientCreate,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    name = body.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Client name is required")

    razon_social = body.razon_social.strip() if body.razon_social else None
    rfc = _validate_rfc(body.rfc)
    industry = body.industry.strip() if body.industry else None

    client = Client(
        accountant_id=user.id,
        name=name,
        razon_social=razon_social,
        rfc=rfc,
        industry=industry,
    )
    session.add(client)
    session.commit()
    session.refresh(client)
    return client


def _get_client_or_404(
    client_id: int, user: Accountant, session: Session
) -> Client:
    client = session.exec(
        select(Client).where(
            Client.id == client_id, Client.accountant_id == user.id
        )
    ).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.put("/{client_id}")
def update_client(
    client_id: int,
    body: ClientUpdate,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    client = _get_client_or_404(client_id, user, session)

    if body.name is not None:
        name = body.name.strip()
        if not name:
            raise HTTPException(status_code=400, detail="Client name cannot be empty")
        client.name = name
    if body.razon_social is not None:
        client.razon_social = body.razon_social.strip() or None
    if body.rfc is not None:
        client.rfc = _validate_rfc(body.rfc)
    if body.industry is not None:
        client.industry = body.industry.strip() or None

    session.add(client)
    session.commit()
    session.refresh(client)
    return client


@router.delete("/{client_id}", status_code=204)
def delete_client(
    client_id: int,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    client = _get_client_or_404(client_id, user, session)
    session.delete(client)
    session.commit()
