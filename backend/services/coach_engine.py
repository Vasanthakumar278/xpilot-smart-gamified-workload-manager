"""
services/coach_engine.py — Context-aware XPilot Coach Engine.

Intent detection (2-stage):
  Stage 1 — Ollama Mistral: parses any free-text message → { intent, focus_topic }
              Works for ANY subject — engineering, coding, theory, projects, etc.
  Stage 2 — Keyword fallback: activates silently when Ollama is offline.

Returns: { reply: str, suggested_focus: str | None, intent: str }
"""
import re
import json
import httpx
from datetime import datetime, timedelta
from sqlalchemy.orm import Session as DBSession
from models import User, Session as SessionModel, Reflection, XPLog

OLLAMA_URL   = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral"

# Strict JSON-only prompt — Mistral must NOT add prose
_INTENT_PROMPT = """\
You are an intent parser.

Your job is NOT to answer the user.
Your job is to detect what they want to work on.

If the message contains any domain, subject, skill,
project, or preparation area,
extract it as focus_topic.

This applies to ALL fields:
engineering, coding, theory, projects, revision, etc.

Examples:
"study cn" → Computer Networks
"what is machine learning" → Machine Learning
"prepare for interview" → Interview Preparation
"do leetcode" → Coding Practice
"work on project" → Project Work
"revise signals" → Signals and Systems
"what should I do now" → no subject, general_query

Return STRICT JSON only:

{{"intent": "declare_focus", "focus_topic": "detected subject"}}

or if no subject found:

{{"intent": "general_query", "focus_topic": null}}

Do NOT explain. Do NOT add any text outside the JSON.

User message: {message}"""


# ── Stage 1: Ollama intent extractor ─────────────────────────────────────────

def _extract_intent_ollama(message: str) -> dict | None:
    """
    Calls Ollama Mistral to get { intent, focus_topic } for ANY message.
    Returns None if Ollama is offline or response is malformed (falls to Stage 2).
    """
    try:
        resp = httpx.post(
            OLLAMA_URL,
            json={"model": OLLAMA_MODEL, "prompt": _INTENT_PROMPT.format(message=message), "stream": False},
            timeout=10,
        )
        resp.raise_for_status()
        raw = resp.json().get("response", "").strip()

        # Robustly extract the first JSON object from the response
        match = re.search(r'\{.*?\}', raw, re.DOTALL)
        if not match:
            return None

        parsed      = json.loads(match.group())
        intent      = (parsed.get("intent") or "").strip()
        focus_topic = parsed.get("focus_topic")
        if isinstance(focus_topic, str):
            focus_topic = focus_topic.strip() or None

        return {"intent": intent, "focus_topic": focus_topic} if intent else None
    except Exception:
        return None  # Ollama offline — fall through to Stage 2


# ── Stage 2: Keyword fallback (offline safety net) ───────────────────────────

COACH_INTENTS = {
    "yesterday":   ["yesterday", "last time", "before", "previous", "left off", "where did i stop", "where did i leave"],
    "next":        ["next", "continue", "resume", "pick up", "carry on", "what now"],
    "recommend":   ["recommend", "suggest", "plan", "workflow", "today", "what should i do", "what to do"],
    "revise":      ["revise", "review", "recall", "reinforce", "remember", "retention", "spaced"],
    "progress":    ["progress", "xp", "stats", "score", "how am i", "how have i", "performance"],
    "stop":        ["stop", "where did i stop", "where did", "paused", "left"],
}


def _resolve_intent(message: str) -> str:
    msg = message.lower()
    for intent, keywords in COACH_INTENTS.items():
        for kw in keywords:
            if kw in msg:
                return intent
    return "recommend"  # smart default


# ── Context loader ────────────────────────────────────────────────────────────

def _load_context(db: DBSession, user: User) -> dict:
    now = datetime.utcnow()
    today_start     = now.replace(hour=0, minute=0, second=0, microsecond=0)
    yesterday_start = today_start - timedelta(days=1)

    all_sessions = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == user.id, SessionModel.end_time.isnot(None))
        .order_by(SessionModel.end_time.desc())
        .all()
    )

    last              = all_sessions[0] if all_sessions else None
    yesterday_sessions = [s for s in all_sessions if yesterday_start <= s.start_time < today_start]
    today_sessions     = [s for s in all_sessions if s.start_time >= today_start]

    last_focus = None
    if last and last.reflection:
        text = (last.reflection.text or "").strip()
        last_focus = text.split(".")[0][:60] if text else None

    session_dates   = {s.start_time.date() for s in all_sessions}
    last_7          = {(now - timedelta(days=i)).date() for i in range(7)}
    active_days     = len(session_dates & last_7)
    consistency_pct = round(active_days / 7 * 100)

    xp_today = sum(
        x.xp_awarded
        for x in db.query(XPLog)
        .filter(XPLog.user_id == user.id, XPLog.created_at >= today_start)
        .all()
    )

    gap_hours = round((now - last.end_time).total_seconds() / 3600, 1) if last else None

    return {
        "name":               user.name.split()[0],
        "role":               user.role,
        "xp":                 user.xp,
        "xp_today":           xp_today,
        "total_sessions":     len(all_sessions),
        "sessions_today":     len(today_sessions),
        "sessions_yesterday": len(yesterday_sessions),
        "yesterday_focus":    _session_focus(yesterday_sessions[0] if yesterday_sessions else None),
        "yesterday_duration": yesterday_sessions[0].duration_minutes if yesterday_sessions else None,
        "last_session":       last,
        "last_focus":         last_focus,
        "last_duration":      last.duration_minutes if last else None,
        "gap_hours":          gap_hours,
        "active_days":        active_days,
        "consistency_pct":    consistency_pct,
        "total_focus_today":  round(sum(s.duration_minutes or 0 for s in today_sessions)),
    }


