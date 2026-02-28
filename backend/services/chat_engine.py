"""
services/chat_engine.py — Groq-powered AI chat engine.

Loads comprehensive user context (sessions, tasks, projects, XP, energy, ELO,
achievements) and sends it to Groq LLM for deeply personalised analysis and
actionable ideas — for both student and worker roles.
"""
import os
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session as DBSession
from models import (
    User, Session as SessionModel, EnergyLog, XPLog,
    UserTask, Project, Challenge, MatchResult,
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
GROQ_MODEL   = "llama-3.3-70b-versatile"


def _groq_client():
    from groq import Groq
    return Groq(api_key=GROQ_API_KEY)


# ── Context loader ─────────────────────────────────────────────────────────────

def _load_full_context(db: DBSession, user: User) -> dict:
    now        = datetime.utcnow()
    today      = now.date()
    week_start = today - timedelta(days=6)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # Sessions
    all_sessions = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == user.id)
        .all()
    )
    completed_sessions = [s for s in all_sessions if s.duration_minutes]
    today_sessions     = [s for s in completed_sessions if s.end_time and s.end_time.date() == today]
    week_sessions      = [s for s in completed_sessions if s.end_time and s.end_time.date() >= week_start]

    today_focus   = round(sum(s.duration_minutes for s in today_sessions))
    week_focus    = round(sum(s.duration_minutes for s in week_sessions))
    avg_session   = round(sum(s.duration_minutes for s in completed_sessions) / len(completed_sessions)) if completed_sessions else 0
    total_sessions = len(completed_sessions)

    session_dates = {s.start_time.date() for s in completed_sessions}
    last_7_dates  = {(now - timedelta(days=i)).date() for i in range(7)}
    active_days   = len(session_dates & last_7_dates)
    consistency   = round(active_days / 7 * 100)

    last_session = max(completed_sessions, key=lambda s: s.end_time, default=None) if completed_sessions else None
    idle_minutes = round((now - last_session.end_time).total_seconds() / 60) if last_session and last_session.end_time else None

    # XP
    xp_logs = db.query(XPLog).filter(XPLog.user_id == user.id).all()
    xp_today = sum(x.xp_awarded for x in xp_logs if x.created_at >= today_start)
    xp_week  = sum(x.xp_awarded for x in xp_logs if x.created_at >= datetime.combine(week_start, datetime.min.time()))

    # Energy
    energy_log = (
        db.query(EnergyLog)
        .filter(EnergyLog.user_id == user.id, EnergyLog.date == today)
        .first()
    )
    energy_level = energy_log.level if energy_log else None

    # Energy trend (last 7 days)
    energy_trend = (
        db.query(EnergyLog)
        .filter(EnergyLog.user_id == user.id, EnergyLog.date >= week_start)
        .order_by(EnergyLog.date.asc())
        .all()
    )
    energy_trend_str = ", ".join(f"{e.date.strftime('%a')}:{e.level}" for e in energy_trend) or "No data"

    # Tasks
    all_tasks      = db.query(UserTask).filter(UserTask.user_id == user.id).all()
    pending_tasks  = [t for t in all_tasks if t.status == "pending"]
    active_tasks   = [t for t in all_tasks if t.status == "active"]
    completed_tasks = [t for t in all_tasks if t.status == "completed"]

    high_priority   = [t for t in pending_tasks if t.priority == "high"]
    total_est_mins  = sum(t.estimated_minutes for t in pending_tasks + active_tasks)

    # Projects
    projects = db.query(Project).filter(Project.user_id == user.id).all()
    project_names = [p.name for p in projects]

    # Arena (worker only)
    arena_data = {}
    if user.role == "worker":
        challenges_won = (
            db.query(MatchResult)
            .filter(MatchResult.winner_id == user.id)
            .count()
        )
        total_challenges = (
            db.query(Challenge)
            .filter(
                (Challenge.challenger_id == user.id) | (Challenge.opponent_id == user.id),
                Challenge.status == "finished",
            )
            .count()
        )
        arena_data = {
            "elo_rating": user.elo_rating,
            "rank_points": user.rank_points,
            "challenges_won": challenges_won,
            "total_challenges": total_challenges,
            "win_rate": round((challenges_won / total_challenges) * 100) if total_challenges else 0,
        }

    # 7-day output trend
    trend_dict = {(week_start + timedelta(days=i)).isoformat(): 0 for i in range(7)}
    for s in week_sessions:
        if s.end_time:
            key = s.end_time.date().isoformat()
            if key in trend_dict:
                trend_dict[key] += round(s.duration_minutes or 0)
    trend_str = ", ".join(f"{k[-5:]}:{v}m" for k, v in trend_dict.items())

    return {
        "name": user.name,
        "role": user.role,
        "xp_total": user.xp,
        "xp_today": xp_today,
        "xp_week": xp_week,
        "today_focus_minutes": today_focus,
        "week_focus_minutes": week_focus,
        "avg_session_minutes": avg_session,
        "total_sessions": total_sessions,
        "sessions_today": len(today_sessions),
        "active_days_this_week": active_days,
        "consistency_pct": consistency,
        "idle_minutes": idle_minutes,
        "energy_today": energy_level,
        "energy_trend_7d": energy_trend_str,
        "pending_tasks": [(t.title, t.priority, t.estimated_minutes) for t in pending_tasks[:8]],
        "active_task": active_tasks[0].title if active_tasks else None,
        "completed_tasks_count": len(completed_tasks),
        "high_priority_count": len(high_priority),
        "total_pending_minutes": total_est_mins,
        "projects": project_names,
        "7day_focus_trend": trend_str,
        **arena_data,
    }


