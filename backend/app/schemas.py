from pydantic import BaseModel


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
    razon_social: str | None = None
    rfc: str | None = None
    industry: str | None = None


class ChatRequest(BaseModel):
    client_id: int
    conversation_id: int | None = None
    message: str
    history: list[dict] = []


class ChatResponse(BaseModel):
    answer_text: str
    chart_config: dict | None = None
    conversation_id: int | None = None


class InsightCreate(BaseModel):
    client_id: int
    question: str
    answer_text: str
    chart_config: dict
    is_refreshable: bool = False
    period_date: str


class InsightRefresh(BaseModel):
    period_date: str | None = None


class UploadResponse(BaseModel):
    processed: int
    skipped: int
    unused_columns: list[str]
    period: str
