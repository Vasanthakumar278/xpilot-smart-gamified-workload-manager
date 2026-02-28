"""
routes/arena.py — Focus Arena API
Competitive 1-vs-1 deep-work challenge system with ELO ranking.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from database import get_db
from models import User, Challenge, MatchResult
from routes.deps import get_current_user
from services.elo_engine import compute_focus_score, compute_elo, compute_xp

router = APIRouter(prefix="/challenge", tags=["Focus Arena"])


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ChallengeCreate(BaseModel):
    opponent_id: int
    task_description: str
    duration_minutes: int = 45


class PauseBody(BaseModel):
    role: str  # "challenger" | "opponent"


# ── Helper ────────────────────────────────────────────────────────────────────

def _serialize_challenge(c: Challenge, current_id: int):
    return {
        "id":               c.id,
        "challenger":       {"id": c.challenger_id, "name": c.challenger.name},
        "opponent":         {"id": c.opponent_id, "name": c.opponent.name},
        "task_description": c.task_description,
        "duration_minutes": c.duration_minutes,
        "status":           c.status,
        "start_time":       c.start_time.isoformat() if c.start_time else None,
        "end_time":         c.end_time.isoformat() if c.end_time else None,
        "my_role":          "challenger" if c.challenger_id == current_id else "opponent",
        "challenger_pauses": c.challenger_pauses,
        "opponent_pauses":   c.opponent_pauses,
    }


# ── Endpoints ─────────────────────────────────────────────────────────────────

@router.post("/create", status_code=201)
def create_challenge(
    body: ChallengeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a pending challenge (challenger → opponent)."""
    if body.opponent_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot challenge yourself.")

    opponent = db.query(User).filter(User.id == body.opponent_id, User.role == "worker").first()
    if not opponent:
        raise HTTPException(status_code=404, detail="Opponent worker not found.")

    # Only one active or pending challenge per pair allowed
    existing = db.query(Challenge).filter(
        Challenge.status.in_(["pending", "active"]),
        (
            (Challenge.challenger_id == current_user.id) & (Challenge.opponent_id == body.opponent_id) |
            (Challenge.challenger_id == body.opponent_id) & (Challenge.opponent_id == current_user.id)
        ),
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="An open challenge already exists between you two.")

    challenge = Challenge(
        challenger_id=current_user.id,
        opponent_id=body.opponent_id,
        task_description=body.task_description,
        duration_minutes=body.duration_minutes,
    )
    db.add(challenge)
    db.commit()
    db.refresh(challenge)
    return _serialize_challenge(challenge, current_user.id)


@router.post("/accept/{challenge_id}")
def accept_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept a pending challenge — starts synchronized timer."""
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    if challenge.opponent_id != current_user.id:
        raise HTTPException(status_code=403, detail="You are not the opponent.")
    if challenge.status != "pending":
        raise HTTPException(status_code=400, detail="Challenge is not pending.")

    challenge.status     = "active"
    challenge.start_time = datetime.utcnow()
    db.commit()
    db.refresh(challenge)
    return _serialize_challenge(challenge, current_user.id)


@router.post("/pause/{challenge_id}")
def record_pause(
    challenge_id: int,
    body: PauseBody,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Increment pause/blur counter for anti-cheat tracking."""
    challenge = db.query(Challenge).filter(
        Challenge.id == challenge_id,
        Challenge.status == "active",
    ).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Active challenge not found.")

    if challenge.challenger_id == current_user.id:
        challenge.challenger_pauses += 1
    elif challenge.opponent_id == current_user.id:
        challenge.opponent_pauses += 1
    else:
        raise HTTPException(status_code=403, detail="Not a participant.")

    db.commit()
    return {"ok": True, "challenger_pauses": challenge.challenger_pauses, "opponent_pauses": challenge.opponent_pauses}


