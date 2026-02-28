"""
routes/projects.py — Project CRUD.
All routes are scoped to the authenticated user — users can only manage their own projects.
Deleting a project cascades to all its tasks via SQLAlchemy + SQLite FK enforcement.
"""
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
import models
from .deps import get_current_user

router = APIRouter(prefix="/projects", tags=["Projects"])


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


@router.post("/")
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_project = models.Project(
        user_id=current_user.id,
        name=project.name.strip(),
        description=project.description,
    )
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    return db_project


@router.get("/")
def get_user_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    return (
        db.query(models.Project)
        .filter(models.Project.user_id == current_user.id)
        .order_by(models.Project.created_at.desc())
        .all()
    )


@router.delete("/{project_id}")
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
):
    db_project = db.query(models.Project).filter(
        models.Project.id == project_id,
        models.Project.user_id == current_user.id,
    ).first()
    if not db_project:
        raise HTTPException(status_code=404, detail="Project not found")

    db.delete(db_project)
    db.commit()
    return {"message": "Project and its tasks deleted successfully"}
