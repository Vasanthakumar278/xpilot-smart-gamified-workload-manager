"""
routes/energy.py — Log energy level + get rule-based schedule
"""
from datetime import date
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import EnergyLog, User
from routes.deps import get_current_user
from services.energy_scheduler import generate_schedule

router = APIRouter(prefix="/energy", tags=["energy"])


class EnergyRequest(BaseModel):
    level: int  # 1–10


@router.post("/")
def log_energy(
    body: EnergyRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Log today's energy level and receive a tailored schedule."""
    if not 1 <= body.level <= 10:
        raise HTTPException(status_code=400, detail="Energy level must be between 1 and 10")

    today = date.today()

    # Upsert: update if already logged today
    existing = (
        db.query(EnergyLog)
        .filter(EnergyLog.user_id == current_user.id, EnergyLog.date == today)
        .first()
    )
    if existing:
        existing.level = body.level
    else:
        log = EnergyLog(user_id=current_user.id, level=body.level, date=today)
        db.add(log)

    db.commit()

    schedule = generate_schedule(body.level)
    return {"logged": True, "schedule": schedule}


@router.get("/today")
def get_today_schedule(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get today's schedule based on logged energy level."""
    today = date.today()
    log = (
        db.query(EnergyLog)
        .filter(EnergyLog.user_id == current_user.id, EnergyLog.date == today)
        .first()
    )

    if not log:
        return {"schedule": None, "message": "No energy logged today. Use POST /energy first."}

    schedule = generate_schedule(log.level)
    return {"schedule": schedule}
