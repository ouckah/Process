from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Date, Enum, Boolean, JSON, JSON
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime
import enum


Base = declarative_base()


class ProcessStatus(enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    REJECTED = "rejected"


class User(Base):
    __tablename__ = 'users'

    id = Column(Integer, primary_key=True)
    discord_id = Column(String, unique=True, nullable=True)  # Discord user ID
    discord_avatar = Column(String, nullable=True)  # Discord avatar hash
    google_id = Column(String, unique=True, nullable=True)   # Google user ID
    email = Column(String, unique=True, nullable=True)  # Nullable for ghost accounts created via Discord bot
    username = Column(String, nullable=False)
    display_name = Column(String(100), nullable=True)  # Pseudonym for public display
    is_anonymous = Column(Boolean, default=False)  # Hide username on public profile
    comments_enabled = Column(Boolean, default=True)  # Allow comments on public profile
    discord_privacy_mode = Column(String(10), default='public')  # Discord privacy preference: 'private' or 'public'
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    processes = relationship("Process", back_populates="user", cascade="all, delete-orphan")
    feedback = relationship("Feedback", back_populates="user", cascade="all, delete-orphan")
    profile_comments = relationship("ProfileComment", foreign_keys="ProfileComment.profile_user_id", back_populates="profile_user", cascade="all, delete-orphan")
    authored_comments = relationship("ProfileComment", foreign_keys="ProfileComment.author_id", back_populates="author")

    def __repr__(self):
        email_str = self.email if self.email else "no-email"
        return f"User(id={self.id}, email={email_str}, username={self.username})"


class Process(Base):
    __tablename__ = 'processes'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    company_name = Column(String(100), nullable=False)  # e.g., "Google"
    position = Column(String(200), nullable=True)         # e.g., "Software Engineer"
    status = Column(Enum(ProcessStatus), default=ProcessStatus.ACTIVE)
    is_public = Column(Boolean, default=False)  # Public sharing toggle
    share_id = Column(String, unique=True, nullable=True)  # UUID for sharing
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="processes")
    stages = relationship("Stage", back_populates="process", cascade="all, delete-orphan", order_by="Stage.order")

    def __repr__(self):
        return f"Process(id={self.id}, company={self.company_name}, status={self.status.value})"


class Stage(Base):
    __tablename__ = 'stages'

    id = Column(Integer, primary_key=True)
    process_id = Column(Integer, ForeignKey('processes.id'), nullable=False)
    stage_name = Column(String(100), nullable=False)  # e.g., "OA", "Phone Screen", "Reject"
    stage_date = Column(DateTime, nullable=False)      # e.g., 2025-12-03 14:30:00
    notes = Column(String(500), nullable=True)         # Optional notes
    order = Column(Integer, nullable=False)            # For sequencing (1, 2, 3, ...)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship back to process
    process = relationship("Process", back_populates="stages")

    def __repr__(self):
        return f"Stage(id={self.id}, name={self.stage_name}, date={self.stage_date})"


class Feedback(Base):
    __tablename__ = 'feedback'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Nullable for anonymous feedback
    name = Column(String(100), nullable=True)  # For anonymous users
    email = Column(String(200), nullable=True)  # For anonymous users
    message = Column(String(2000), nullable=False)  # Feedback message
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship back to user (optional)
    user = relationship("User", back_populates="feedback")

    def __repr__(self):
        return f"Feedback(id={self.id}, user_id={self.user_id}, created_at={self.created_at})"


class ProfileComment(Base):
    __tablename__ = 'profile_comments'

    id = Column(Integer, primary_key=True)
    profile_user_id = Column(Integer, ForeignKey('users.id'), nullable=False)  # Profile owner
    author_id = Column(Integer, ForeignKey('users.id'), nullable=True)  # Comment author (null if anonymous)
    author_display_name = Column(String(100), nullable=True)  # For anonymous comments
    parent_comment_id = Column(Integer, ForeignKey('profile_comments.id'), nullable=True)  # For replies
    content = Column(String(2000), nullable=False)
    is_question = Column(Boolean, default=False)  # Distinguish Q&A from comments
    is_answered = Column(Boolean, default=False)  # For Q&A
    is_deleted = Column(Boolean, default=False)  # Soft delete for moderation
    upvotes = Column(Integer, default=0)  # Upvote count
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    profile_user = relationship("User", foreign_keys=[profile_user_id], back_populates="profile_comments")
    author = relationship("User", foreign_keys=[author_id], back_populates="authored_comments")
    parent_comment = relationship("ProfileComment", remote_side=[id], backref="replies")

    def __repr__(self):
        return f"ProfileComment(id={self.id}, profile_user_id={self.profile_user_id}, author_id={self.author_id}, created_at={self.created_at})"


class CommentUpvote(Base):
    __tablename__ = 'comment_upvotes'

    id = Column(Integer, primary_key=True)
    comment_id = Column(Integer, ForeignKey('profile_comments.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    comment = relationship("ProfileComment", backref="upvote_records")
    user = relationship("User")

    def __repr__(self):
        return f"CommentUpvote(id={self.id}, comment_id={self.comment_id}, user_id={self.user_id})"


class GuildConfig(Base):
    __tablename__ = 'guild_configs'
    
    id = Column(Integer, primary_key=True)
    guild_id = Column(String, unique=True, nullable=False)  # Discord guild ID
    config = Column(JSON, nullable=False)  # JSON config data
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"GuildConfig(id={self.id}, guild_id={self.guild_id})"
