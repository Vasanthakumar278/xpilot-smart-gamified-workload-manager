"""
routes/migrate.py — Safe ALTER TABLE migrations for SQLite.
Called once on startup via main.py before create_all.
"""
from sqlalchemy import text
from database import engine


def run_migrations():
    """Add new columns to existing tables if they don't already exist."""
    with engine.connect() as conn:
        # ── user_tasks: order_index ───────────────────────────────────────
        try:
            existing = [row[1] for row in conn.execute(
                text("PRAGMA table_info(user_tasks)")
            ).fetchall()]
            if "order_index" not in existing:
                conn.execute(text(
                    "ALTER TABLE user_tasks ADD COLUMN order_index INTEGER DEFAULT 0"
                ))
                conn.commit()
                print("[migrate] Added order_index to user_tasks")
        except Exception as e:
            print(f"[migrate] order_index skip: {e}")

        # ── users: last_active_task_id, elo_rating, rank_points ───────────
        try:
            existing = [row[1] for row in conn.execute(
                text("PRAGMA table_info(users)")
            ).fetchall()]
            for col, ddl in [
                ("last_active_task_id", "ALTER TABLE users ADD COLUMN last_active_task_id INTEGER"),
                ("elo_rating",         "ALTER TABLE users ADD COLUMN elo_rating INTEGER DEFAULT 1200"),
                ("rank_points",        "ALTER TABLE users ADD COLUMN rank_points INTEGER DEFAULT 0"),
            ]:
                if col not in existing:
                    conn.execute(text(ddl))
                    conn.commit()
                    print(f"[migrate] Added {col} to users")
        except Exception as e:
            print(f"[migrate] users columns skip: {e}")
