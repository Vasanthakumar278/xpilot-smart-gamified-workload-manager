# XPilot ⚡ 

**Gamified Productivity System for Students & Workers**

XPilot is a behavior-driven, dual-mode productivity system designed to close the gap between ambition and execution. It uses a modern offline-first architecture (React + FastAPI + SQLite, with Postgres/Render support) focusing entirely on the effort you put in, rather than just the tasks you check off. 

At the core of XPilot is the concept of **Focus Sessions**—uninterrupted blocks of deep work where you lock in, execute, and then reflect on what you accomplished. Completing these sessions earns you **XP (Experience Points)**, turning consistency into a tangible reward.

Featuring two distinct environments tailored to different psychological approaches to work: **Student Mode** and **Worker Mode**.

---

## 🎓 Student Mode

Student mode is designed for **learning, retention, and spaced execution**. It treats the user as a student mastering new topics where consistency over time is paramount.

### Highlights & Features:
* **The Study Room Timer:** The core loop. Choose a track, start a focus timer, study, and write a reflection. The longer you study and the better you reflect, the more XP you earn.
* **Consistency Tracking:** Instead of focusing on strict deadlines, Student mode tracks your "sessions this week" and "day streaks." A dedicated progress bar shows your consistency percentage over the last 7 days.
* **Coursework & Tracks:** Organise your studies into flexible "Tracks" (e.g., Mathematics, Coding, Languages). Actively select a topic to focus your session on and visualize your progress.
* **Reflections & Consolidation:** When a timer ends, you are prompted to write a "Review." This forces active recall, cementing what you just learned before awarding XP.
* **XPilot Coach (AI Chatbot):** Integrated LLM assistant (Llama-3.3-70b via Groq) that is deeply integrated with your session history. It acts as a personal tutor to advise you on what to study next based on your past reflections.
* **Study Groups (New!):** Find study groups to collaborate with your peers and learn together.

---

## 💼 Worker Mode

Worker mode is designed for **project execution, energy management, and output**. It treats the user as a professional executing specific tasks within defined projects, where managing cognitive load is just as important as the work itself.

### Highlights & Features:
* **Mission Control Dashboard:** A professional interface to define structured Projects and the specific Tasks within them. Work is modular and actionable.
* **Energy-Aware Execution:** Before generating a work schedule, workers perform an "Energy Check" (rating their current energy from 1-10). The system then adjusts its timer recommendations (25m vs 45m vs 75m) based on your capacity.
* **Immersive Deep Work Environment:** Workers select a specific task and lock into an Execution Block. This full-screen execution page provides extreme focus, preventing context switching.
* **Deep Work Scratchpad:** During an active execution session, a floating scratchpad allows workers to quickly jot down intrusive thoughts or tangent ideas without breaking focus from the main task.
* **Focus Arena (New!):** Competitions for Deep Work. Workers can challenge each other to focus battles. Outfocus your opponents, prove you aren't tab-switching, and climb the ELO ranked leaderboard.

---

## 🛠 Tech Stack & Architecture

XPilot is built for speed, privacy, and seamless cloud deployment:

* **Frontend:** React + Vite + Vanilla CSS + Lucide React (for iconography). Clean, modern, and extremely fast SPA.
* **Backend:** FastAPI (Python). Provides a blazing-fast REST API for the frontend, incorporating Pydantic schemas and SQLAlchemy ORM.
* **Database:** SQLite for local offline development, ready to scale to PostgreSQL for cloud deployment (via Render).
* **AI Integration:** Blazing fast Llama-3.3-70b powered by Groq API. Reads users' previous histories to make hyper-contextual recommendations.
* **Zero-config Deployment:** Included config files (`render.yaml` and `vercel.json`) make XPilot deployable to Render (Backend) and Vercel (Frontend) in one click.

---

## 🚀 Running Locally

### 1. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start the server
python -m uvicorn main:app --reload
```
*The API will run on http://localhost:8000.*

### 2. Frontend Setup
```bash
cd frontend
npm install

# Start the dev server
npm run dev
```
*The Web UI will be available at http://localhost:5173.*

*(Note: API connection assumes the backend is running on `localhost:8000`. You can change this by setting `VITE_API_URL` in a `.env` file.)*

---

## ☁️ Deployment Guide

### Backend (Render)
XPilot is pre-configured to deploy on Render's free tier:
1. Connect your repository to Render -> New Web Service.
2. Ensure the setting uses `backend` as the Root Directory.
3. Provide a `DATABASE_URL` (if using Render Postgres) and `SECRET_KEY`.

### Frontend (Vercel)
XPilot is pre-configured for Vercel:
1. Connect your repository to Vercel -> New Project.
2. Ensure the setting uses `frontend` as the Root Directory.
3. Provide `VITE_API_URL` pointing to your deployed Render backend (e.g. `https://xpilot-api.onrender.com`).
4. Hit Deploy! Vercel handles the SPA routing automatically via the included `vercel.json`.

---

**XPilot — Build consistency. Earn XP. Win the day.**
