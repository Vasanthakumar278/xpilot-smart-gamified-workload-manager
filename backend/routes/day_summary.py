"""
routes/day_summary.py — GET /day-summary
Returns planned vs completed workload minutes for today.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import UserTask
from routes.deps import get_current_user
from models import User

router = APIRouter(prefix="/day-summary", tags=["day-summary"])


@router.get("/")
def get_day_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Planned vs completed workload for today."""
    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
    today_end   = today_start + timedelta(days=1)

    all_tasks = (
        db.query(UserTask)
        .filter(UserTask.user_id == current_user.id)
        .all()
    )

    # Planned = all non-completed tasks (what the user intends to work on)
    pending_tasks   = [t for t in all_tasks if t.status in ("pending", "active")]
    completed_tasks = [
        t for t in all_tasks
        if t.status == "completed" and t.completed_at and
           today_start <= t.completed_at < today_end
    ]

    total_planned_minutes   = sum(t.estimated_minutes or 0 for t in pending_tasks)
    total_completed_minutes = sum(t.estimated_minutes or 0 for t in completed_tasks)
    active_tasks_count      = sum(1 for t in all_tasks if t.status == "active")

    return {
        "total_planned_minutes":   total_planned_minutes,
        "total_completed_minutes": total_completed_minutes,
        "active_tasks_count":      active_tasks_count,
        "pending_count":           len(pending_tasks),
        "completed_today":         len(completed_tasks),
    }
