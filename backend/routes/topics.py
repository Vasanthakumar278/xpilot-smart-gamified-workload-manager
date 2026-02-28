"""
routes/topics.py — POST /topic-map
Accepts a focus string, returns structured subtopic areas via Ollama Mistral.
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from database import get_db
from models import User
from routes.deps import get_current_user
from services.topic_mapper import generate_topic_map

router = APIRouter(prefix="/topic-map", tags=["topics"])


class TopicRequest(BaseModel):
    focus: str = Field(..., min_length=2, max_length=120)


@router.post("/")
def topic_map(
    body: TopicRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns 4–6 structured study areas for the given focus subject.
    Uses Ollama Mistral; falls back to keyword-based map if Ollama is offline.
    """
    return generate_topic_map(focus=body.focus)
