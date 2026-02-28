"""
routes/coach.py — POST /coach/query + POST /coach/advise
Both now powered by Groq AI with full user context.
"""
import os
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserTask, Session as SessionModel
from routes.deps import get_current_user

router = APIRouter(prefix="/coach", tags=["coach"])

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL   = "llama-3.3-70b-versatile"


class CoachRequest(BaseModel):
    message: str = Field(..., min_length=1)


def _groq(system: str, user_msg: str, max_tokens: int = 200) -> str:
    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)
    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user_msg},
        ],
        temperature=0.6,
        max_tokens=max_tokens,
    )
    return completion.choices[0].message.content.strip()


# ── Interactive coach ──────────────────────────────────────────────────────────

@router.post("/query")
def coach_query(
    body: CoachRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    now      = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    recent_tasks = (
        db.query(UserTask)
        .filter(UserTask.user_id == current_user.id)
        .order_by(UserTask.created_at.desc())
        .limit(10)
        .all()
    )
    pending_tasks   = [t.title for t in recent_tasks if t.status == "pending"]
    completed_tasks = [t.title for t in recent_tasks if t.status == "completed"]

    recent_sessions = (
        db.query(SessionModel)
        .filter(
            SessionModel.user_id == current_user.id,
            SessionModel.start_time >= week_ago,
        )
        .all()
    )
    total_duration = sum(s.duration_minutes for s in recent_sessions if s.duration_minutes)

    system = f"""You are XPilot Coach — a direct, data-driven productivity coach. One reply, max 2 sentences.
User: {current_user.name} | Role: {current_user.role.upper()}
Completed (recent): {', '.join(completed_tasks) or 'None'}
Pending: {', '.join(pending_tasks) or 'None'}
Focus time this week: {total_duration} minutes across {len(recent_sessions)} sessions.
Give one sharp, actionable response referencing their actual data."""

    try:
        reply = _groq(system, body.message, max_tokens=150)
    except Exception:
        if pending_tasks:
            reply = f"Your immediate priority is '{pending_tasks[0]}'. Block distractions and execute."
        elif completed_tasks:
            reply = f"Good work on '{completed_tasks[0]}'. Take a short break, then review your next objective."
        else:
            reply = f"You've logged {total_duration}m of focus this week. Maintain your consistency."

    return {"reply": reply}


# ── Proactive advise (nudge) ───────────────────────────────────────────────────

@router.post("/advise")
def coach_advise(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """One-sentence proactive nudge based on tasks and session data."""
    now      = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    pending_tasks = (
        db.query(UserTask)
        .filter(
            UserTask.user_id == current_user.id,
            UserTask.status.in_(["pending", "active"]),
        )
        .order_by(UserTask.order_index.asc(), UserTask.created_at.asc())
        .limit(5)
        .all()
    )

    recent_sessions = (
        db.query(SessionModel)
        .filter(
            SessionModel.user_id == current_user.id,
            SessionModel.start_time >= week_ago,
        )
        .all()
    )

    total_min     = sum(s.duration_minutes or 0 for s in recent_sessions)
    session_count = len(recent_sessions)
    avg_min       = round(total_min / session_count) if session_count else 0

    last = max((s.end_time for s in recent_sessions if s.end_time), default=None)
    idle_hours = round((now - last).total_seconds() / 3600, 1) if last else None

    task_lines = "\n".join(
        f"- [{t.priority.upper()}] {t.title} (~{t.estimated_minutes}m)"
        for t in pending_tasks
    ) or "No pending tasks."

    system = f"""You are XPilot Coach. Respond with ONE sentence only. No punctuation at the end. No lists.
Worker: {current_user.name}
Pending tasks:
{task_lines}
Sessions this week: {session_count}, avg {avg_min}m each, {f'{idle_hours}h idle' if idle_hours else 'no sessions yet'}.
Give the single most urgent action they should take right now."""

    try:
        advice = _groq(system, "What should I do right now?", max_tokens=80)
        return {"advice": advice, "source": "groq"}
    except Exception:
        if pending_tasks:
            top = pending_tasks[0]
            advice = f"Start '{top.title}' immediately — it's your highest priority right now."
        elif session_count > 0:
            advice = "All tasks complete — log a reflection or plan tomorrow's tasks."
        else:
            advice = "No sessions this week — create one task, set a 25-minute timer, and begin."
        return {"advice": advice, "source": "fallback"}
