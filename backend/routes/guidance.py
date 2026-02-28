"""
routes/guidance.py — Guidance Engine API
GET /guidance/me → returns a deterministic recommendation for the current user.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from routes.deps import get_current_user
from services.guidance_engine import get_recommendation

router = APIRouter(prefix="/guidance", tags=["guidance"])


@router.get("/me")
def get_my_guidance(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the current user's deterministic next-action recommendation.
    Reads role, sessions, energy, and consistency from the database.
    """
    return get_recommendation(db=db, user=current_user)
