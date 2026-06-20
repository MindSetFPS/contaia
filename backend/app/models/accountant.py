from datetime import datetime

from sqlmodel import Field, SQLModel


class Accountant(SQLModel, table=True):
    __tablename__ = "accountants"

    id: int | None = Field(default=None, primary_key=True)
    email: str = Field(unique=True, nullable=False)
    password_hash: str = Field(nullable=False)
    name: str = Field(nullable=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)
