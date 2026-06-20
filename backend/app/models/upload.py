from datetime import date, datetime

from sqlmodel import Field, SQLModel


class Upload(SQLModel, table=True):
    __tablename__ = "uploads"

    id: int | None = Field(default=None, primary_key=True)
    accountant_id: int = Field(foreign_key="accountants.id", nullable=False)
    client_id: int = Field(foreign_key="clients.id", nullable=False)
    filename: str = Field(nullable=False)
    table_type: str = Field(nullable=False)
    period_date: date | None = None
    rows_processed: int = Field(default=0)
    rows_skipped: int = Field(default=0)
    created_at: datetime = Field(default_factory=datetime.utcnow)
