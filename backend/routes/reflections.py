"""
routes/reflections.py — Submit reflection for a session
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import Reflection, Session as SessionModel, User
from routes.deps import get_current_user

router = APIRouter(prefix="/reflections", tags=["reflections"])


class ReflectionRequest(BaseModel):
    session_id: int
    text: str


@router.post("/", status_code=201)
def add_reflection(
    body: ReflectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Submit a reflection for a completed session."""
    session = db.query(SessionModel).filter(SessionModel.id == body.session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    if not session.end_time:
        raise HTTPException(status_code=400, detail="Session must be ended before reflecting")

    # Prevent duplicate reflection
    existing = db.query(Reflection).filter(Reflection.session_id == body.session_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Reflection already submitted for this session")

    if len(body.text.strip()) < 5:
        raise HTTPException(status_code=400, detail="Reflection must be at least 5 characters")

    reflection = Reflection(session_id=body.session_id, text=body.text.strip())
    db.add(reflection)
    db.commit()
    db.refresh(reflection)

    return {
        "reflection_id": reflection.id,
        "session_id": reflection.session_id,
        "message": "Reflection saved! Ready to earn XP 🌟",
    }
