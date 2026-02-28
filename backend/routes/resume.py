"""
routes/resume.py — GET /resume/{user_id}
Returns an automatic session-continuation recommendation based on last activity.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from routes.deps import get_current_user
from services.resume_engine import generate_resume

router = APIRouter(prefix="/resume", tags=["resume"])


@router.get("/{user_id}")
def get_resume(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns a resume recommendation for the authenticated user.
    The user_id path parameter is accepted for consistency with the frontend
    spec but the result is always scoped to the authenticated user.
    Returns 204 No Content when there is nothing to resume.
    """
    recommendation = generate_resume(db=db, user=current_user)
    if recommendation is None:
        raise HTTPException(status_code=204, detail="No session history to resume.")
    return recommendation
