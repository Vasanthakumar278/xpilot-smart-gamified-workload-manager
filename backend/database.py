"""
database.py — SQLAlchemy engine + session setup
Supports SQLite (local dev) and PostgreSQL (production) via DATABASE_URL env var.
"""
import os
from sqlalchemy import create_engine, event
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Fallback to SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./xpilot.db")

# Render provides postgres:// URLs — SQLAlchemy requires postgresql://
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

_is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
)

# Enable FK enforcement on every SQLite connection (not needed for Postgres)
if _is_sqlite:
    @event.listens_for(engine, "connect")
    def enable_sqlite_fk(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI dependency: yields a scoped DB session per request."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
