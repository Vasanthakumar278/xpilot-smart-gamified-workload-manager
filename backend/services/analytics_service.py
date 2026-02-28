"""
services/analytics_service.py — Rule-based analytics from session data
No machine learning — pure computation.
"""
from datetime import datetime, timedelta
from sqlalchemy.orm import Session as DBSession
from models import Session as SessionModel, XPLog


def get_analytics(db: DBSession, user_id: int) -> dict:
    """Compute all analytics metrics for a user."""
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = now - timedelta(days=now.weekday())
    week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

    all_sessions = (
        db.query(SessionModel)
        .filter(
            SessionModel.user_id == user_id,
            SessionModel.end_time.isnot(None),
        )
        .all()
    )

    # Today's sessions
    today_sessions = [
        s for s in all_sessions if s.start_time >= today_start
    ]

    # This week's sessions
    week_sessions = [
        s for s in all_sessions if s.start_time >= week_start
    ]

    # Metrics
    total_focus_today = sum(
        s.duration_minutes or 0 for s in today_sessions
    )
    avg_session_length = (
        sum(s.duration_minutes or 0 for s in all_sessions) / len(all_sessions)
        if all_sessions
        else 0
    )

    # Consistency score: days with at least one session / last 7 days
    session_dates = set(s.start_time.date() for s in all_sessions)
    last_7_days = {(now - timedelta(days=i)).date() for i in range(7)}
    active_days = session_dates & last_7_days
    consistency_score = round(len(active_days) / 7 * 100)

    # XP earned today
    today_xp = (
        db.query(XPLog)
        .filter(
            XPLog.user_id == user_id,
            XPLog.created_at >= today_start,
        )
        .all()
    )
    xp_today = sum(x.xp_awarded for x in today_xp)

    # Session duration distribution (short/medium/long)
    short = sum(1 for s in all_sessions if (s.duration_minutes or 0) < 25)
    medium = sum(1 for s in all_sessions if 25 <= (s.duration_minutes or 0) < 60)
    long_ = sum(1 for s in all_sessions if (s.duration_minutes or 0) >= 60)

    return {
        "total_focus_time_today": round(total_focus_today, 1),
        "avg_session_length": round(avg_session_length, 1),
        "sessions_today": len(today_sessions),
        "sessions_this_week": len(week_sessions),
        "total_sessions": len(all_sessions),
        "consistency_score": consistency_score,
        "xp_today": xp_today,
        "session_distribution": {
            "short_under_25m": short,
            "medium_25_60m": medium,
            "long_over_60m": long_,
        },
        "active_days_last_7": len(active_days),
    }
