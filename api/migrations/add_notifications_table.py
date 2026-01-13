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

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

Base = declarative_base()

def run_migration():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    print("Running migration to add notifications table...")
    
    # Check if table exists
    from sqlalchemy import inspect
    inspector = inspect(engine)
    
    if 'notifications' in inspector.get_table_names():
        print("✓ Notifications table already exists, skipping migration.")
        return
    
    # Create the table (PostgreSQL)
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
    print("✓ Successfully created notifications table!")
    
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()

