from datetime import date, datetime

from sqlmodel import Field, SQLModel


class Insight(SQLModel, table=True):
    __tablename__ = "insights"

    id: int | None = Field(default=None, primary_key=True)
    accountant_id: int = Field(foreign_key="accountants.id", nullable=False)
    client_id: int = Field(foreign_key="clients.id", nullable=False)
    question: str = Field(nullable=False)
    answer_text: str = Field(nullable=False)
    chart_config: str | None = None
    is_refreshable: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    period_date: date = Field(nullable=False)
