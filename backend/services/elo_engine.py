"""
services/elo_engine.py — Focus Score + ELO calculation for Focus Arena.
"""


def compute_focus_score(duration_minutes: float, completed: bool, pause_count: int) -> float:
    """
    Focus Score = (duration × 0.5) + (30 if completed) - (pauses × 5)
    Rewards discipline over speed — never negative.
    """
    score = (duration_minutes * 0.5) + (30 if completed else 0) - (pause_count * 5)
    return max(0.0, round(score, 2))


def compute_elo(elo_a: int, elo_b: int, score_a: float, score_b: float, k: int = 24):
    """
    Chess-style ELO update with K=24.
    actual_a = 1 (win), 0.5 (draw), 0 (loss)
    Returns (new_elo_a, new_elo_b, delta_a, delta_b)
    """
    # Expected scores
    expected_a = 1 / (1 + 10 ** ((elo_b - elo_a) / 400))
    expected_b = 1 - expected_a

    # Actual scores
    if score_a > score_b:
        actual_a, actual_b = 1.0, 0.0
    elif score_b > score_a:
        actual_a, actual_b = 0.0, 1.0
    else:
        actual_a, actual_b = 0.5, 0.5

    delta_a = round(k * (actual_a - expected_a))
    delta_b = round(k * (actual_b - expected_b))

    return (
        max(100, elo_a + delta_a),
        max(100, elo_b + delta_b),
        delta_a,
        delta_b,
        actual_a,
        actual_b,
    )


def compute_xp(actual_a: float, actual_b: float):
    """Win=+30, Draw=+20, Loss=+10."""
    def _xp(actual):
        if actual == 1.0: return 30
        if actual == 0.5: return 20
        return 10
    return _xp(actual_a), _xp(actual_b)