# ── System prompts ─────────────────────────────────────────────────────────────

def _build_system_prompt(ctx: dict) -> str:
    role = ctx["role"]

    base = f"""You are XPilot AI — an elite, hyper-personalised productivity intelligence system embedded in the XPilot platform.

You have full access to the user's real-time data. Analyse everything and deliver sharp, specific, actionable intelligence.

RULES:
- Never be generic. Every insight must reference the user's actual numbers.
- Be direct, concise, and confident. No filler phrases.
- Always give at least one concrete "do this right now" recommendation.
- If the user asks a question, answer it AND add one proactive insight from their data.
- Max 3–4 sentences unless a detailed breakdown is specifically requested.

USER PROFILE:
- Name: {ctx['name']}
- Role: {role.upper()}
- Total XP: {ctx['xp_total']} | XP Today: {ctx['xp_today']} | XP This Week: {ctx['xp_week']}
- Total Sessions: {ctx['total_sessions']}
- Today: {ctx['sessions_today']} session(s), {ctx['today_focus_minutes']} minutes of focus
- This Week: {ctx['week_focus_minutes']} minutes, active {ctx['active_days_this_week']}/7 days ({ctx['consistency_pct']}% consistency)
- Avg Session Length: {ctx['avg_session_minutes']} min
- Idle Since Last Session: {f"{ctx['idle_minutes']} minutes ago" if ctx['idle_minutes'] is not None else 'No sessions yet'}
- 7-Day Focus Trend: {ctx['7day_focus_trend']}
- Energy Today: {ctx['energy_today'] if ctx['energy_today'] else 'Not logged'}/10
- Energy Trend (7d): {ctx['energy_trend_7d']}
"""

    if role == "worker":
        pending_str = "\n".join(
            f"  • [{p}] {t} (~{m}m)" for t, p, m in ctx["pending_tasks"]
        ) or "  None"
        base += f"""
WORK STATUS:
- Active Task: {ctx['active_task'] or 'None'}
- Pending Tasks ({len(ctx['pending_tasks'])} shown):
{pending_str}
- High Priority Backlog: {ctx['high_priority_count']} tasks
- Total Estimated Workload: {ctx['total_pending_minutes']} minutes
- Completed Tasks (all time): {ctx['completed_tasks_count']}
- Projects: {', '.join(ctx['projects']) or 'None'}

FOCUS ARENA (ELO Competitive):
- ELO Rating: {ctx.get('elo_rating', 'N/A')}
- Rank Points: {ctx.get('rank_points', 0)}
- Arena Record: {ctx.get('challenges_won', 0)}W / {ctx.get('total_challenges', 0)} matches ({ctx.get('win_rate', 0)}% win rate)
"""
    else:  # student
        pending_str = "\n".join(
            f"  • [{p}] {t} (~{m}m)" for t, p, m in ctx["pending_tasks"]
        ) or "  None"
        base += f"""
STUDY STATUS:
- Active Task: {ctx['active_task'] or 'None'}
- Pending Study Tasks ({len(ctx['pending_tasks'])} shown):
{pending_str}
- Completed Tasks (all time): {ctx['completed_tasks_count']}
- Total Estimated Remaining: {ctx['total_pending_minutes']} minutes
- Subjects/Tracks: {', '.join(ctx['projects']) or 'None'}
"""

    base += "\nNow respond to the user's message with sharp, data-driven intelligence:"
    return base


# ── Main entry ─────────────────────────────────────────────────────────────────

def get_chat_response(db: DBSession, user: User, message: str) -> dict:
    """
    Loads full user context and sends to Groq LLM.
    Returns { reply: str, action: str | None, intent: str }
    """
    ctx = _load_full_context(db, user)

    try:
        client = _groq_client()
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": _build_system_prompt(ctx)},
                {"role": "user",   "content": message},
            ],
            temperature=0.65,
            max_tokens=350,
        )
        reply = completion.choices[0].message.content.strip()
        return {"reply": reply, "action": None, "intent": "ai", "source": "groq"}

    except Exception as e:
        # Graceful fallback — inform user and give basic rule-based response
        fallback = _rule_fallback(ctx, message)
        return {"reply": fallback, "action": None, "intent": "fallback", "source": "fallback"}


# ── Rule-based fallback ────────────────────────────────────────────────────────

def _rule_fallback(ctx: dict, message: str) -> str:
    """Minimal fallback when Groq is unavailable."""
    n     = ctx["name"].split()[0]
    focus = ctx["today_focus_minutes"]
    tasks = ctx["pending_tasks"]
    cons  = ctx["consistency_pct"]

    if tasks:
        top = tasks[0]
        return (
            f"{n}, your top priority is '{top[0]}' [{top[1].upper()}] (~{top[2]}m). "
            f"You've done {focus}m of focus today with {cons}% consistency this week. Start it now."
        )
    if focus > 0:
        return f"Great work today, {n} — {focus} minutes of focus logged. Review your completed tasks and plan tomorrow."
    return f"No sessions yet today, {n}. Your consistency is at {cons}% this week. Start a focus session now to keep momentum."
