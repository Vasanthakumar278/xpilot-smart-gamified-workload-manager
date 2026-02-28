"""
models.py — All SQLAlchemy ORM models for XPilot.
Relationships use cascade="all, delete-orphan" so child rows are removed
automatically when a parent is deleted, even with SQLite FK enforcement.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Date, Boolean
from sqlalchemy.orm import relationship
from database import Base


# ── Users ────────────────────────────────────────────────────────────────────

class User(Base):
    __tablename__ = "users"

    id                 = Column(Integer, primary_key=True, index=True)
    name               = Column(String(100), nullable=False)
    email              = Column(String(200), unique=True, index=True, nullable=False)
    password_hash      = Column(String(255), nullable=False)
    role               = Column(String(20), nullable=False, default="student")  # student | worker
    xp                 = Column(Integer, default=0)
    elo_rating         = Column(Integer, default=1200)  # Focus Arena ELO
    rank_points        = Column(Integer, default=0)     # cumulative arena points
    created_at         = Column(DateTime, default=datetime.utcnow)
    last_active_task_id = Column(Integer, nullable=True)  # work continuity

    sessions     = relationship("Session",     back_populates="user", cascade="all, delete-orphan")
    xp_logs      = relationship("XPLog",       back_populates="user", cascade="all, delete-orphan")
    energy_logs  = relationship("EnergyLog",   back_populates="user", cascade="all, delete-orphan")
    focus_tracks = relationship("FocusTrack",  back_populates="user", cascade="all, delete-orphan")
    tasks        = relationship("UserTask",    back_populates="user", cascade="all, delete-orphan")
    projects     = relationship("Project",     back_populates="user", cascade="all, delete-orphan")


# ── Sessions + Reflections ───────────────────────────────────────────────────

class Session(Base):
    __tablename__ = "sessions"

    id               = Column(Integer, primary_key=True, index=True)
    task_id          = Column(Integer, ForeignKey("user_tasks.id", ondelete="SET NULL"), nullable=True)
    user_id          = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    start_time       = Column(DateTime, nullable=False, default=datetime.utcnow)
    end_time         = Column(DateTime, nullable=True)
    duration_minutes = Column(Float, nullable=True)
    energy_level     = Column(Integer, nullable=True)
    status           = Column(String(20), default="completed") # completed | abandoned

    user       = relationship("User",       back_populates="sessions")
    reflection = relationship("Reflection", back_populates="session", uselist=False,
                              cascade="all, delete-orphan")


class Reflection(Base):
    __tablename__ = "reflections"

    id         = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("sessions.id", ondelete="CASCADE"), nullable=False)
    text       = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    session = relationship("Session", back_populates="reflection")


# ── XP + Energy ──────────────────────────────────────────────────────────────

class XPLog(Base):
    __tablename__ = "xp_logs"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    xp_awarded = Column(Integer, nullable=False)
    reason     = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="xp_logs")


class EnergyLog(Base):
    __tablename__ = "energy_logs"

    id      = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    level   = Column(Integer, nullable=False)  # 1–10
    date    = Column(Date, nullable=False)

    user = relationship("User", back_populates="energy_logs")


# ── Projects + Tasks ─────────────────────────────────────────────────────────

class Project(Base):
    __tablename__ = "projects"

    id          = Column(Integer, primary_key=True, index=True)
    user_id     = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    name        = Column(String(200), nullable=False)
    description = Column(String(500), nullable=True)
    created_at  = Column(DateTime, default=datetime.utcnow)

    user  = relationship("User", back_populates="projects")
    # Cascade: deleting a Project deletes all its Tasks
    tasks = relationship(
        "UserTask",
        back_populates="project_ref",
        cascade="all, delete-orphan",
        passive_deletes=True,
    )


class UserTask(Base):
    __tablename__ = "user_tasks"

    id                = Column(Integer, primary_key=True, index=True)
    user_id           = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title             = Column(String(200), nullable=False)
    project           = Column(String(100), nullable=True)   # legacy label
    project_id        = Column(Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=True)
    priority          = Column(String(20), default="medium")  # high | medium | low
    estimated_minutes = Column(Integer, default=30)
    status            = Column(String(20), default="pending")  # pending | active | completed
    order_index       = Column(Integer, default=0)             # manual sort
    created_at        = Column(DateTime, default=datetime.utcnow)
    completed_at      = Column(DateTime, nullable=True)

    user        = relationship("User",    back_populates="tasks")
    project_ref = relationship("Project", back_populates="tasks")


# ── Focus Tracks + Chat ──────────────────────────────────────────────────────

class FocusTrack(Base):
    """One row per subject a user is studying. Only one track per user is active at a time."""
    __tablename__ = "focus_tracks"

    id         = Column(Integer, primary_key=True, index=True)
    user_id    = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic      = Column(String(120), nullable=False)
    status     = Column(String(10), default="active")   # active | paused
    last_used  = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    user         = relationship("User",        back_populates="focus_tracks")
    chat_history = relationship("ChatHistory", back_populates="track",
                                cascade="all, delete-orphan")


class ChatHistory(Base):
    """Per-message chat log, isolated to a FocusTrack."""
    __tablename__ = "chat_history"

    id        = Column(Integer, primary_key=True, index=True)
    user_id   = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    focus_id  = Column(Integer, ForeignKey("focus_tracks.id", ondelete="CASCADE"), nullable=False)
    role      = Column(String(10), nullable=False)   # user | coach
    message   = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)

    track = relationship("FocusTrack", back_populates="chat_history")


# ── Topic Memory ─────────────────────────────────────────────────────────────

class TopicMemory(Base):
    """Tracks a user's confidence and history with a specific topic/subject."""
    __tablename__ = "topic_memories"

    id               = Column(Integer, primary_key=True, index=True)
    user_id          = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    topic_name       = Column(String(200), nullable=False)
    last_studied     = Column(DateTime, default=datetime.utcnow)
    confidence_level = Column(Integer, default=0)  # 0–100

    user = relationship("User")


