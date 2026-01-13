"""
Migration script to add forum tables (forum_threads, forum_replies, forum_reply_upvotes).
Run this script to add the new tables to your database.
"""

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from models import Base, ForumThread, ForumReply, ForumReplyUpvote

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

# Create engine (PostgreSQL)
engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def run_migration():
    """Create forum tables if they don't exist."""
    print("Starting forum tables migration...")
    
    try:
        # Create tables
        Base.metadata.create_all(bind=engine, tables=[
            ForumThread.__table__,
            ForumReply.__table__,
            ForumReplyUpvote.__table__,
        ])
        print("✓ Forum tables created successfully!")
        print("  - forum_threads")
        print("  - forum_replies")
        print("  - forum_reply_upvotes")
    except Exception as e:
        print(f"✗ Error creating forum tables: {e}")
        raise


if __name__ == "__main__":
    run_migration()
