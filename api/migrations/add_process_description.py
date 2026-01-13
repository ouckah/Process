"""
Migration script to add description column to processes table.
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
    
    print("Running migration to add description column to processes table...")
    
    # Check if column already exists
    from sqlalchemy import inspect
    inspector = inspect(engine)
    
    if 'processes' not in inspector.get_table_names():
        print("✗ Processes table does not exist. Please run database setup first.")
        return
    
    processes_columns = [col['name'] for col in inspector.get_columns('processes')]
    
    with engine.connect() as connection:
        # Add column to processes table
        if 'description' not in processes_columns:
            connection.execute(text("""
                ALTER TABLE processes 
                ADD COLUMN description TEXT
            """))
            print("✓ Added description column to processes table")
        else:
            print("✓ description column already exists")
        
        connection.commit()
    
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()
