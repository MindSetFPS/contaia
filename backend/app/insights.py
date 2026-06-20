from fastapi import APIRouter, Depends
from sqlmodel import Session, select

from app.auth import get_current_user
from app.database import get_session
from app.models import Accountant, Insight
from app.schemas import InsightCreate, InsightRefresh

router = APIRouter()


@router.get("/insights")
def list_insights(
    client_id: int,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    insights = session.exec(
        select(Insight)
        .where(Insight.accountant_id == user.id, Insight.client_id == client_id)
        .order_by(Insight.created_at.desc())
    ).all()
    return insights


@router.post("/insights")
def create_insight(
    body: InsightCreate,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    insight = Insight(
        accountant_id=user.id,
        client_id=body.client_id,
        question=body.question,
        answer_text=body.answer_text,
        chart_config=str(body.chart_config) if isinstance(body.chart_config, dict) else body.chart_config,
        is_refreshable=body.is_refreshable,
        period_date=body.period_date,
    )
    session.add(insight)
    session.commit()
    session.refresh(insight)
    return insight


@router.post("/insights/{insight_id}/refresh")
def refresh_insight(
    insight_id: int,
    body: InsightRefresh,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return {"detail": "Insight refresh — not yet implemented"}


@router.delete("/insights/{insight_id}")
def delete_insight(
    insight_id: int,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    insight = session.exec(
        select(Insight).where(Insight.id == insight_id, Insight.accountant_id == user.id)
    ).first()
    if not insight:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Insight not found")
    session.delete(insight)
    session.commit()
    return {"detail": "Deleted"}


@router.post("/insights/analyze")
def analyze(
    client_id: int,
    period_date: str,
    user: Accountant = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    return {"detail": "Analyze endpoint — not yet implemented"}
