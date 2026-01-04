"""
Migration script to add discord_avatar column to users table.
Run this script to update your database schema.
"""
import sqlite3
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./process_tracker.db")

# Extract database file path from SQLite URL
if DATABASE_URL.startswith("sqlite:///"):
    db_path = DATABASE_URL.replace("sqlite:///", "")
    if db_path == "./process_tracker.db":
        db_path = "process_tracker.db"
else:
    # For PostgreSQL or other databases, you'd need to use SQLAlchemy
    print("This migration script is for SQLite only.")
    print("For PostgreSQL, please run the SQL manually:")
    print("ALTER TABLE users ADD COLUMN discord_avatar VARCHAR;")
    exit(1)

def migrate():
    """Add discord_avatar column to users table if it doesn't exist."""
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # Check if column already exists
        cursor.execute("PRAGMA table_info(users)")
        columns = [column[1] for column in cursor.fetchall()]
        
        if 'discord_avatar' in columns:
            print("Column 'discord_avatar' already exists. No migration needed.")
            return
        
        # Add the column
        print("Adding discord_avatar column to users table...")
        cursor.execute("ALTER TABLE users ADD COLUMN discord_avatar VARCHAR")
        conn.commit()
        print("✓ Successfully added discord_avatar column to users table!")
        
    except Exception as e:
        conn.rollback()
        print(f"✗ Error during migration: {e}")
        raise
    finally:
        conn.close()

if __name__ == "__main__":
    print("Running migration to add discord_avatar column...")
    migrate()
    print("Migration complete!")

