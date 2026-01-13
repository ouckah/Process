"""
Migration script to add CASCADE delete constraints to foreign keys.
This ensures:
- When a comment is deleted, replies are cascade deleted
- When a comment is deleted, upvotes are cascade deleted
- When a comment is deleted, notifications are cascade deleted
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
    
    print("Running migration to add CASCADE delete constraints...")
    
    with engine.connect() as connection:
        # Drop existing foreign key constraints and recreate with CASCADE
        # Note: PostgreSQL requires dropping and recreating constraints
        
        # 1. Update profile_comments.parent_comment_id to CASCADE
        print("Updating profile_comments.parent_comment_id foreign key...")
        try:
            # Find the constraint name first
            constraint_result = connection.execute(text("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'profile_comments' 
                AND constraint_type = 'FOREIGN KEY'
                AND constraint_name LIKE '%parent_comment%'
            """))
            constraint_name = None
            for row in constraint_result:
                constraint_name = row[0]
                break
            
            if constraint_name:
                connection.execute(text(f"""
                    ALTER TABLE profile_comments 
                    DROP CONSTRAINT {constraint_name}
                """))
                connection.execute(text("""
                    ALTER TABLE profile_comments 
                    ADD CONSTRAINT profile_comments_parent_comment_id_fkey 
                    FOREIGN KEY (parent_comment_id) 
                    REFERENCES profile_comments(id) 
                    ON DELETE CASCADE
                """))
                print("✓ Updated profile_comments.parent_comment_id foreign key")
            else:
                # Constraint doesn't exist, add it
                connection.execute(text("""
                    ALTER TABLE profile_comments 
                    ADD CONSTRAINT profile_comments_parent_comment_id_fkey 
                    FOREIGN KEY (parent_comment_id) 
                    REFERENCES profile_comments(id) 
                    ON DELETE CASCADE
                """))
                print("✓ Added profile_comments.parent_comment_id foreign key with CASCADE")
        except Exception as e:
            print(f"⚠️  Could not update profile_comments.parent_comment_id: {e}")
        
        # 2. Update comment_upvotes.comment_id to CASCADE
        print("Updating comment_upvotes.comment_id foreign key...")
        try:
            # Find the constraint name first
            constraint_result = connection.execute(text("""
                SELECT constraint_name 
                FROM information_schema.table_constraints 
                WHERE table_name = 'comment_upvotes' 
                AND constraint_type = 'FOREIGN KEY'
                AND constraint_name LIKE '%comment_id%'
            """))
            constraint_name = None
            for row in constraint_result:
                constraint_name = row[0]
                break
            
            if constraint_name:
                connection.execute(text(f"""
                    ALTER TABLE comment_upvotes 
                    DROP CONSTRAINT {constraint_name}
                """))
                connection.execute(text("""
                    ALTER TABLE comment_upvotes 
                    ADD CONSTRAINT comment_upvotes_comment_id_fkey 
                    FOREIGN KEY (comment_id) 
                    REFERENCES profile_comments(id) 
                    ON DELETE CASCADE
                """))
                print("✓ Updated comment_upvotes.comment_id foreign key")
            else:
                # Constraint doesn't exist, add it
                connection.execute(text("""
                    ALTER TABLE comment_upvotes 
                    ADD CONSTRAINT comment_upvotes_comment_id_fkey 
                    FOREIGN KEY (comment_id) 
                    REFERENCES profile_comments(id) 
                    ON DELETE CASCADE
                """))
                print("✓ Added comment_upvotes.comment_id foreign key with CASCADE")
        except Exception as e:
            print(f"⚠️  Could not update comment_upvotes.comment_id: {e}")
        
        # 3. Update notifications.comment_id to CASCADE (should already have it, but verify)
        print("Verifying notifications.comment_id foreign key has CASCADE...")
        try:
            # Check if constraint already has CASCADE
            constraint_result = connection.execute(text("""
                SELECT constraint_name, delete_rule
                FROM information_schema.table_constraints tc
                JOIN information_schema.referential_constraints rc 
                    ON tc.constraint_name = rc.constraint_name
                WHERE tc.table_name = 'notifications' 
                AND tc.constraint_type = 'FOREIGN KEY'
                AND tc.constraint_name LIKE '%comment_id%'
            """))
            has_cascade = False
            constraint_name = None
            for row in constraint_result:
                constraint_name = row[0]
                if row[1] == 'CASCADE':
                    has_cascade = True
                break
            
            if has_cascade:
                print("✓ notifications.comment_id already has CASCADE")
            elif constraint_name:
                # Update to CASCADE
                connection.execute(text(f"""
                    ALTER TABLE notifications 
                    DROP CONSTRAINT {constraint_name}
                """))
                connection.execute(text("""
                    ALTER TABLE notifications 
                    ADD CONSTRAINT notifications_comment_id_fkey 
                    FOREIGN KEY (comment_id) 
                    REFERENCES profile_comments(id) 
                    ON DELETE CASCADE
                """))
                print("✓ Updated notifications.comment_id foreign key to CASCADE")
            else:
                # Constraint doesn't exist, add it
                connection.execute(text("""
                    ALTER TABLE notifications 
                    ADD CONSTRAINT notifications_comment_id_fkey 
                    FOREIGN KEY (comment_id) 
                    REFERENCES profile_comments(id) 
                    ON DELETE CASCADE
                """))
                print("✓ Added notifications.comment_id foreign key with CASCADE")
        except Exception as e:
            print(f"⚠️  Could not update notifications.comment_id: {e}")
        
        connection.commit()
    
    print("Migration complete!")

if __name__ == "__main__":
    run_migration()
