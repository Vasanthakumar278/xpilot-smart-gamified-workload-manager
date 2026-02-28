"""
services/chat_engine.py — Rule-based chat response engine.

Reads the user's live DB state to produce contextual, XPilot-specific
replies. No generic AI, no placeholders — every response references
real session data, energy, or consistency metrics.

Extensibility: replace _build_student_reply / _build_worker_reply
with an LLM call at any time — the route contract doesn't change.
"""
from datetime import datetime, timedelta, date
from sqlalchemy.orm import Session as DBSession
from models import User, Session as SessionModel, EnergyLog, XPLog


# ── Intent resolution ─────────────────────────────────────────────────────────
# Maps keywords in the user's message to intent labels.

STUDENT_INTENTS = {
    "start":        ["start", "begin", "go", "session", "practice"],
    "progress":     ["progress", "xp", "points", "how am i", "stats", "score"],
    "consistency":  ["streak", "habit", "consistent", "days", "frequency"],
    "review":       ["review", "recall", "retention", "remember", "what did"],
    "motivation":   ["tired", "unmotivated", "bored", "why", "worth", "hard"],
    "advice":       ["advice", "suggest", "recommend", "what should", "help", "next"],
}

WORKER_INTENTS = {
    "energy":       ["energy", "tired", "level", "how do i feel", "capacity"],
    "schedule":     ["schedule", "plan", "today", "generate", "workload"],
    "deep_work":    ["deep work", "focus", "important", "priority", "main task"],
    "break":        ["break", "rest", "recover", "pause", "burnout", "too much"],
    "advice":       ["advice", "suggest", "recommend", "what should", "help", "next"],
    "performance":  ["performance", "output", "productivity", "stats", "how am i"],
}


def resolve_intent(message: str, intent_map: dict) -> str:
    msg = message.lower()
    scores = {intent: 0 for intent in intent_map}
    for intent, keywords in intent_map.items():
        for kw in keywords:
            if kw in msg:
                scores[intent] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "advice"


# ── Main entry ────────────────────────────────────────────────────────────────

def get_chat_response(db: DBSession, user: User, message: str) -> dict:
    """
    Reads live user state, resolves intent from message, builds reply.
    Returns { reply: str, action: str | None }
    """
    ctx = _load_context(db, user)

    if user.role == "worker":
        intent = resolve_intent(message, WORKER_INTENTS)
        reply, action = _build_worker_reply(intent, ctx)
    else:
        intent = resolve_intent(message, STUDENT_INTENTS)
        reply, action = _build_student_reply(intent, ctx)

    return {"reply": reply, "action": action, "intent": intent}


# ── Context loader ────────────────────────────────────────────────────────────

def _load_context(db: DBSession, user: User) -> dict:
    now = datetime.utcnow()
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    completed = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == user.id, SessionModel.end_time.isnot(None))
        .all()
    )
    today_sessions = [s for s in completed if s.start_time >= today_start]
    last_session = max(completed, key=lambda s: s.end_time, default=None) if completed else None

    session_dates = {s.start_time.date() for s in completed}
    last_7 = {(now - timedelta(days=i)).date() for i in range(7)}
    active_days = len(session_dates & last_7)
    consistency_pct = round(active_days / 7 * 100)

    xp_today = (
        db.query(XPLog)
        .filter(XPLog.user_id == user.id, XPLog.created_at >= today_start)
        .all()
    )

    energy_log = (
        db.query(EnergyLog)
        .filter(EnergyLog.user_id == user.id, EnergyLog.date == date.today())
        .first()
    )

    total_focus_today = sum(s.duration_minutes or 0 for s in today_sessions)
    minutes_since_last = (
        (now - last_session.end_time).total_seconds() / 60
        if last_session else None
    )

    return {
        "name": user.name.split()[0],
        "xp": user.xp,
        "xp_today": sum(x.xp_awarded for x in xp_today),
        "sessions_today": len(today_sessions),
        "total_focus_today": round(total_focus_today),
        "active_days": active_days,
        "consistency_pct": consistency_pct,
        "minutes_since_last": round(minutes_since_last) if minutes_since_last else None,
        "energy_level": energy_log.level if energy_log else None,
        "total_xp": user.xp,
        "total_sessions": len(completed),
    }


# ── Student replies ───────────────────────────────────────────────────────────

