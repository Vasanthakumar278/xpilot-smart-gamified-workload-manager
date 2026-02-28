"""
services/topic_mapper.py — Topic Navigator via Ollama Mistral.

Breaks a user-declared focus subject into 4–6 practical study areas.
NOT a tutor — no explanations, no narrative, only structured checkpoints.

Uses Ollama running locally at http://localhost:11434.
Falls back to a deterministic keyword-based list if Ollama is unavailable.
"""
import re
import httpx

OLLAMA_URL   = "http://localhost:11434/api/generate"
OLLAMA_MODEL = "mistral"

PROMPT_TEMPLATE = """\
You are helping structure a study session.

Given a subject, list 4 to 6 key areas someone should work through.

Do NOT explain.
Do NOT teach.
Return only bullet points.

Example format:

* Area 1
* Area 2
* Area 3

Keep it concise and practical.

Subject: {focus}"""


# ── Ollama call ───────────────────────────────────────────────────────────────

def _call_ollama(focus: str) -> list[str]:
    payload = {
        "model":  OLLAMA_MODEL,
        "prompt": PROMPT_TEMPLATE.format(focus=focus),
        "stream": False,
    }
    resp = httpx.post(OLLAMA_URL, json=payload, timeout=30)
    resp.raise_for_status()
    raw = resp.json().get("response", "")
    return _parse_bullets(raw)


def _parse_bullets(text: str) -> list[str]:
    """
    Extract bullet-point lines from the model response.
    Handles *, -, •, and numbered patterns like 1.
    """
    lines = []
    for line in text.splitlines():
        line = line.strip()
        # Strip common bullet prefixes
        cleaned = re.sub(r"^[\*\-•\d]+[\.\)]\s*", "", line).strip()
        if cleaned and len(cleaned) > 3:
            lines.append(cleaned)
    return lines[:6]  # cap at 6 areas


# ── Fallback ──────────────────────────────────────────────────────────────────
# A tiny keyword-driven fallback so the feature still works when Ollama is down.

FALLBACK_MAPS: dict[str, list[str]] = {
    "cloud":        ["Service Models (IaaS / PaaS / SaaS)", "Deployment Models", "Virtualization Concepts", "Resource Scaling & Auto-scaling", "Cloud Security Basics", "Real-world Provider Comparison"],
    "machine":      ["Data Preprocessing", "Supervised vs Unsupervised Learning", "Model Evaluation Metrics", "Overfitting & Regularisation", "Common Algorithms (Linear, Tree, SVM)", "Deployment Considerations"],
    "operating":    ["Process Management", "Memory Management", "File Systems", "CPU Scheduling", "I/O & Device Drivers", "Security & Protection"],
    "network":      ["OSI / TCP-IP Models", "IP Addressing & Subnetting", "Routing Protocols", "Transport Layer (TCP/UDP)", "Application Layer Protocols", "Network Security Fundamentals"],
    "database":     ["Relational Model & SQL", "Normalization", "Indexing & Query Optimization", "Transactions & ACID", "NoSQL Alternatives", "Backup & Recovery"],
    "algorithm":    ["Time & Space Complexity", "Sorting Algorithms", "Graph Traversal (BFS / DFS)", "Dynamic Programming", "Greedy Algorithms", "Divide and Conquer"],
    "control":      ["Transfer Functions", "Block Diagrams", "Bode Plots & Frequency Response", "PID Controllers", "State-Space Representation", "Stability Analysis"],
    "python":       ["Data Types & Collections", "Functions & Scope", "OOP Concepts", "File Handling & I/O", "Common Libraries (NumPy, Pandas)", "Error Handling & Testing"],
}

DEFAULT_FALLBACK = [
    "Core Concepts & Definitions",
    "Foundational Principles",
    "Common Problem Types",
    "Practical Application",
    "Edge Cases & Exceptions",
    "Review & Self-Assessment",
]

def _fallback_areas(focus: str) -> list[str]:
    focus_lower = focus.lower()
    for keyword, areas in FALLBACK_MAPS.items():
        if keyword in focus_lower:
            return areas
    return DEFAULT_FALLBACK


# ── Main entry ────────────────────────────────────────────────────────────────

def generate_topic_map(focus: str) -> dict:
    """
    Returns { focus, areas, source }.
    source = 'ollama' | 'fallback' — useful for frontend to show a subtle indicator.
    """
    focus = focus.strip()

    try:
        areas = _call_ollama(focus)
        if not areas:
            raise ValueError("Empty response from Ollama")
        return {"focus": focus, "areas": areas, "source": "ollama"}
    except Exception:
        # Ollama unavailable or empty — use keyword fallback silently
        return {"focus": focus, "areas": _fallback_areas(focus), "source": "fallback"}
