from fastapi import APIRouter, Depends

from app.auth import get_current_user
from app.db import get_connection
from app.models import InsightCreate, InsightRefresh

router = APIRouter()


@router.get("/insights")
def list_insights(client_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    rows = conn.execute(
        """SELECT id, question, answer_text, chart_config, is_refreshable, created_at, last_period_id
           FROM insights
           WHERE accountant_id = ? AND client_id = ?
           ORDER BY created_at DESC""",
        (user["id"], client_id),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


@router.post("/insights")
def create_insight(body: InsightCreate, user: dict = Depends(get_current_user)):
    conn = get_connection()
    cursor = conn.execute(
        """INSERT INTO insights (accountant_id, client_id, question, answer_text, chart_config, is_refreshable, last_period_id)
           VALUES (?, ?, ?, ?, ?, ?, ?)""",
        (user["id"], body.client_id, body.question, body.answer_text, body.chart_config, body.is_refreshable, body.period_id),
    )
    conn.commit()
    row = conn.execute("SELECT * FROM insights WHERE id = ?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return dict(row)


@router.post("/insights/{insight_id}/refresh")
def refresh_insight(insight_id: int, body: InsightRefresh, user: dict = Depends(get_current_user)):
    return {"detail": "Insight refresh — not yet implemented"}


@router.delete("/insights/{insight_id}")
def delete_insight(insight_id: int, user: dict = Depends(get_current_user)):
    conn = get_connection()
    conn.execute(
        "DELETE FROM insights WHERE id = ? AND accountant_id = ?",
        (insight_id, user["id"]),
    )
    conn.commit()
    conn.close()
    return {"detail": "Deleted"}


@router.post("/insights/analyze")
def analyze(client_id: int, period_id: str, user: dict = Depends(get_current_user)):
    return {"detail": "Analyze endpoint — not yet implemented"}
