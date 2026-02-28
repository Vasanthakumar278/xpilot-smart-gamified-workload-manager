"""
services/energy_scheduler.py — Rule-based schedule generator
Maps energy level (1–10) to a structured daily schedule.
"""
from datetime import datetime, timedelta


SCHEDULE_TEMPLATES = {
    "low": {
        "label": "Low Energy",
        "description": "Light cognitive load. Rest and review only.",
        "color": "#10b981",  # green
        "blocks": [
            {"title": "Morning Warm-Up", "duration": 20, "type": "review", "note": "Review notes or read lightly"},
            {"title": "Break", "duration": 15, "type": "rest", "note": "Walk, stretch, water"},
            {"title": "Light Review", "duration": 25, "type": "review", "note": "Summarize yesterday's work"},
            {"title": "Rest", "duration": 30, "type": "rest", "note": "Nap or meditate"},
            {"title": "Admin Tasks", "duration": 30, "type": "admin", "note": "Emails, scheduling, planning"},
            {"title": "Wind Down", "duration": 15, "type": "rest", "note": "Reflect on the day"},
        ],
    },
    "medium": {
        "label": "Medium Energy",
        "description": "Balanced focus. Mix of tasks with regular breaks.",
        "color": "#f59e0b",  # amber
        "blocks": [
            {"title": "Focus Block 1", "duration": 50, "type": "focus", "note": "Work on primary task"},
            {"title": "Break", "duration": 10, "type": "rest", "note": "Step away from screen"},
            {"title": "Focus Block 2", "duration": 50, "type": "focus", "note": "Continue or switch task"},
            {"title": "Lunch / Long Break", "duration": 30, "type": "rest", "note": "Eat and recharge"},
            {"title": "Collaborative / Communication", "duration": 45, "type": "collab", "note": "Meetings, messages, reviews"},
            {"title": "Focus Block 3", "duration": 40, "type": "focus", "note": "Wrap up tasks"},
            {"title": "Daily Review", "duration": 15, "type": "review", "note": "Log progress, plan tomorrow"},
        ],
    },
    "high": {
        "label": "High Energy",
        "description": "Deep work mode. Long focus blocks with strategic breaks.",
        "color": "#6366f1",  # indigo
        "blocks": [
            {"title": "Deep Work Block 1", "duration": 90, "type": "deep", "note": "Most important task — no interruptions"},
            {"title": "Break", "duration": 15, "type": "rest", "note": "Short physical reset"},
            {"title": "Deep Work Block 2", "duration": 90, "type": "deep", "note": "Secondary complex task"},
            {"title": "Lunch / Recharge", "duration": 45, "type": "rest", "note": "Full mental reset"},
            {"title": "Creative / Problem Solving", "duration": 60, "type": "creative", "note": "Brainstorm, design, architect"},
            {"title": "Review & Wrap", "duration": 30, "type": "review", "note": "Document decisions, push code"},
        ],
    },
}

BLOCK_TYPE_COLORS = {
    "focus": "#6366f1",
    "deep": "#4f46e5",
    "rest": "#10b981",
    "review": "#f59e0b",
    "admin": "#64748b",
    "collab": "#0ea5e9",
    "creative": "#ec4899",
}


def get_energy_tier(level: int) -> str:
    if level <= 3:
        return "low"
    elif level <= 6:
        return "medium"
    else:
        return "high"


def generate_schedule(energy_level: int) -> dict:
    """
    Given energy level 1–10, return a structured daily schedule.
    Start time defaults to current hour, rounded up.
    """
    tier = get_energy_tier(energy_level)
    template = SCHEDULE_TEMPLATES[tier]

    # Build timed blocks starting from next full hour
    now = datetime.now()
    start = now.replace(minute=0, second=0, microsecond=0) + timedelta(hours=1)

    timed_blocks = []
    current = start

    for block in template["blocks"]:
        end = current + timedelta(minutes=block["duration"])
        timed_blocks.append(
            {
                **block,
                "start": current.strftime("%H:%M"),
                "end": end.strftime("%H:%M"),
                "color": BLOCK_TYPE_COLORS.get(block["type"], "#6366f1"),
            }
        )
        current = end

    return {
        "energy_level": energy_level,
        "tier": tier,
        "label": template["label"],
        "description": template["description"],
        "accent_color": template["color"],
        "blocks": timed_blocks,
        "total_focus_minutes": sum(
            b["duration"]
            for b in template["blocks"]
            if b["type"] in ("focus", "deep", "creative")
        ),
    }
