# XPilot 8.2

XPilot is a behavior-driven, dual-mode productivity system designed to close the gap between ambition and execution. It uses an offline-first architecture (React + FastAPI + SQLite), focusing entirely on the effort you put in rather than just the tasks you check off. 

At the core of XPilot is the concept of **Focus Sessions**—uninterrupted blocks of deep work where you lock in, execute, and then reflect on what you accomplished. Completing these sessions and writing thoughtful reflections earns you **XP (Experience Points)**, turning consistency into a tangible reward.

XPilot features two distinct environments tailored to different psychological approaches to work: **Student Mode** and **Worker Mode**.

---

## � Dual-Mode Architecture

Student mode is designed for **learning, retention, and spaced execution**. It treats the user as a student mastering new topics where consistency over time is paramount.

### Key Features:
* **XP & Gamification:** The core loop is simple: Choose a topic, start a focus timer, study, and write a reflection. The longer you study and the better you reflect, the more XP you earn.
* **Consistency Tracking:** Instead of focusing on deadlines, Student mode tracks your "sessions this week" and "day streaks." A dedicated progress bar shows your consistency percentage over the last 7 days.
* **Topic Navigator (Tracks):** Organise your studies into flexible "Tracks" (e.g., Mathematics, Coding, Languages). You can actively select a topic to focus your session on.
* **Reflections & Consolidation:** When a timer ends, you are prompted to write a "Review." This forces active recall, cementing what you just learned before awarding XP.
* **Automatic Resume Prompts:** If you studied recently, the dashboard intelligently surfaces a "Resume" banner, prompting you to pick up exactly where you left off.

**The Philosophy:** Learning isn't about clearing a to-do list; it's about putting in the reps. Consistency is the skill.

---

## 💼 Worker Mode

Worker mode is designed for **project execution, energy management, and output**. It treats the user as a professional executing specific tasks within defined projects, where managing cognitive load is just as important as the work itself.

### Key Features:
* **Project & Task Hub:** A professional interface to define structured Projects and the specific Tasks within them. Work is modular and actionable.
* **Energy-Aware Execution:** Before generating a work schedule, workers perform an "Energy Check" (rating their current energy from 1-10). The system then adjusts its recommendations based on whether you are at peak capacity or running low.
* **Structured Execution Panel:** Instead of free-form study tracks, workers select a specific task and lock into an Execution Block. This block provides extreme focus, preventing context switching.
* **Deep Work Scratchpad:** During an active execution session, a floating scratchpad allows workers to quickly jot down intrusive thoughts or tangent ideas without breaking focus from the main task.
* **Output Analytics (Execution Metrics):** Tracks the number of completed sessions, average focus length, and your daily output versus your logged energy levels.

**The Philosophy:** Professional work requires structured intentionality. It's about protecting your energy, isolating specific tasks, and deploying deep work to achieve concrete outcomes.

---

## 🛠 Tech Stack & Architecture

XPilot is built for speed, privacy, and local deployment:

*   **Frontend:** React (Vite) + Vanilla CSS + Lucide React (for iconography). Minimal dependencies, completely standalone interface.
*   **Backend:** FastAPI (Python). Provides a lightning-fast REST API for the frontend.
*   **Database:** SQLite (via SQLAlchemy). A local file-based database ensuring offline capability and simple backups.
*   **AI Integration (Optional):** Designed with an offline-fallback architecture. Can connect to local LLMs or external APIs for intelligent coaching (Worker/Student AI advisors), but remains 100% functional without an active AI connection.