def _session_focus(session) -> str | None:
    if session is None:
        return None
    if session.reflection:
        text = (session.reflection.text or "").strip()
        return text.split(".")[0][:60] if text else None
    return None


# ── Reply builders ────────────────────────────────────────────────────────────

def _declare_focus_reply(ctx: dict, focus_topic: str) -> tuple[str, str | None]:
    """User explicitly declared a subject — acknowledge and structure a plan."""
    cons  = ctx["consistency_pct"]
    today = ctx["sessions_today"]

    if today >= 2:
        return (
            f"You've already done {today} session(s) today — great momentum. "
            f"Adding a focused block on '{focus_topic}' will compound it. "
            "Recommended: 25-min session → 5-min reflection to lock it in.",
            focus_topic,
        )
    return (
        f"Starting work on '{focus_topic}'. "
        "Recommended flow: 10-min warm-up → 25-min focused practice → 5-min retrieval test. "
        f"Consistency this week: {cons}% — showing up daily is the key lever.",
        focus_topic,
    )


def _yesterday_reply(ctx: dict) -> tuple[str, str | None]:
    n     = ctx["name"]
    focus = ctx["yesterday_focus"]
    dur   = ctx["yesterday_duration"]
    count = ctx["sessions_yesterday"]

    if count == 0:
        return (
            f"You didn't log any sessions yesterday, {n}. "
            f"Your last recorded activity was {int(ctx['gap_hours'] or 0)}h ago. "
            "Start fresh today with a 25-minute focused block.",
            None,
        )

    dur_str = f"{int(dur)} min" if dur else "a session"
    if focus:
        return (
            f"Yesterday you completed {count} session(s) — {dur_str} on '{focus}'. "
            "Today's best move is a retrieval practice: recall key points before re-reading your notes.",
            focus,
        )
    return (
        f"Yesterday you did {count} session(s) ({dur_str}). "
        "Log your focus topic via a reflection to unlock smarter coaching next time.",
        None,
    )


def _next_reply(ctx: dict) -> tuple[str, str | None]:
    n     = ctx["name"]
    focus = ctx["last_focus"]
    gap   = ctx["gap_hours"]
    dur   = ctx["last_duration"]

    if focus is None:
        return (
            f"No reflection logged for your last session, {n}. "
            "Add a quick reflection after each session — it lets me recommend exactly what to do next.",
            None,
        )

    rec_dur = min(int(dur), 40) if dur else 25
    if gap and gap < 2:
        verb, reason = "Continue", "Your memory is still warm — this is the optimal window."
    elif gap and gap < 24:
        verb, reason = "Resume", "24 hours is the prime spaced-repetition window for reinforcement."
    else:
        verb, reason = "Reactivate", f"It's been {int(gap or 0)}h — a reactivation session will rebuild recall."

    return (f"{verb} '{focus}' for {rec_dur} minutes. {reason}", focus)


def _recommend_reply(ctx: dict) -> tuple[str, str | None]:
    n     = ctx["name"]
    focus = ctx["last_focus"]
    cons  = ctx["consistency_pct"]
    today = ctx["sessions_today"]

    if today >= 3:
        return (
            f"Strong day, {n} — {today} sessions done. Next step: "
            "a 10-minute synthesis review. Write 3 key things you learned today. Then rest.",
            focus,
        )
    if focus:
        return (
            f"Recommended workflow: ① 10-min warm-up review of '{focus}' → "
            f"② 25-min focused practice → ③ 5-min reflection. "
            f"Consistency at {cons}% — showing up today compounds it.",
            focus,
        )
    return (
        f"Consistency at {cons}% this week. Start a 25-min session now, then log a reflection. "
        "Reflections unlock personalised coaching based on your actual progress.",
        None,
    )


