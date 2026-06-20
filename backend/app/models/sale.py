from datetime import date

from sqlmodel import Field, SQLModel


class Sale(SQLModel, table=True):
    __tablename__ = "sales"

    id: int | None = Field(default=None, primary_key=True)
    accountant_id: int = Field(foreign_key="accountants.id", nullable=False)
    client_id: int = Field(foreign_key="clients.id", nullable=False)
    fecha: date = Field(nullable=False)
    cliente_nombre: str = Field(nullable=False)
    producto: str = Field(nullable=False)
    cantidad: float = Field(default=1)
    precio_unitario: float | None = None
    monto_neto: float = Field(nullable=False)
    iva: float = Field(default=0)
    monto_total: float = Field(nullable=False)
