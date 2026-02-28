"""
routes/analytics.py — Rule-based analytics for the current user
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models import User
from routes.deps import get_current_user
from services.analytics_service import get_analytics

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/me")
def get_my_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all analytics metrics for the current user."""
    return get_analytics(db=db, user_id=current_user.id)
