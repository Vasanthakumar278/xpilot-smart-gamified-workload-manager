"""
services/xp_engine.py — XP calculation logic (pure, no side effects)
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session as DBSession
from models import Session as SessionModel, XPLog


def calculate_xp(duration_minutes: float, has_reflection: bool) -> int:
    """
    XP formula:
      base   = duration_minutes * 2
      bonus  = +20 if reflection exists
    """
    base_xp = int(duration_minutes * 2)
    reflection_bonus = 20 if has_reflection else 0
    return base_xp + reflection_bonus


def get_weekly_session_count(db: DBSession, user_id: int) -> int:
    """Count sessions this calendar week (Mon–Sun)."""
    now = datetime.utcnow()
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    return (
        db.query(SessionModel)
        .filter(
            SessionModel.user_id == user_id,
            SessionModel.start_time >= week_start,
            SessionModel.end_time.isnot(None),
        )
        .count()
    )


def award_xp(db: DBSession, user_id: int, session_id: int) -> dict:
    """
    Calculate and award XP for a completed session.
    Returns breakdown of awarded XP.
    """
    from models import User, Reflection

    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not session or session.user_id != user_id:
        return {"error": "Session not found"}
    if not session.end_time:
        return {"error": "Session not ended yet"}

    reflection = db.query(Reflection).filter(Reflection.session_id == session_id).first()
    has_reflection = reflection is not None
    duration = session.duration_minutes or 0

    base = int(duration * 2)
    ref_bonus = 20 if has_reflection else 0

    # Consistency bonus: +10 if 3+ sessions this week
    weekly_count = get_weekly_session_count(db, user_id)
    consistency_bonus = 10 if weekly_count >= 3 else 0

    total_xp = base + ref_bonus + consistency_bonus

    reasons = []
    if base > 0:
        reasons.append(f"{duration:.1f} min session")
    if ref_bonus:
        reasons.append("reflection bonus")
    if consistency_bonus:
        reasons.append("consistency bonus")

    reason_str = " + ".join(reasons) if reasons else "session completed"

    # Persist XP log
    xp_log = XPLog(user_id=user_id, xp_awarded=total_xp, reason=reason_str)
    db.add(xp_log)

    # Update user total XP
    user = db.query(User).filter(User.id == user_id).first()
    user.xp += total_xp

    db.commit()

    return {
        "total_xp": total_xp,
        "base": base,
        "reflection_bonus": ref_bonus,
        "consistency_bonus": consistency_bonus,
        "reason": reason_str,
        "new_total": user.xp,
    }
