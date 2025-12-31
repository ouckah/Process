"""
Database access for Discord bot.
Shares the same database models and session factory as the API.
"""
import os
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy import create_engine
from sqlalchemy.pool import StaticPool
from typing import Generator
from dotenv import load_dotenv

# Import models from local models file (bot is modular, doesn't depend on api)
from models import User, Base

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./process_tracker.db")

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
else:
    engine = create_engine(DATABASE_URL)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database sessions for bot.
    Yields a database session and ensures it's closed after use.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def get_user_by_discord_id(db: Session, discord_id: str) -> User | None:
    """Get a user by Discord ID."""
    return db.query(User).filter(User.discord_id == discord_id).first()


def get_or_create_discord_user(db: Session, discord_id: str, username: str) -> User:
    """
    Get existing user by discord_id or create a new ghost account.
    Ghost accounts have discord_id and username but no email.
    """
    user = get_user_by_discord_id(db, discord_id)
    
    if not user:
        # Create ghost account (no email, no password)
        user = User(
            discord_id=discord_id,
            username=username,
            email=None,  # Ghost account
            hashed_password=None,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user

