"""
Migration script to add the notifications table.
Run this script to add the notifications table to your database.
"""
from sqlalchemy import create_engine, Column, Integer, String, Boolean, DateTime, ForeignKey, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime

import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./process_tracker.db")

Base = declarative_base()

def run_migration():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    print("Running migration to add notifications table...")
    
    # Check if table exists
    from sqlalchemy.inspect import inspect
    inspector = inspect(engine)
    
    if 'notifications' in inspector.get_table_names():
        print("✓ Notifications table already exists, skipping migration.")
        return
    
    # Create the table
    if DATABASE_URL.startswith("sqlite"):
        # SQLite syntax
        with engine.connect() as connection:
            connection.execute(text("""
                CREATE TABLE notifications (
                    id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    comment_id INTEGER,
                    is_read BOOLEAN NOT NULL DEFAULT 0,
                    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users (id),
                    FOREIGN KEY(comment_id) REFERENCES profile_comments (id)
                )
            """))
            connection.commit()
        print("✓ Successfully created notifications table (SQLite)!")
    else:
        # PostgreSQL syntax
        with engine.connect() as connection:
            connection.execute(text("""
                CREATE TABLE notifications (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL,
                    type VARCHAR(50) NOT NULL,
                    comment_id INTEGER,
                    is_read BOOLEAN NOT NULL DEFAULT FALSE,
                    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY(user_id) REFERENCES users (id) ON DELETE CASCADE,
                    FOREIGN KEY(comment_id) REFERENCES profile_comments (id) ON DELETE CASCADE
                )
            """))
            connection.commit()
        print("✓ Successfully created notifications table (PostgreSQL)!")
    
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()

