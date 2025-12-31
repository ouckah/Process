#!/usr/bin/env python3
"""Quick script to view database contents."""

from api.database import SessionLocal
from api.models import User, Process, Stage

db = SessionLocal()

print("=== USERS ===")
users = db.query(User).all()
for user in users:
    print(f"ID: {user.id}, Email: {user.email}, Username: {user.username}")

print("\n=== PROCESSES ===")
processes = db.query(Process).all()
for p in processes:
    print(f"ID: {p.id}, Company: {p.company_name}, Status: {p.status.value}")

print("\n=== STAGES ===")
stages = db.query(Stage).all()
for s in stages:
    print(f"ID: {s.id}, Process: {s.process_id}, Stage: {s.stage_name}, Date: {s.stage_date}")

db.close()

