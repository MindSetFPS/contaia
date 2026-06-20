from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlmodel import Session, select

from app.database import get_session
from app.models import Accountant
from app.schemas import LoginRequest, LoginResponse, RegisterRequest

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


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    session: Session = Depends(get_session),
) -> Accountant:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        accountant_id = int(payload["sub"])
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = session.exec(select(Accountant).where(Accountant.id == accountant_id)).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


@router.post("/register")
def register(body: RegisterRequest, session: Session = Depends(get_session)):
    if len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")
    existing = session.exec(select(Accountant).where(Accountant.email == body.email)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    accountant = Accountant(
        email=body.email,
        password_hash=pwd_context.hash(body.password),
        name=body.name,
    )
    session.add(accountant)
    session.commit()
    session.refresh(accountant)
    token = create_token(accountant.id)
    return LoginResponse(
        token=token,
        user={"id": accountant.id, "email": accountant.email, "name": accountant.name},
    )


@router.post("/login")
def login(body: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(Accountant).where(Accountant.email == body.email)).first()
    if not user or not pwd_context.verify(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user.id)
    return LoginResponse(
        token=token,
        user={"id": user.id, "email": user.email, "name": user.name},
    )


@router.get("/me")
def me(user: Accountant = Depends(get_current_user)):
    return user

