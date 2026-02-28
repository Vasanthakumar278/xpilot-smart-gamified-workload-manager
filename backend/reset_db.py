"""
reset_db.py — DEVELOPMENT ONLY database reset script.

Deletes the existing SQLite database file and recreates all tables
from the current SQLAlchemy models. Run this whenever you change models.

Usage:
    cd backend
    python reset_db.py
"""
import os

DB_PATH = "xpilot.db"

if os.path.exists(DB_PATH):
    os.remove(DB_PATH)
    print(f"🗑  Deleted existing database: {DB_PATH}")
else:
    print(f"ℹ  No existing database found at: {DB_PATH}")

# Import Base and engine AFTER potential deletion
from database import Base, engine  # noqa: E402

# Import ALL models so their tables are registered with Base
import models  # noqa: F401, E402

Base.metadata.create_all(bind=engine)
print("✅ Database recreated with latest schema.")
print("\nTables created:")
for table in Base.metadata.sorted_tables:
    print(f"  - {table.name}")