def _build_student_reply(intent: str, ctx: dict) -> tuple[str, str | None]:
    n = ctx["name"]
    s_today = ctx["sessions_today"]
    cons = ctx["consistency_pct"]
    xp = ctx["xp_today"]
    mins = ctx["minutes_since_last"]
    active = ctx["active_days"]
    total_xp = ctx["total_xp"]
    focus = ctx["total_focus_today"]

    if intent == "start":
        if s_today == 0:
            return (
                f"No practice yet today, {n}. Even a focused 25-minute session activates recall pathways. Start now and earn XP.",
                "start_session",
            )
        if mins and mins < 20:
            return (
                f"You just finished a session {mins} minutes ago. Give yourself a quick 10-minute break, then do a retrieval review — write down what you remember without looking at your notes.",
                "short_review",
            )
        return (
            f"You've done {s_today} session{'s' if s_today > 1 else ''} today ({focus}m of practice). Ready for another? Each additional session compounds retention.",
            "start_session",
        )

    if intent == "progress":
        return (
            f"Today: {s_today} sessions, {focus} minutes focused, +{xp} XP earned. Total XP: {total_xp}. You've been active {active}/7 days this week — consistency score: {cons}%.",
            None,
        )

    if intent == "consistency":
        if cons >= 70:
            return (
                f"Your consistency is excellent — {active} active days this week ({cons}%). You're forming a real habit. Keep showing up daily to lock it in.",
                None,
            )
        if cons >= 40:
            return (
                f"You've practiced {active} out of 7 days this week ({cons}%). You're on the right track — add 2 more sessions this week to cross the habit threshold.",
                "start_session",
            )
        return (
            f"Consistency is at {cons}% this week — only {active} active day(s). Habit formation requires daily exposure. Even a 15-minute review today will rebuild momentum.",
            "maintain_streak",
        )

    if intent == "review":
        if s_today > 0:
            return (
                f"After {s_today} practice session(s) today, spaced review is your best next move. Write down what you remember — retrieval practice is 2× more effective than re-reading.",
                "short_review",
            )
        return (
            f"To retain what you've been studying, schedule a review session now. Spaced repetition works best when practice is consistent. {cons}% consistency this week.",
            "start_session",
        )

    if intent == "motivation":
        return (
            f"Progress is real even when it doesn't feel like it. You've earned {total_xp} total XP across {ctx['total_sessions']} sessions. Consistency at {cons}% this week. Small sessions every day beat massive sessions once a week.",
            "start_session",
        )

    # Default: advice
    if s_today == 0:
        return (
            f"No sessions yet today, {n}. My recommendation: start a 25-minute focused practice now. After, write a short review to earn XP and reinforce retention.",
            "start_session",
        )
    return (
        f"You've been active today ({s_today} session(s), {focus}m). Next: review what you covered to drive retention, then rest. You're building the habit.",
        "short_review",
    )


# ── Worker replies ────────────────────────────────────────────────────────────

def _build_worker_reply(intent: str, ctx: dict) -> tuple[str, str | None]:
    n = ctx["name"]
    level = ctx["energy_level"]
    focus = ctx["total_focus_today"]
    s_today = ctx["sessions_today"]
    active = ctx["active_days"]
    total_xp = ctx["total_xp"]

    if intent == "energy":
        if level is None:
            return (
                f"You haven't logged your energy today, {n}. Your workload plan depends on it. Log your current energy level (1–10) to get a calibrated execution schedule.",
                "log_energy",
            )
        tier = "low" if level <= 3 else "medium" if level <= 6 else "high"
        tier_msg = {
            "low": f"Energy at {level}/10 — reduced capacity. Route to admin and low-stakes tasks. Defer all decisions and deep work.",
            "medium": f"Energy at {level}/10 — solid capacity. You're set for structured 45-minute focus blocks. Use the generated schedule.",
            "high": f"Energy at {level}/10 — peak capacity. This is your window for deep work. Block interruptions and execute your highest-leverage task now.",
        }
        return (tier_msg[tier], "generate_plan")

    if intent == "schedule":
        if level is None:
            return (
                f"To generate an optimised schedule, I need your energy level first. Log it (1–10) and I'll build a workload plan matched to your current capacity.",
                "log_energy",
            )
        return (
            f"Based on energy level {level}/10, your schedule should prioritise {'admin and recovery' if level <= 3 else '45-min focus blocks' if level <= 6 else '90-min deep work blocks'}. Open your schedule to execute.",
            "generate_plan",
        )

    if intent == "deep_work":
        if level and level >= 7:
            return (
                f"Energy at {level}/10 — optimal for deep work. Start a 90-minute block now. Silence all notifications and work on your single most important task.",
                "generate_plan",
            )
        if level:
            return (
                f"Energy at {level}/10 isn't ideal for deep work — forcing it at this capacity increases error rate. Focus blocks of 40–50 minutes are better matched to your current state.",
                "generate_plan",
            )
        return ("Log your energy level first so I can validate whether deep work is appropriate right now.", "log_energy")

    if intent == "break":
        if focus >= 90:
            return (
                f"You've logged {focus} minutes of focus today. This is your mandatory break signal — step away for at least 20 minutes before the next block. Sustained output without recovery degrades judgment.",
                None,
            )
        return (
            f"You've done {focus} minutes of focused work today. A short 10-minute physical break now will sustain your output quality for the next block.",
            None,
        )

    if intent == "performance":
        return (
            f"Today: {s_today} work session(s), {focus} minutes of focused output. Active {active}/7 days this week. Total XP logged: {total_xp}. {'Strong execution.' if s_today >= 2 else 'Room to add more focused blocks.'}",
            None,
        )

    # Default: advice
    if level is None:
        return (
            f"First step: log your energy level. Everything — your schedule, focus block duration, and recovery plan — is calibrated to your current capacity.",
            "log_energy",
        )
    tier = "low" if level <= 3 else "medium" if level <= 6 else "high"
    advice = {
        "low": f"With energy at {level}/10, protect your output by staying on admin and reviews. Avoid high-stakes decisions.",
        "medium": f"Energy at {level}/10. Recommended: two 45-minute focus blocks with a 10-minute break between. Execute your priority task in the first block.",
        "high": f"Energy at {level}/10 — rare peak window. Start a 90-minute deep work session immediately on your highest-leverage problem.",
    }
    return (advice[tier], "generate_plan")
