"""
services/resume_engine.py — Automatic session resume logic.

Reads the user's last completed session + its reflection to determine
what they were working on and whether it is worth recommending continuation.

No conversation required — the system infers intent from DB state.
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session as DBSession
from models import User, Session as SessionModel, Reflection


# Focus topic fallbacks — used when no reflection text is available
TOPIC_FALLBACKS = [
    "your last study topic",
    "the material from your previous session",
    "the concept you were practicing",
]


def _extract_focus(reflection) -> str:
    """
    Pull a short focus label from reflection text.
    If the text is short enough, use it directly; otherwise, summarise.
    """
    if reflection is None:
        return TOPIC_FALLBACKS[0]
    text = (reflection.text or "").strip()
    if not text:
        return TOPIC_FALLBACKS[0]
    # First sentence or first 60 chars is a good focus label
    first = text.split(".")[0].split("\n")[0]
    return first[:60] if len(first) > 60 else first


def _gap_message(gap_hours: float, duration: float, focus: str) -> dict:
    """
    Build the resume recommendation based on gap and prior session length.
    """
    gap_days = gap_hours / 24

    if gap_days <= 0.5:
        # Within last 12 hours — strong continuation signal
        return {
            "focus": focus,
            "message": (
                f"You left off on '{focus}' about {int(gap_hours)}h ago. "
                "Pick up exactly where you stopped — your memory of it is still fresh."
            ),
            "recommended_duration": min(int(duration) if duration else 25, 45),
            "urgency": "high",
        }

    if gap_days <= 1:
        # 12–24 hours — optimal spaced repetition window
        return {
            "focus": focus,
            "message": (
                f"It's been about {int(gap_hours)}h since your '{focus}' session. "
                "This is the perfect time for a retrieval practice round — recall before re-reading."
            ),
            "recommended_duration": 20,
            "urgency": "high",
        }

    if gap_days <= 2:
        # 1–2 days — still within retention window
        return {
            "focus": focus,
            "message": (
                f"Your last session on '{focus}' was {int(gap_days)} day(s) ago. "
                "A reinforcement session now will cement what you learned before recall fades."
            ),
            "recommended_duration": 25,
            "urgency": "medium",
        }

    # > 2 days — reactivation needed
    return {
        "focus": focus,
        "message": (
            f"It's been {int(gap_days)} days since you practiced '{focus}'. "
            "Start with a short reactivation cycle — 15 minutes of review to bring it back."
        ),
        "recommended_duration": 15,
        "urgency": "low",
    }


def generate_resume(db: DBSession, user: User) -> dict | None:
    """
    Main entry point.
    Returns a resume recommendation dict, or None if there is nothing to resume.
    """
    # Get the most recently completed session for this user
    last_session = (
        db.query(SessionModel)
        .filter(
            SessionModel.user_id == user.id,
            SessionModel.end_time.isnot(None),
        )
        .order_by(SessionModel.end_time.desc())
        .first()
    )

    if last_session is None:
        return None  # No history — nothing to resume

    now = datetime.utcnow()
    gap_hours = (now - last_session.end_time).total_seconds() / 3600
    duration = last_session.duration_minutes or 25

    # Reflection gives us the topic; fall back gracefully if absent
    reflection = last_session.reflection  # via ORM relationship (uselist=False)
    focus = _extract_focus(reflection)

    recommendation = _gap_message(gap_hours, duration, focus)
    recommendation["last_session_time"] = last_session.end_time.isoformat()
    recommendation["gap_hours"] = round(gap_hours, 1)
    recommendation["session_id"] = last_session.id

    return recommendation
