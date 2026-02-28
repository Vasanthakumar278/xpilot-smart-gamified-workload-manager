"""
routes/worker_analytics.py — GET /worker/analytics
Worker-specific performance metrics.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models import UserTask, Session as SessionModel, Project
from routes.deps import get_current_user
from models import User

router = APIRouter(prefix="/worker", tags=["worker-analytics"])


@router.get("/analytics")
def get_worker_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    today       = datetime.utcnow().date()
    week_start  = today - timedelta(days=6)

    # ── All sessions ─────────────────────────────────────────────────
    all_sessions = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == current_user.id)
        .all()
    )
    completed_sessions = [s for s in all_sessions if s.duration_minutes]

    today_sessions = [
        s for s in completed_sessions
        if s.end_time and s.end_time.date() == today
    ]
    week_sessions = [
        s for s in completed_sessions
        if s.end_time and s.end_time.date() >= week_start
    ]

    today_minutes = round(sum(s.duration_minutes for s in today_sessions))
    week_minutes  = round(sum(s.duration_minutes for s in week_sessions))
    avg_session   = round(
        sum(s.duration_minutes for s in completed_sessions) / len(completed_sessions)
    ) if completed_sessions else 0

    # ── All tasks ────────────────────────────────────────────────────
    all_tasks = db.query(UserTask).filter(UserTask.user_id == current_user.id).all()
    done_tasks  = [t for t in all_tasks if t.status == "completed"]
    completion_ratio = round(
        (len(done_tasks) / len(all_tasks)) * 100
    ) if all_tasks else 0

    # ── 7-Day trend ──────────────────────────────────────────────────
    trend_dict = {
        (week_start + timedelta(days=i)).isoformat(): 0
        for i in range(7)
    }
    for s in week_sessions:
        if s.end_time:
            key = s.end_time.date().isoformat()
            if key in trend_dict:
                trend_dict[key] += s.duration_minutes or 0
    trend = [{"date": k, "minutes": round(v)} for k, v in trend_dict.items()]

    # ── Time per project ─────────────────────────────────────────────
    project_time: dict[str, float] = {}
    for s in completed_sessions:
        if not s.task_id:
            continue
        task = db.query(UserTask).filter(UserTask.id == s.task_id).first()
        if task:
            label = task.project or "Uncategorized"
            if task.project_id:
                proj = db.query(Project).filter(Project.id == task.project_id).first()
                if proj:
                    label = proj.name
            project_time[label] = project_time.get(label, 0) + (s.duration_minutes or 0)

    time_per_project = [
        {"project": k, "minutes": round(v)}
        for k, v in sorted(project_time.items(), key=lambda x: -x[1])
    ]

    # ── Energy vs output ─────────────────────────────────────────────
    energy_buckets: dict[int, list] = {}
    for s in completed_sessions:
        if s.energy_level is not None:
            energy_buckets.setdefault(s.energy_level, []).append(s.duration_minutes or 0)
    energy_vs_output = [
        {
            "energy_level": level,
            "session_count": len(durations),
            "avg_minutes": round(sum(durations) / len(durations)),
        }
        for level, durations in sorted(energy_buckets.items(), reverse=True)
    ]

    return {
        "today_focus_minutes":  today_minutes,
        "week_focus_minutes":   week_minutes,
        "avg_session_length":   avg_session,
        "completion_ratio":     completion_ratio,
        "trend":                trend,
        "time_per_project":     time_per_project,
        "energy_vs_output":     energy_vs_output,
        "total_tasks":          len(all_tasks),
        "completed_tasks":      len(done_tasks),
    }
