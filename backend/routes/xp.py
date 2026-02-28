"""
routes/xp.py — Award XP + view XP log
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User, XPLog
from routes.deps import get_current_user
from services.xp_engine import award_xp

router = APIRouter(prefix="/xp", tags=["xp"])


class AwardXPRequest(BaseModel):
    session_id: int


@router.post("/award")
def award_xp_endpoint(
    body: AwardXPRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Calculate and award XP for a completed session (with reflection check)."""
    result = award_xp(db=db, user_id=current_user.id, session_id=body.session_id)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return result


@router.get("/log")
def get_xp_log(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the user's full XP history."""
    logs = (
        db.query(XPLog)
        .filter(XPLog.user_id == current_user.id)
        .order_by(XPLog.created_at.desc())
        .limit(50)
        .all()
    )

    return {
        "total_xp": current_user.xp,
        "history": [
            {
                "id": log.id,
                "xp_awarded": log.xp_awarded,
                "reason": log.reason,
                "created_at": log.created_at.isoformat(),
            }
            for log in logs
        ],
    }
