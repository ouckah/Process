"""
Run all migrations in order.
This script runs all migration files in the correct sequence.
"""
import sys
import os
from pathlib import Path

# Get the directory where this script is located
SCRIPT_DIR = Path(__file__).parent.absolute()
# Get the api directory (parent of migrations)
API_DIR = SCRIPT_DIR.parent.absolute()

# Add api directory to path so we can import migration modules
if str(API_DIR) not in sys.path:
    sys.path.insert(0, str(API_DIR))

# Change to api directory to ensure relative imports work
os.chdir(API_DIR)

# Migration order - run in this sequence
MIGRATIONS = [
    "add_notifications_table",
    "add_forum_tables",
    "add_discord_avatar_column",
    "add_email_preferences",
    "add_cascade_deletes",
    "add_process_description",
]

def run_all_migrations():
    """Run all migrations in order."""
    print("=" * 60)
    print("Running Database Migrations")
    print("=" * 60)
    print(f"Working directory: {os.getcwd()}")
    print(f"API directory: {API_DIR}")
    print("=" * 60)
    
    for migration_name in MIGRATIONS:
        print(f"\n📦 Running migration: {migration_name}")
        print("-" * 60)
        
        try:
            # Import and run the migration
            # Try importing from migrations package first (when run from api/ directory)
            try:
                module = __import__(f"migrations.{migration_name}", fromlist=["run_migration"])
            except ImportError:
                # Fallback: import directly (when run from migrations/ directory)
                module = __import__(migration_name, fromlist=["run_migration"])
            
            module.run_migration()
            print(f"✓ {migration_name} completed successfully")
        except Exception as e:
            import traceback
            print(f"✗ {migration_name} failed: {e}")
            print("\nFull error traceback:")
            traceback.print_exc()
            print("\n⚠️  Migration failed. Please check the error above.")
            sys.exit(1)
    
    print("\n" + "=" * 60)
    print("✅ All migrations completed successfully!")
    print("=" * 60)

if __name__ == "__main__":
    run_all_migrations()
