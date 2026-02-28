"""
routes/tracks.py — Focus Track management + Chat History endpoints.

Endpoints:
  GET  /tracks/         — list all tracks for the current user
  POST /tracks/         — create new track or switch to existing one
  GET  /tracks/active   — return the currently active track
  DELETE /tracks/chat/{focus_id} — clear chat_history ONLY, never sessions/XP
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import get_db
from models import User, FocusTrack, ChatHistory
from routes.deps import get_current_user

router = APIRouter(prefix="/tracks", tags=["tracks"])


class TrackRequest(BaseModel):
    topic: str = Field(..., min_length=2, max_length=120)


# ── List all tracks ───────────────────────────────────────────────────────────

@router.get("/")
def list_tracks(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    tracks = (
        db.query(FocusTrack)
        .filter(FocusTrack.user_id == current_user.id)
        .order_by(FocusTrack.last_used.desc())
        .all()
    )
    return [_track_to_dict(t) for t in tracks]


# ── Active track ──────────────────────────────────────────────────────────────

@router.get("/active")
def get_active_track(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    track = _get_active(db, current_user.id)
    if track is None:
        return None
    return _track_to_dict(track)


# ── Create or switch track ────────────────────────────────────────────────────

@router.post("/")
def switch_or_create_track(
    body: TrackRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    If a track with this topic already exists → activate it (pause others).
    If not → create a new track and activate it.
    Returns the now-active track.
    """
    topic = body.topic.strip()

    # Pause all existing tracks for this user
    db.query(FocusTrack).filter(
        FocusTrack.user_id == current_user.id,
        FocusTrack.status == "active",
    ).update({"status": "paused"}, synchronize_session=False)

    # Find existing track (case-insensitive match)
    existing = (
        db.query(FocusTrack)
        .filter(FocusTrack.user_id == current_user.id)
        .all()
    )
    match = next((t for t in existing if t.topic.lower() == topic.lower()), None)

    if match:
        match.status    = "active"
        match.last_used = datetime.utcnow()
        db.commit()
        db.refresh(match)
        return {**_track_to_dict(match), "action": "switched"}

    new_track = FocusTrack(
        user_id   = current_user.id,
        topic     = topic,
        status    = "active",
        last_used = datetime.utcnow(),
    )
    db.add(new_track)
    db.commit()
    db.refresh(new_track)
    return {**_track_to_dict(new_track), "action": "created"}


# ── Clear chat history (safe — no session/XP data deleted) ───────────────────

@router.delete("/chat/{focus_id}")
def clear_chat(
    focus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Deletes ChatHistory rows for this focus_id only.
    Sessions, reflections, XP, and streaks are completely untouched.
    """
    track = db.query(FocusTrack).filter(
        FocusTrack.id == focus_id,
        FocusTrack.user_id == current_user.id,
    ).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    deleted = (
        db.query(ChatHistory)
        .filter(ChatHistory.focus_id == focus_id)
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"deleted_messages": deleted}


# ── Chat history loader ───────────────────────────────────────────────────────

@router.get("/chat/{focus_id}")
def get_chat_history(
    focus_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    track = db.query(FocusTrack).filter(
        FocusTrack.id == focus_id,
        FocusTrack.user_id == current_user.id,
    ).first()
    if not track:
        raise HTTPException(status_code=404, detail="Track not found")

    rows = (
        db.query(ChatHistory)
        .filter(ChatHistory.focus_id == focus_id)
        .order_by(ChatHistory.timestamp.asc())
        .all()
    )
    return [{"role": r.role, "message": r.message, "timestamp": r.timestamp.isoformat()} for r in rows]


# ── Helpers ───────────────────────────────────────────────────────────────────

def _get_active(db: Session, user_id: int) -> FocusTrack | None:
    return db.query(FocusTrack).filter(
        FocusTrack.user_id == user_id,
        FocusTrack.status == "active",
    ).first()


def _track_to_dict(t: FocusTrack) -> dict:
    return {
        "id":        t.id,
        "topic":     t.topic,
        "status":    t.status,
        "last_used": t.last_used.isoformat(),
    }