def _revise_reply(ctx: dict) -> tuple[str, str | None]:
    focus  = ctx["last_focus"]
    gap    = ctx["gap_hours"]
    active = ctx["active_days"]

    if focus is None:
        return (
            "To give you a revision recommendation I need to know what you've been studying. "
            "Log a reflection after your next session and I'll build a spaced-repetition plan.",
            None,
        )
    if gap and gap <= 24:
        return (
            f"Perfect timing for spaced repetition on '{focus}'. "
            "Close your notes and write down everything you remember first — retrieval beats re-reading by 2×.",
            focus,
        )
    if gap and gap <= 72:
        return (
            f"It's been {int(gap)}h since you covered '{focus}'. "
            "This is the 3-day repetition interval — a focused 20-min review now will lock it in.",
            focus,
        )
    return (
        f"It's been a while since '{focus}'. Start with a 15-min reactivation: "
        f"skim your notes, then do a retrieval test. Active {active}/7 days this week.",
        focus,
    )


def _stop_reply(ctx: dict) -> tuple[str, str | None]:
    focus = ctx["last_focus"]
    gap   = ctx["gap_hours"]
    dur   = ctx["last_duration"]

    if focus is None:
        return (
            "I can see your session history but no focus topic was recorded. "
            "Add a short reflection — even one sentence — and I'll know exactly where you stopped.",
            None,
        )

    dur_str = f"for {int(dur)} min" if dur else ""
    gap_str = f"{int(gap)}h ago" if gap and gap < 48 else f"{int((gap or 0)/24)} day(s) ago"
    return (
        f"You last worked on '{focus}' {dur_str}, {gap_str}. "
        "That's your resume point. Continue from there to maintain continuity.",
        focus,
    )


def _progress_reply(ctx: dict) -> tuple[str, str | None]:
    n      = ctx["name"]
    today  = ctx["sessions_today"]
    focus  = ctx["total_focus_today"]
    cons   = ctx["consistency_pct"]
    active = ctx["active_days"]
    xp     = ctx["xp"]
    xp_td  = ctx["xp_today"]
    total  = ctx["total_sessions"]

    return (
        f"XPilot snapshot, {n}: "
        f"Today — {today} session(s), {focus} min focused, +{xp_td} XP. "
        f"This week — {active}/7 active days ({cons}% consistency). "
        f"All time — {total} sessions, {xp} total XP. "
        f"{'Great momentum.' if cons >= 50 else 'Consistency is your next lever — show up daily.'}",
        None,
    )


def _default_reply(ctx: dict) -> tuple[str, str | None]:
    focus = ctx["last_focus"]
    cons  = ctx["consistency_pct"]
    today = ctx["sessions_today"]
    n     = ctx["name"]

    if today == 0:
        return (
            f"No sessions yet today, {n}. "
            + (f"Start by resuming '{focus}' — 25 minutes of focused practice." if focus
               else "Start a 25-minute focused session to keep your streak alive."),
            focus,
        )
    return (
        f"You've done {today} session(s) today with {cons}% consistency this week. "
        + (f"Next best move: reinforce '{focus}' with a retrieval review." if focus
           else "Next move: log a reflection so I can coach you more specifically."),
        focus,
    )


# ── Main entry ────────────────────────────────────────────────────────────────

def generate_response(db: DBSession, user: User, message: str, active_track=None) -> dict:
    """
    2-stage intent resolution:
      Stage 1 — Ollama Mistral: topic-agnostic { intent, focus_topic }
      Stage 2 — Keyword fallback when Ollama is offline

    active_track: FocusTrack | None — when set, its .topic is the preferred focus
    Returns { reply, suggested_focus, intent }
    """
    ctx = _load_context(db, user)

    # If a track is already active, use its topic as the context focus
    track_topic = active_track.topic if active_track else None

    # ── Stage 1: Ollama ───────────────────────────────────────────────────────
    ollama_result = _extract_intent_ollama(message)

    if ollama_result:
        intent      = ollama_result["intent"]
        focus_topic = ollama_result["focus_topic"] or track_topic

        if intent == "declare_focus" and focus_topic:
            reply, suggested_focus = _declare_focus_reply(ctx, focus_topic)
            return {"reply": reply, "suggested_focus": suggested_focus, "intent": intent}

        handlers = {
            "yesterday":     _yesterday_reply,
            "next":          _next_reply,
            "recommend":     _recommend_reply,
            "revise":        _revise_reply,
            "stop":          _stop_reply,
            "progress":      _progress_reply,
            "general_query": _default_reply,
        }
        handler = handlers.get(intent, _default_reply)
        reply, suggested_focus = handler(ctx)
        if focus_topic:
            suggested_focus = focus_topic
        return {"reply": reply, "suggested_focus": suggested_focus, "intent": intent}

    # ── Stage 2: Keyword fallback (Ollama offline) ────────────────────────────
    intent = _resolve_intent(message)
    handlers = {
        "yesterday": _yesterday_reply,
        "next":      _next_reply,
        "recommend": _recommend_reply,
        "revise":    _revise_reply,
        "stop":      _stop_reply,
        "progress":  _progress_reply,
    }
    handler = handlers.get(intent, _default_reply)
    reply, suggested_focus = handler(ctx)
    # Prefer active track topic over stored last_focus
    if track_topic and not suggested_focus:
        suggested_focus = track_topic
    return {"reply": reply, "suggested_focus": suggested_focus, "intent": intent}

