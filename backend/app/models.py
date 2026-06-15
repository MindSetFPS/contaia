from pydantic import BaseModel, EmailStr


class RegisterRequest(BaseModel):
    email: str
    password: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    token: str
    user: dict


class ClientCreate(BaseModel):
    name: str
    rfc: str | None = None
    industry: str | None = None


class ChatRequest(BaseModel):
    client_id: int
    message: str
    history: list[dict] = []


class ChatResponse(BaseModel):
    answer_text: str
    chart_config: dict | None = None


class InsightCreate(BaseModel):
    client_id: int
    question: str
    answer_text: str
    chart_config: dict
    is_refreshable: bool = False
    period_id: str


class InsightRefresh(BaseModel):
    period_id: str | None = None
