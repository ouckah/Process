"""
Migration script to make email nullable in users table.
Run this script to update existing database schema.
"""
import sqlite3
import os
from pathlib import Path

# Get database path
DATABASE_PATH = Path(__file__).parent.parent.parent / "process_tracker.db"

def migrate():
    """Make email column nullable in users table."""
    if not DATABASE_PATH.exists():
        print(f"Database not found at {DATABASE_PATH}")
        print("Database will be created with new schema on next API startup.")
        return
    
    conn = sqlite3.connect(str(DATABASE_PATH))
    cursor = conn.cursor()
    
    try:
        # Check if email is already nullable
        cursor.execute("PRAGMA table_info(users)")
        columns = cursor.fetchall()
        email_col = next((col for col in columns if col[1] == "email"), None)
        
        if email_col:
            # SQLite doesn't support ALTER COLUMN directly
            # We need to recreate the table
            print("Making email nullable in users table...")
            
            # Create new table with nullable email
            cursor.execute("""
                CREATE TABLE users_new (
                    id INTEGER PRIMARY KEY,
                    discord_id VARCHAR UNIQUE,
                    google_id VARCHAR UNIQUE,
                    email VARCHAR UNIQUE,
                    username VARCHAR NOT NULL,
                    hashed_password VARCHAR,
                    created_at DATETIME,
                    last_login DATETIME
                )
            """)
            
            # Copy data from old table
            cursor.execute("""
                INSERT INTO users_new 
                (id, discord_id, google_id, email, username, hashed_password, created_at, last_login)
                SELECT id, discord_id, google_id, email, username, hashed_password, created_at, last_login
                FROM users
            """)
            
            # Drop old table
            cursor.execute("DROP TABLE users")
            
            # Rename new table
            cursor.execute("ALTER TABLE users_new RENAME TO users")
            
            conn.commit()
            print("Migration completed successfully!")
        else:
            print("Email column not found. Table may need to be recreated.")
    
    except Exception as e:
        conn.rollback()
        print(f"Migration failed: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()

