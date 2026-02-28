"""
main.py — FastAPI application entry point
"""
import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Ensure the backend root is on the path so all imports resolve correctly
sys.path.insert(0, os.path.dirname(__file__))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base

# Import ALL models before create_all so SQLAlchemy registers every table
import models  # noqa: F401

from routes import auth, sessions, reflections, xp, energy, analytics, chat, resume, coach, topics, tracks, tasks, projects, schedule, day_summary, worker_analytics, arena

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="XPilot API",
    description="Hybrid AI Gamified Productivity System — Backend",
    version="1.0.0",
)

# ── CORS — allow all origins (dev + Vercel production) ───────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(sessions.router)
app.include_router(reflections.router)
app.include_router(xp.router)
app.include_router(energy.router)
app.include_router(analytics.router)
app.include_router(chat.router)
app.include_router(resume.router)
app.include_router(coach.router)
app.include_router(topics.router)
app.include_router(tracks.router)
app.include_router(tasks.router)
app.include_router(projects.router)
app.include_router(schedule.router)
app.include_router(day_summary.router)
app.include_router(worker_analytics.router)
app.include_router(arena.router)
app.include_router(arena.leaderboard_router)


# ── Create all tables on startup ─────────────────────────────────────────────
@app.on_event("startup")
def startup():
    """
    Runs once when the server starts.
    Applies safe column migrations, then creates any missing tables.
    """
    from routes.migrate import run_migrations
    run_migrations()
    Base.metadata.create_all(bind=engine)
    print("Database tables verified / created.")


@app.get("/")
def root():
    return {
        "message": "XPilot API is running 🚀",
        "docs": "/docs",
        "version": "1.0.0",
    }


# ── Student Plan Endpoint ─────────────────────────────────────────────────────
@app.get("/student-plan/{user_id}")
def get_student_plan(user_id: int):
    return {
        "blocks": [
            {"title": "Warm-up Review", "duration": 10},
            {"title": "Focused Practice", "duration": 25},
            {"title": "Break", "duration": 5},
            {"title": "Concept Strengthening", "duration": 20},
            {"title": "Reflection", "duration": 5},
        ],
        "consistency": 42,
    }


@app.post("/start-session")
def start_session_root():
    return {"message": "Session started successfully! 🎯"}
