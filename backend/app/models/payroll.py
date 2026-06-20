from datetime import date

from sqlmodel import Field, SQLModel


class Payroll(SQLModel, table=True):
    __tablename__ = "payroll"

    id: int | None = Field(default=None, primary_key=True)
    accountant_id: int = Field(foreign_key="accountants.id", nullable=False)
    client_id: int = Field(foreign_key="clients.id", nullable=False)
    fecha: date = Field(nullable=False)
    empleado: str = Field(nullable=False)
    puesto: str | None = None
    salario_bruto: float = Field(nullable=False)
    deducciones: float = Field(default=0)
    salario_neto: float = Field(nullable=False)
    isr: float = Field(default=0)
    imss: float = Field(default=0)