@router.post("/complete/{challenge_id}")
def complete_challenge(
    challenge_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    End session, compute focus scores, update ELO + XP.
    Either participant can call this to trigger scoring.
    """
    challenge = db.query(Challenge).filter(Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found.")
    if challenge.status != "active":
        raise HTTPException(status_code=400, detail="Challenge is not active.")
    if current_user.id not in (challenge.challenger_id, challenge.opponent_id):
        raise HTTPException(status_code=403, detail="Not a participant.")

    now = datetime.utcnow()
    challenge.end_time = now
    challenge.status   = "finished"

    # Actual elapsed minutes (capped at duration)
    elapsed = (now - challenge.start_time).total_seconds() / 60
    duration_a = min(elapsed, challenge.duration_minutes)
    duration_b = duration_a  # synchronized timer — same for both

    # Focus scores
    score_a = compute_focus_score(duration_a, True, challenge.challenger_pauses)
    score_b = compute_focus_score(duration_b, True, challenge.opponent_pauses)

    # ELO
    user_a = db.query(User).filter(User.id == challenge.challenger_id).first()
    user_b = db.query(User).filter(User.id == challenge.opponent_id).first()

    new_elo_a, new_elo_b, delta_a, delta_b, actual_a, actual_b = compute_elo(
        user_a.elo_rating, user_b.elo_rating, score_a, score_b
    )
    xp_a, xp_b = compute_xp(actual_a, actual_b)

    # Determine winner
    winner_id = None
    if score_a > score_b:
        winner_id = user_a.id
    elif score_b > score_a:
        winner_id = user_b.id
    # None = draw

    # Persist
    user_a.elo_rating  = new_elo_a
    user_b.elo_rating  = new_elo_b
    user_a.rank_points += max(0, delta_a)
    user_b.rank_points += max(0, delta_b)
    user_a.xp          += xp_a
    user_b.xp          += xp_b

    result = MatchResult(
        challenge_id=challenge.id,
        winner_id=winner_id,
        focus_score_a=score_a,
        focus_score_b=score_b,
        xp_awarded=xp_a + xp_b,
        elo_change_a=delta_a,
        elo_change_b=delta_b,
    )
    db.add(result)
    db.commit()

    return {
        "verdict":       "draw" if winner_id is None else ("win" if winner_id == current_user.id else "loss"),
        "winner_id":     winner_id,
        "focus_score_a": score_a,
        "focus_score_b": score_b,
        "elo_change_a":  delta_a,
        "elo_change_b":  delta_b,
        "new_elo":       new_elo_a if current_user.id == challenge.challenger_id else new_elo_b,
        "xp_awarded":    xp_a if current_user.id == challenge.challenger_id else xp_b,
    }


@router.get("/my")
def my_challenges(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all open challenges for the current user."""
    challenges = db.query(Challenge).filter(
        Challenge.status.in_(["pending", "active"]),
        (Challenge.challenger_id == current_user.id) | (Challenge.opponent_id == current_user.id),
    ).order_by(Challenge.created_at.desc()).all()
    return [_serialize_challenge(c, current_user.id) for c in challenges]


# ── Leaderboard router (separate prefix) ─────────────────────────────────────

leaderboard_router = APIRouter(prefix="/leaderboard", tags=["Focus Arena"])


@leaderboard_router.get("/")
def get_leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns all workers sorted by ELO rating descending."""
    workers = db.query(User).filter(User.role == "worker").order_by(User.elo_rating.desc()).all()

    def _rank_tier(elo: int) -> str:
        if elo >= 1800: return "Grandmaster"
        if elo >= 1600: return "Platinum"
        if elo >= 1400: return "Gold"
        if elo >= 1200: return "Silver"
        return "Bronze"

    board = []
    for i, w in enumerate(workers):
        # Count wins/losses from match results
        wins   = db.query(MatchResult).filter(MatchResult.winner_id == w.id).count()
        total  = db.query(Challenge).filter(
            Challenge.status == "finished",
            (Challenge.challenger_id == w.id) | (Challenge.opponent_id == w.id),
        ).count()
        losses  = total - wins

        board.append({
            "rank":       i + 1,
            "id":         w.id,
            "name":       w.name,
            "elo_rating": w.elo_rating,
            "rank_tier":  _rank_tier(w.elo_rating),
            "wins":       wins,
            "losses":     losses,
            "total":      total,
            "is_me":      w.id == current_user.id,
        })
    return board
