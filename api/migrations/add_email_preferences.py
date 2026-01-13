"""
Migration script to add email preferences columns.
Run this script to add email notification preferences to your database.
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
    
    print("Running migration to add email preferences...")
    
    # Check if columns already exist
    from sqlalchemy import inspect
    inspector = inspect(engine)
    
    if 'users' not in inspector.get_table_names():
        print("✗ Users table does not exist. Please run database setup first.")
        return
    
    if 'notifications' not in inspector.get_table_names():
        print("✗ Notifications table does not exist. Please run add_notifications_table.py first.")
        return
    
    users_columns = [col['name'] for col in inspector.get_columns('users')]
    notifications_columns = [col['name'] for col in inspector.get_columns('notifications')]
    
    with engine.connect() as connection:
        # Add columns to users table
        if 'email_notifications_enabled' not in users_columns:
            connection.execute(text("""
                ALTER TABLE users 
                ADD COLUMN email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE
            """))
            print("✓ Added email_notifications_enabled column to users table")
        else:
            print("✓ email_notifications_enabled column already exists")
        
        if 'last_notification_email_sent_at' not in users_columns:
            connection.execute(text("""
                ALTER TABLE users 
                ADD COLUMN last_notification_email_sent_at TIMESTAMP
            """))
            print("✓ Added last_notification_email_sent_at column to users table")
        else:
            print("✓ last_notification_email_sent_at column already exists")
        
        # Add column to notifications table
        if 'email_sent' not in notifications_columns:
            connection.execute(text("""
                ALTER TABLE notifications 
                ADD COLUMN email_sent BOOLEAN NOT NULL DEFAULT FALSE
            """))
            print("✓ Added email_sent column to notifications table")
        else:
            print("✓ email_sent column already exists")
        
        connection.commit()
    
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()
