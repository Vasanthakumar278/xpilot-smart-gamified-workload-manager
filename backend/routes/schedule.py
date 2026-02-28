from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/schedule", tags=["Schedule"])

class EnergyInput(BaseModel):
    energy: int

@router.post("/generate")
def generate_schedule(data: EnergyInput):

    energy = data.energy

    if energy <= 3:
        plan = [
            {"title": "Light Review", "duration": 25, "type": "light"},
            {"title": "Break", "duration": 5, "type": "break"},
            {"title": "Continue Small Task", "duration": 25, "type": "light"},
        ]

    elif energy <= 7:
        plan = [
            {"title": "Focused Work", "duration": 45, "type": "deep"},
            {"title": "Break", "duration": 10, "type": "break"},
            {"title": "Deep Task", "duration": 45, "type": "deep"},
        ]

    else:
        plan = [
            {"title": "Deep Work Block", "duration": 90, "type": "deep"},
            {"title": "Recovery", "duration": 15, "type": "break"},
            {"title": "Complex Problem Solving", "duration": 90, "type": "deep"},
        ]

    return {"schedule": plan}
