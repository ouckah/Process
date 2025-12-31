"""
Minimal models for Discord bot.
Only includes User model needed by the bot.
"""
from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import declarative_base
from datetime import datetime

Base = declarative_base()


class User(Base):
    """User model - matches api.models.User structure."""
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    discord_id = Column(String, unique=True, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    email = Column(String, unique=True, nullable=True)
    username = Column(String, nullable=False)
    hashed_password = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)

    def __repr__(self):
        email_str = self.email if self.email else "no-email"
        return f"User(id={self.id}, email={email_str}, username={self.username})"

