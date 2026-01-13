"""
Migration script to add discord_avatar column to users table.
Run this script to update your database schema.
"""
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required")

def run_migration():
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    print("Running migration to add discord_avatar column...")
    
    # Check if column already exists
    from sqlalchemy import inspect
    inspector = inspect(engine)
    
    if 'users' not in inspector.get_table_names():
        print("✗ Users table does not exist. Please run database setup first.")
        return
    
    users_columns = [col['name'] for col in inspector.get_columns('users')]
    
    with engine.connect() as connection:
        # Add column to users table
        if 'discord_avatar' not in users_columns:
            connection.execute(text("""
                ALTER TABLE users 
                ADD COLUMN discord_avatar VARCHAR
            """))
            print("✓ Added discord_avatar column to users table")
        else:
            print("✓ discord_avatar column already exists")
        
        connection.commit()
    
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()

