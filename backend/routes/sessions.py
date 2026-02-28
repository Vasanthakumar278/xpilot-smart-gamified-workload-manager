"""
routes/sessions.py — Session start / end / list
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Session as SessionModel, User
from routes.deps import get_current_user

router = APIRouter(prefix="/sessions", tags=["sessions"])


from typing import Optional
from pydantic import BaseModel

class SessionStartInput(BaseModel):
    task_id: Optional[int] = None
    energy_level: Optional[int] = 5

@router.post("/start", status_code=201)
def start_session(
    data: SessionStartInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Start a new work session. Records start_time."""
    session = SessionModel(
        user_id=current_user.id,
        task_id=data.task_id,
        energy_level=data.energy_level,
        status="active"
    )
    db.add(session)

    # Work continuity: track which task is being worked on
    if data.task_id:
        current_user.last_active_task_id = data.task_id

    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "start_time": session.start_time.isoformat(),
        "message": "Session started. Focus up! 🎯",
    }


@router.post("/{session_id}/end")
def end_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """End a session, compute duration in minutes."""
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your session")
    if session.end_time:
        raise HTTPException(status_code=400, detail="Session already ended")

    session.end_time = datetime.utcnow()
    delta = session.end_time - session.start_time
    session.duration_minutes = round(delta.total_seconds() / 60, 2)
    session.status = "completed"

    # Clear work continuity when session ends
    if current_user.last_active_task_id == session.task_id:
        current_user.last_active_task_id = None

    db.commit()
    db.refresh(session)

    return {
        "session_id": session.id,
        "duration_minutes": session.duration_minutes,
        "message": "Session ended. Add a reflection to earn XP! ✍️",
    }

from datetime import timedelta
from models import UserTask

@router.get("/last-active")
def get_last_active(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns the last active task for work continuity banner."""
    task_id = current_user.last_active_task_id
    if not task_id:
        return {"task": None}
    task = db.query(UserTask).filter(
        UserTask.id == task_id,
        UserTask.user_id == current_user.id,
        UserTask.status != "completed",
    ).first()
    if not task:
        current_user.last_active_task_id = None
        db.commit()
        return {"task": None}
    return {"task": {
        "id": task.id,
        "title": task.title,
        "priority": task.priority,
        "estimated_minutes": task.estimated_minutes,
        "status": task.status,
    }}


@router.get("/stats")
def get_session_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Returns analytics payload for the logged-in user."""
    today = datetime.utcnow().date()
    seven_days_ago = today - timedelta(days=6)
    
    sessions = db.query(SessionModel).filter(
        SessionModel.user_id == current_user.id
    ).all()
    
    # 1. Total Focus Time (Today and Week)
    today_focus = sum(s.duration_minutes or 0 for s in sessions if s.end_time and s.end_time.date() == today)
    
    week_sessions = [s for s in sessions if s.end_time and s.end_time.date() >= seven_days_ago]
    week_focus = sum(s.duration_minutes or 0 for s in week_sessions)
    
    # 2. Completion Rate
    completed_sessions = [s for s in sessions if s.status == "completed" and s.duration_minutes is not None]
    completion_rate = 0
    if len(sessions) > 0:
        completion_rate = round((len(completed_sessions) / len(sessions)) * 100)
        
    # 3. Avg Session Length
    avg_session_length = 0
    if len(completed_sessions) > 0:
        avg_session_length = round(sum(s.duration_minutes for s in completed_sessions) / len(completed_sessions))
        
    # 4. Productivity Trend (Last 7 Days)
    # Initialize 7 days trend to 0
    trend_dict = {(seven_days_ago + timedelta(days=i)).isoformat(): 0 for i in range(7)}
    for s in week_sessions:
        if s.end_time:
            key = s.end_time.date().isoformat()
            if key in trend_dict:
                trend_dict[key] += s.duration_minutes or 0
                
    trend = [{"date": k, "minutes": round(v)} for k, v in trend_dict.items()]
    
    # 5. Energy vs Output
    energy_buckets = {}
    for s in completed_sessions:
        if s.energy_level is not None:
            if s.energy_level not in energy_buckets:
                energy_buckets[s.energy_level] = []
            energy_buckets[s.energy_level].append(s.duration_minutes or 0)
            
    energy_vs_output = []
    for level, durations in energy_buckets.items():
        energy_vs_output.append({
            "energy_level": level,
            "session_count": len(durations),
            "avg_minutes": round(sum(durations) / len(durations))
        })
        
    # Sort by energy level descending
    energy_vs_output.sort(key=lambda x: x["energy_level"], reverse=True)

    return {
        "today_focus_minutes": round(today_focus),
        "week_focus_minutes": round(week_focus),
        "completion_rate": completion_rate,
        "avg_session_length": avg_session_length,
        "trend": trend,
        "energy_vs_output": energy_vs_output
    }


@router.get("/me")
def list_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all completed sessions for the current user."""
    sessions = (
        db.query(SessionModel)
        .filter(SessionModel.user_id == current_user.id)
        .order_by(SessionModel.start_time.desc())
        .limit(20)
        .all()
    )

    return [
        {
            "id": s.id,
            "start_time": s.start_time.isoformat(),
            "end_time": s.end_time.isoformat() if s.end_time else None,
            "duration_minutes": s.duration_minutes,
        }
        for s in sessions
    ]
