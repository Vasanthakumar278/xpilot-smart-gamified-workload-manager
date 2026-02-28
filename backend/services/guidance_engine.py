"""
services/guidance_engine.py — Deterministic recommendation engine.

Reads database state and applies rule-based decision trees to tell the
user exactly what to do next. No LLM, no randomness — pure logic.
"""
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session as DBSession
from models import User, Session as SessionModel, EnergyLog


# ── Action constants ──────────────────────────────────────────────────────────
class Action:
    START_SESSION   = "start_session"
    SHORT_REVIEW    = "short_review"
    MAINTAIN_STREAK = "maintain_streak"
    REST            = "rest"
    ADMIN_WORK      = "admin_work"
    FOCUS_BLOCK     = "focus_block"
    DEEP_WORK       = "deep_work"
    TAKE_BREAK      = "take_break"
    LOG_ENERGY      = "log_energy"


def get_recommendation(db: DBSession, user: User) -> dict:
    """
    Main entry point. Dispatches to role-specific logic.
    Returns: { action, message, priority, context }
    """
    if user.role == "worker":
        return _worker_guidance(db, user)
    return _student_guidance(db, user)


# ── STUDENT GUIDANCE ──────────────────────────────────────────────────────────

def _student_guidance(db: DBSession, user: User) -> dict:
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Sessions today (completed)
    today_sessions = (
        db.query(SessionModel)
        .filter(
            SessionModel.user_id == user.id,
            SessionModel.start_time >= today_start,
            SessionModel.end_time.isnot(None),
        )
        .order_by(SessionModel.end_time.desc())
        .all()
    )

    # Consistency: active days in last 7
    all_completed = (
        db.query(SessionModel)
        .filter(
            SessionModel.user_id == user.id,
            SessionModel.end_time.isnot(None),
        )
        .all()
    )
    session_dates = {s.start_time.date() for s in all_completed}
    last_7 = {(now - timedelta(days=i)).date() for i in range(7)}
    active_days = len(session_dates & last_7)
    consistency_pct = round(active_days / 7 * 100)

    sessions_today = len(today_sessions)
    last_session = today_sessions[0] if today_sessions else None
    minutes_since_last = (
        (now - last_session.end_time).total_seconds() / 60
        if last_session
        else None
    )

    # ── Decision tree ─────────────────────────────────────────────────────────

    # No session at all today
    if sessions_today == 0:
        return {
            "action": Action.START_SESSION,
            "message": "You haven't practiced yet today. A focused 25-minute session will keep your consistency strong.",
            "priority": "high",
            "context": {"sessions_today": 0, "consistency_pct": consistency_pct},
        }

    # Studied recently (< 30 minutes ago) — suggest short review
    if minutes_since_last is not None and minutes_since_last < 30:
        return {
            "action": Action.SHORT_REVIEW,
            "message": f"You just finished a session. Spend 5–10 minutes reviewing what you covered to lock it into memory.",
            "priority": "medium",
            "context": {"sessions_today": sessions_today, "minutes_since_last": round(minutes_since_last)},
        }

    # Good streak — more than 2 sessions, consistency healthy
    if sessions_today >= 2 and consistency_pct >= 70:
        return {
            "action": Action.REST,
            "message": f"Strong day — {sessions_today} sessions done. You've earned a proper rest. Return tomorrow to maintain your {active_days}-day streak.",
            "priority": "low",
            "context": {"sessions_today": sessions_today, "active_days": active_days},
        }

    # Consistency dropping (below 45% in last 7 days)
    if consistency_pct < 45:
        return {
            "action": Action.MAINTAIN_STREAK,
            "message": f"Your consistency is at {consistency_pct}% this week. Even a short 15-minute review session today will help rebuild the habit.",
            "priority": "high",
            "context": {"consistency_pct": consistency_pct, "sessions_today": sessions_today},
        }

    # Default: suggest another practice block
    return {
        "action": Action.START_SESSION,
        "message": f"Ready for your next practice? Aim for another 25–30 minute focused session.",
        "priority": "medium",
        "context": {"sessions_today": sessions_today, "consistency_pct": consistency_pct},
    }


# ── WORKER GUIDANCE ───────────────────────────────────────────────────────────

def _worker_guidance(db: DBSession, user: User) -> dict:
    now = datetime.utcnow()
    today = date.today()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Latest energy log for today
    energy_log = (
        db.query(EnergyLog)
        .filter(EnergyLog.user_id == user.id, EnergyLog.date == today)
        .first()
    )

    # Sessions in last 7 days — check for long work streaks
    recent_sessions = (
        db.query(SessionModel)
        .filter(
            SessionModel.user_id == user.id,
            SessionModel.end_time.isnot(None),
            SessionModel.start_time >= now - timedelta(days=7),
        )
        .all()
    )
    session_dates = {s.start_time.date() for s in recent_sessions}
    consecutive_days = _count_consecutive_days(session_dates, today)

    # Sessions today
    today_sessions = [s for s in recent_sessions if s.start_time >= today_start]
    total_focus_today = sum(s.duration_minutes or 0 for s in today_sessions)

    # ── No energy logged — first action is always to log it ──────────────────
    if not energy_log:
        return {
            "action": Action.LOG_ENERGY,
            "message": "Start by logging your energy level. Your workload plan and focus blocks depend on your current capacity.",
            "priority": "high",
            "context": {"energy_logged": False},
        }

    level = energy_log.level

    # Long work streak — burnout prevention
    if consecutive_days >= 6:
        return {
            "action": Action.TAKE_BREAK,
            "message": f"You've worked {consecutive_days} consecutive days. Schedule a full rest day soon — sustained high output degrades decision quality.",
            "priority": "high",
            "context": {"consecutive_days": consecutive_days, "energy_level": level},
        }

    # Substantial focus already done today (>90 min)
    if total_focus_today >= 90:
        return {
            "action": Action.TAKE_BREAK,
            "message": f"You've logged {round(total_focus_today)} minutes of focus today. Protect your afternoon — schedule a mandatory recovery block before more deep work.",
            "priority": "medium",
            "context": {"total_focus_today": round(total_focus_today), "energy_level": level},
        }

    # Energy low (1–3) → admin / light work
    if level <= 3:
        return {
            "action": Action.ADMIN_WORK,
            "message": f"Energy at {level}/10 — low capacity. Route to administrative tasks: emails, scheduling, and low-stakes reviews only. Defer decisions.",
            "priority": "medium",
            "context": {"energy_level": level, "tier": "low"},
        }

    # Energy medium (4–6) → structured focus block
    if level <= 6:
        return {
            "action": Action.FOCUS_BLOCK,
            "message": f"Energy at {level}/10 — solid capacity. Start a 45-minute structured focus block on your primary task. Use the generated schedule as your guide.",
            "priority": "high",
            "context": {"energy_level": level, "tier": "medium"},
        }

    # Energy high (7–10) → deep work
    return {
        "action": Action.DEEP_WORK,
        "message": f"Energy at {level}/10 — optimal capacity. Begin a 90-minute deep work block on your highest-leverage problem. Block all interruptions now.",
        "priority": "high",
        "context": {"energy_level": level, "tier": "high"},
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _count_consecutive_days(session_dates: set, reference: date) -> int:
    """Count how many consecutive days up to and including reference have a session."""
    count = 0
    current = reference
    while current in session_dates:
        count += 1
        current -= timedelta(days=1)
    return count
