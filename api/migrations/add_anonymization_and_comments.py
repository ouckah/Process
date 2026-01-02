"""
Migration script to add anonymization fields to users table and create profile_comments table.
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
            # Add columns to users table
            if not column_exists(engine, 'users', 'display_name'):
                print("Adding display_name column to users table...")
                if is_sqlite(DATABASE_URL):
                    # SQLite doesn't support ALTER COLUMN, so we need to recreate the table
                    # This is a simplified approach - in production, you'd want a more robust migration
                    conn.execute(text("ALTER TABLE users ADD COLUMN display_name VARCHAR(100)"))
                else:
                    conn.execute(text("ALTER TABLE users ADD COLUMN display_name VARCHAR(100)"))
                print("✓ Added display_name column")
            else:
                print("✓ display_name column already exists")
            
            if not column_exists(engine, 'users', 'is_anonymous'):
                print("Adding is_anonymous column to users table...")
                if is_sqlite(DATABASE_URL):
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_anonymous BOOLEAN DEFAULT 0"))
                else:
                    conn.execute(text("ALTER TABLE users ADD COLUMN is_anonymous BOOLEAN DEFAULT FALSE"))
                print("✓ Added is_anonymous column")
            else:
                print("✓ is_anonymous column already exists")
            
            if not column_exists(engine, 'users', 'comments_enabled'):
                print("Adding comments_enabled column to users table...")
                if is_sqlite(DATABASE_URL):
                    conn.execute(text("ALTER TABLE users ADD COLUMN comments_enabled BOOLEAN DEFAULT 1"))
                else:
                    conn.execute(text("ALTER TABLE users ADD COLUMN comments_enabled BOOLEAN DEFAULT TRUE"))
                print("✓ Added comments_enabled column")
            else:
                print("✓ comments_enabled column already exists")
            
            # Create profile_comments table
            if not table_exists(engine, 'profile_comments'):
                print("Creating profile_comments table...")
                if is_sqlite(DATABASE_URL):
                    conn.execute(text("""
                        CREATE TABLE profile_comments (
                            id INTEGER PRIMARY KEY AUTOINCREMENT,
                            profile_user_id INTEGER NOT NULL,
                            author_id INTEGER,
                            author_display_name VARCHAR(100),
                            parent_comment_id INTEGER,
                            content VARCHAR(2000) NOT NULL,
                            is_question BOOLEAN DEFAULT 0,
                            is_answered BOOLEAN DEFAULT 0,
                            is_deleted BOOLEAN DEFAULT 0,
                            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (profile_user_id) REFERENCES users(id),
                            FOREIGN KEY (author_id) REFERENCES users(id),
                            FOREIGN KEY (parent_comment_id) REFERENCES profile_comments(id)
                        )
                    """))
                else:
                    conn.execute(text("""
                        CREATE TABLE profile_comments (
                            id SERIAL PRIMARY KEY,
                            profile_user_id INTEGER NOT NULL,
                            author_id INTEGER,
                            author_display_name VARCHAR(100),
                            parent_comment_id INTEGER,
                            content VARCHAR(2000) NOT NULL,
                            is_question BOOLEAN DEFAULT FALSE,
                            is_answered BOOLEAN DEFAULT FALSE,
                            is_deleted BOOLEAN DEFAULT FALSE,
                            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                            FOREIGN KEY (profile_user_id) REFERENCES users(id),
                            FOREIGN KEY (author_id) REFERENCES users(id),
                            FOREIGN KEY (parent_comment_id) REFERENCES profile_comments(id)
                        )
                    """))
                print("✓ Created profile_comments table")
            else:
                print("✓ profile_comments table already exists")
            
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

