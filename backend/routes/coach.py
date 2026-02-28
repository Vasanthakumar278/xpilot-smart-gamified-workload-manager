"""
routes/coach.py — POST /coach/query (original) + POST /coach/advise (worker AI)
"""
import httpx
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserTask, Session as SessionModel
from routes.deps import get_current_user

router = APIRouter(prefix="/coach", tags=["coach"])

OLLAMA_URL = "http://localhost:11434/api/generate"


class CoachRequest(BaseModel):
    message: str = Field(..., min_length=1)


# ── Original interactive coach ────────────────────────────────────────────────

@router.post("/query")
def coach_query(
    body: CoachRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recent_tasks = (
        db.query(UserTask)
        .filter(UserTask.user_id == current_user.id)
        .order_by(UserTask.created_at.desc())
        .limit(10)
        .all()
    )
    pending_tasks   = [t.title for t in recent_tasks if t.status == "pending"]
    completed_tasks = [t.title for t in recent_tasks if t.status == "completed"]

    now = datetime.utcnow()
    recent_sessions = (
        db.query(SessionModel)
        .filter(
            SessionModel.user_id == current_user.id,
            SessionModel.start_time >= now - timedelta(days=7),
        )
        .all()
    )
    total_duration = sum(s.duration_minutes for s in recent_sessions if s.duration_minutes)

    context  = f"User: {current_user.name}\n"
    context += f"Completed Tasks: {', '.join(completed_tasks) or 'None'}\n"
    context += f"Pending Tasks: {', '.join(pending_tasks) or 'None'}\n"
    context += f"Focus Time (7 days): {total_duration} minutes\n"

    prompt = f"""You are a strict, direct, and motivating productivity coach.
Based on this history:
{context}
Answer the user question directly and concisely. Suggest the single best next action.
User question: {body.message}"""

    if pending_tasks:
        reply = f"System Offline. Your immediate priority is: '{pending_tasks[0]}'. Block distractions and execute."
    elif completed_tasks:
        reply = f"System Offline. Good work on '{completed_tasks[0]}'. Take a short break, then review your next objective."
    elif total_duration > 0:
        reply = f"System Offline. You've logged {total_duration} minutes of focus this week. Maintain your consistency."
    else:
        reply = "System Offline. Your activity log is empty. Start a new focus session right now to build momentum."

    return {"reply": reply}


# ── New actionable advise endpoint (Ollama + fallback) ───────────────────────

@router.post("/advise")
def coach_advise(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns a short, actionable single-sentence suggestion based on:
    - unfinished tasks (ordered by priority)
    - recent session data (idle gaps, avg duration)
    No user message needed — proactive nudge only.
    """
    now         = datetime.utcnow()
    week_ago    = now - timedelta(days=7)

    # Gather context
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

    total_min    = sum(s.duration_minutes or 0 for s in recent_sessions)
    session_count = len(recent_sessions)
    avg_min      = round(total_min / session_count) if session_count else 0

    # Detect idle gap: hours since last session
    last = max(
        (s.end_time for s in recent_sessions if s.end_time),
        default=None,
    )
    idle_hours = round((now - last).total_seconds() / 3600, 1) if last else None

    # Build task summary
    task_lines = "\n".join(
        f"- [{t.priority.upper()}] {t.title} (~{t.estimated_minutes}m)"
        for t in pending_tasks
    ) or "No pending tasks."

    prompt = f"""You are a direct productivity coach. Respond with ONE sentence only. No explanations. No lists.

Worker: {current_user.name}
Pending tasks:
{task_lines}
Recent sessions: {session_count} sessions, avg {avg_min} min each, {f'{idle_hours}h idle' if idle_hours is not None else 'no recent sessions'}.

Give ONE short, direct action they should take right now. Use the task name if relevant."""

    # Try Ollama first
    try:
        response = httpx.post(
            OLLAMA_URL,
            json={"model": "mistral", "prompt": prompt, "stream": False},
            timeout=10.0,
        )
        if response.status_code == 200:
            advice = response.json().get("response", "").strip()
            if advice:
                return {"advice": advice, "source": "ollama"}
    except Exception:
        pass  # Ollama unavailable — use rule-based fallback

    # Rule-based fallback
    if pending_tasks:
        top = pending_tasks[0]
        if top.priority == "high":
            advice = f"Start '{top.title}' immediately — it's your highest priority right now."
        elif idle_hours and idle_hours > 2:
            advice = f"You've been idle for {idle_hours}h — open '{top.title}' and set a {top.estimated_minutes}-minute timer."
        else:
            advice = f"Your next task is '{top.title}' (~{top.estimated_minutes}m) — start it before checking anything else."
    elif session_count > 0:
        advice = f"All tasks complete. Log a reflection or add tomorrow's tasks while your memory is fresh."
    else:
        advice = "No sessions this week. Create one task, set a 25-minute timer, and begin."

    return {"advice": advice, "source": "fallback"}
