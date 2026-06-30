from fastapi import APIRouter, Depends, HTTPException, Query
from sqlmodel import Session, func, select

from app.auth import get_current_user
from app.database import get_session
from app.models import Accountant, Expense, Payroll, Sale

router = APIRouter()

TABLE_MODEL = {
    "ventas": Sale,
    "gastos": Expense,
    "nomina": Payroll,
}

EXCLUDED_COLS = {"id", "accountant_id", "client_id"}


@router.get("/data")
def get_data(
    client_id: int = Query(...),
    table_type: str = Query(...),
    limit: int = Query(50, ge=1, le=500),
    offset: int = Query(0, ge=0),
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    model = TABLE_MODEL.get(table_type)
    if model is None:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid table_type '{table_type}'. Must be one of: {', '.join(TABLE_MODEL)}",
        )

    base = select(model).where(
        model.accountant_id == user.id,
        model.client_id == client_id,
    )

    total = session.exec(
        select(func.count()).select_from(model).where(
            model.accountant_id == user.id,
            model.client_id == client_id,
        )
    ).one()

    rows = session.exec(base.offset(offset).limit(limit)).all()

    columns = [
        c.name
        for c in model.__table__.columns
        if c.name not in EXCLUDED_COLS
    ]

    return {
        "columns": columns,
        "rows": [[getattr(r, c) for c in columns] for r in rows],
        "total": total,
        "table_type": table_type,
        "limit": limit,
        "offset": offset,
    }
