"""
routes/tasks.py — Task CRUD endpoints.
user_id is always inferred from the JWT token — never trusted from the request body.
"""
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
import models
from .deps import get_current_user

router = APIRouter(prefix="/tasks", tags=["Tasks"])


class TaskCreate(BaseModel):
    title: str
    project: Optional[str] = None
    project_id: Optional[int] = None
    priority: str = "medium"
    estimated_minutes: int = 30


class TaskUpdate(BaseModel):
    status: str


class TaskReorder(BaseModel):
    order_index: int


@router.post("/")
def create_task(
    task: TaskCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    if task.project_id is not None:
        project = db.query(models.Project).filter(
            models.Project.id == task.project_id,
            models.Project.user_id == current_user.id,
        ).first()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

    # New task goes at the bottom (max order_index + 1)
    max_order = db.query(models.UserTask).filter(
        models.UserTask.user_id == current_user.id
    ).count()

    db_task = models.UserTask(
        user_id=current_user.id,
        title=task.title,
        project=task.project,
        project_id=task.project_id,
        priority=task.priority,
        estimated_minutes=task.estimated_minutes,
        status="pending",
        order_index=max_order,
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.get("/")
def get_user_tasks(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.UserTask)
        .filter(models.UserTask.user_id == current_user.id)
        .order_by(models.UserTask.order_index.asc(), models.UserTask.created_at.desc())
        .all()
    )


@router.patch("/{task_id}")
def update_task_status(
    task_id: int,
    task_update: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_task = db.query(models.UserTask).filter(
        models.UserTask.id == task_id,
        models.UserTask.user_id == current_user.id,
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db_task.status = task_update.status
    db.commit()
    db.refresh(db_task)
    return db_task


@router.patch("/{task_id}/reorder")
def reorder_task(
    task_id: int,
    body: TaskReorder,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    """Update a task's order_index for drag-to-reorder."""
    db_task = db.query(models.UserTask).filter(
        models.UserTask.id == task_id,
        models.UserTask.user_id == current_user.id,
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db_task.order_index = body.order_index
    db.commit()
    db.refresh(db_task)
    return db_task


@router.patch("/{task_id}/start")
def start_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    # Enforce: only ONE active task at a time
    active = db.query(models.UserTask).filter(
        models.UserTask.user_id == current_user.id,
        models.UserTask.status == "active",
    ).first()
    if active and active.id != task_id:
        raise HTTPException(
            status_code=409,
            detail=f"Task '{active.title}' is already active. Complete it first."
        )

    db_task = db.query(models.UserTask).filter(
        models.UserTask.id == task_id,
        models.UserTask.user_id == current_user.id,
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db_task.status = "active"
    current_user.last_active_task_id = task_id
    db.commit()
    db.refresh(db_task)
    return db_task


@router.patch("/{task_id}/complete")
def complete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_task = db.query(models.UserTask).filter(
        models.UserTask.id == task_id,
        models.UserTask.user_id == current_user.id,
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db_task.status = "completed"
    db_task.completed_at = datetime.utcnow()

    # Clear work continuity if this was the last active task
    if current_user.last_active_task_id == task_id:
        current_user.last_active_task_id = None

    db.commit()
    db.refresh(db_task)
    return db_task


@router.delete("/{task_id}")
def delete_task(
    task_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_task = db.query(models.UserTask).filter(
        models.UserTask.id == task_id,
        models.UserTask.user_id == current_user.id,
    ).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")

    db.delete(db_task)
    db.commit()
    return {"ok": True}
