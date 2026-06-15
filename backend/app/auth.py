from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel

from app.db import get_connection
from app.models import LoginRequest, LoginResponse, RegisterRequest

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"])
security = HTTPBearer()

SECRET_KEY = "change-me-in-production"
ALGORITHM = "HS256"


def create_token(accountant_id: int) -> str:
    payload = {
        "sub": str(accountant_id),
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        accountant_id = int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    conn = get_connection()
    user = conn.execute(
        "SELECT id, email, name FROM accountants WHERE id = ?", (accountant_id,)
    ).fetchone()
    conn.close()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return dict(user)


@router.post("/register")
def register(body: RegisterRequest):
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    conn = get_connection()
    existing = conn.execute("SELECT id FROM accountants WHERE email = ?", (body.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    password_hash = pwd_context.hash(body.password)
    cursor = conn.execute(
        "INSERT INTO accountants (email, password_hash, name) VALUES (?, ?, ?)",
        (body.email, password_hash, body.name),
    )
    conn.commit()
    accountant_id = cursor.lastrowid
    token = create_token(accountant_id)
    conn.close()
    return LoginResponse(
        token=token,
        user={"id": accountant_id, "email": body.email, "name": body.name},
    )


@router.post("/login")
def login(body: LoginRequest):
    conn = get_connection()
    user = conn.execute(
        "SELECT id, email, name, password_hash FROM accountants WHERE email = ?", (body.email,)
    ).fetchone()
    conn.close()
    if not user or not pwd_context.verify(body.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"])
    return LoginResponse(
        token=token,
        user={"id": user["id"], "email": user["email"], "name": user["name"]},
    )


@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return user


@router.get("/clients")
def list_clients(user: dict = Depends(get_current_user)):
    conn = get_connection()
    rows = conn.execute(
        "SELECT id, name, rfc, industry FROM clients WHERE accountant_id = ? ORDER BY name",
        (user["id"],),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("/clients")
def create_client(body: BaseModel, user: dict = Depends(get_current_user)):
    from app.models import ClientCreate
    body = ClientCreate(**body.model_dump())
    conn = get_connection()
    cursor = conn.execute(
        "INSERT INTO clients (accountant_id, name, rfc, industry) VALUES (?, ?, ?, ?)",
        (user["id"], body.name, body.rfc, body.industry),
    )
    conn.commit()
    client = conn.execute(
        "SELECT id, name, rfc, industry FROM clients WHERE id = ?", (cursor.lastrowid,)
    ).fetchone()
    conn.close()
    return dict(client)