# ── Focus Arena ──────────────────────────────────────────────────────────────

class Challenge(Base):
    """1-vs-1 deep-work challenge between two workers."""
    __tablename__ = "challenges"

    id                  = Column(Integer, primary_key=True, index=True)
    challenger_id       = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    opponent_id         = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    task_description    = Column(String(500), nullable=False)
    duration_minutes    = Column(Integer, nullable=False, default=45)
    status              = Column(String(20), default="pending")  # pending | active | finished
    start_time          = Column(DateTime, nullable=True)
    end_time            = Column(DateTime, nullable=True)
    challenger_pauses   = Column(Integer, default=0)
    opponent_pauses     = Column(Integer, default=0)
    created_at          = Column(DateTime, default=datetime.utcnow)

    challenger  = relationship("User", foreign_keys=[challenger_id])
    opponent    = relationship("User", foreign_keys=[opponent_id])
    result      = relationship("MatchResult", back_populates="challenge", uselist=False)


class MatchResult(Base):
    """Outcome of a completed challenge."""
    __tablename__ = "match_results"

    id              = Column(Integer, primary_key=True, index=True)
    challenge_id    = Column(Integer, ForeignKey("challenges.id", ondelete="CASCADE"), nullable=False)
    winner_id       = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)  # NULL = draw
    focus_score_a   = Column(Float, default=0.0)
    focus_score_b   = Column(Float, default=0.0)
    xp_awarded      = Column(Integer, default=0)
    elo_change_a    = Column(Integer, default=0)
    elo_change_b    = Column(Integer, default=0)
    created_at      = Column(DateTime, default=datetime.utcnow)

    challenge = relationship("Challenge", back_populates="result")
    winner    = relationship("User", foreign_keys=[winner_id])
