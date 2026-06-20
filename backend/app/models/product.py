from datetime import date

from sqlmodel import Field, SQLModel


class Product(SQLModel, table=True):
    __tablename__ = "products"

    id: int | None = Field(default=None, primary_key=True)
    accountant_id: int = Field(foreign_key="accountants.id", nullable=False)
    client_id: int = Field(foreign_key="clients.id", nullable=False)
    period_date: date = Field(nullable=False)
    nombre: str = Field(nullable=False)
    categoria: str | None = None
    precio_unitario: float | None = None
    costo_unitario: float | None = None
