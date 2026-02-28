import os
import sys
sys.path.insert(0, os.path.dirname(__file__))

from database import SessionLocal
from models import Session, User
from datetime import datetime, timedelta

db = SessionLocal()
user = db.query(User).filter(User.role == "worker").first()

if not user:
    print("No worker user found.")
else:
    # insert dummy sessions
    now = datetime.utcnow()
    for i in range(5):
        s = Session(
            user_id=user.id,
            start_time=now - timedelta(days=i, hours=2),
            end_time=now - timedelta(days=i, hours=1),
            duration_minutes=60,
            energy_level=8,
            status="completed"
        )
        db.add(s)
    db.commit()
    print("Added dummy sessions for analytics.")
