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


class ClientUpdate(BaseModel):
    name: str | None = None
    razon_social: str | None = None
    rfc: str | None = None
    industry: str | None = None


class ConversationCreate(BaseModel):
    client_id: int
    title: str | None = None


class ConversationUpdate(BaseModel):
    title: str


class ConversationResponse(BaseModel):
    id: int
    client_id: int
    title: str
    message_count: int
    last_message_at: str
    created_at: str


class MessageResponse(BaseModel):
    id: int
    role: str
    content: str
    chart_config: dict | None = None
    created_at: str


class GenerateTitleRequest(BaseModel):
    model: str | None = None


class ChatRequest(BaseModel):
    conversation_id: int
    message: str


class ChatResponse(BaseModel):
    answer_text: str
    chart_config: dict | None = None


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
