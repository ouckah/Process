"""
Migration script to add upvotes column to profile_comments table and create comment_upvotes table.
Handles both SQLite and PostgreSQL databases.
Idempotent - can be run multiple times safely.
"""
import os
import sys
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./process_tracker.db")

def is_sqlite(db_url: str) -> bool:
    """Check if database is SQLite."""
    return db_url.startswith("sqlite")

def column_exists(engine, table_name: str, column_name: str) -> bool:
    """Check if a column exists in a table."""
    inspector = inspect(engine)
    columns = [col['name'] for col in inspector.get_columns(table_name)]
    return column_name in columns

def table_exists(engine, table_name: str) -> bool:
    """Check if a table exists."""
    inspector = inspect(engine)
    return table_name in inspector.get_table_names()

def run_migration():
    """Run the migration."""
    print(f"Connecting to database: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL}")
    
    if is_sqlite(DATABASE_URL):
        engine = create_engine(
            DATABASE_URL,
            connect_args={"check_same_thread": False}
        )
    else:
        engine = create_engine(DATABASE_URL)
    
    with engine.connect() as conn:
        # Start transaction
        trans = conn.begin()
        try:
            # Add upvotes column to profile_comments table
            if not column_exists(engine, 'profile_comments', 'upvotes'):
                print("Adding upvotes column to profile_comments table...")
                if is_sqlite(DATABASE_URL):
                    conn.execute(text("ALTER TABLE profile_comments ADD COLUMN upvotes INTEGER DEFAULT 0"))
                else:
                    conn.execute(text("ALTER TABLE profile_comments ADD COLUMN upvotes INTEGER DEFAULT 0"))
                print("✓ Added upvotes column")
            else:
                print("✓ upvotes column already exists")
            
            # Create comment_upvotes table
            if not table_exists(engine, 'comment_upvotes'):
                print("Creating comment_upvotes table...")
                if is_sqlite(DATABASE_URL):
                    conn.execute(text("""
                        CREATE TABLE comment_upvotes (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            comment_id INTEGER NOT NULL,
                            user_id INTEGER NOT NULL,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (comment_id) REFERENCES profile_comments(id),
                            FOREIGN KEY (user_id) REFERENCES users(id),
                            UNIQUE(comment_id, user_id)
                        )
                    """))
                else:
                    conn.execute(text("""
                        CREATE TABLE comment_upvotes (
                            id SERIAL PRIMARY KEY,
                            comment_id INTEGER NOT NULL,
                            user_id INTEGER NOT NULL,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (comment_id) REFERENCES profile_comments(id),
                            FOREIGN KEY (user_id) REFERENCES users(id),
                            UNIQUE(comment_id, user_id)
                        )
                    """))
                print("✓ Created comment_upvotes table")
            else:
                print("✓ comment_upvotes table already exists")
            
            # Commit transaction
            trans.commit()
            print("\n✓ Migration completed successfully!")
            
        except Exception as e:
            trans.rollback()
            print(f"\n✗ Migration failed: {e}")
            raise

if __name__ == "__main__":
    try:
        run_migration()
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)

