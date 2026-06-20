from datetime import date

from sqlmodel import Field, SQLModel


class Expense(SQLModel, table=True):
    __tablename__ = "expenses"

    id: int | None = Field(default=None, primary_key=True)
    accountant_id: int = Field(foreign_key="accountants.id", nullable=False)
    client_id: int = Field(foreign_key="clients.id", nullable=False)
    fecha: date = Field(nullable=False)
    categoria: str = Field(nullable=False)
    descripcion: str | None = None
    monto: float = Field(nullable=False)
    iva: float = Field(default=0)
