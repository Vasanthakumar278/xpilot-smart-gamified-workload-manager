"""
routes/chat.py — POST /chat endpoint
Accepts a user message, reads live DB context, returns a role-aware reply.
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db
from models import User
from routes.deps import get_current_user
from services.chat_engine import get_chat_response

router = APIRouter(prefix="/chat", tags=["chat"])


class ChatRequest(BaseModel):
    message: str


@router.post("/")
def chat(
    body: ChatRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Accepts a plain-text message, resolves intent from user context,
    and returns a structured XPilot-aware reply.
    """
    result = get_chat_response(db=db, user=current_user, message=body.message)
    return result
