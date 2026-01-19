"""
Forum cleanup script for removing spam posts.

Usage:
    # Dry run (preview what will be deleted)
    python scripts/cleanup_forum.py --dry-run
    
    # Delete by author username
    python scripts/cleanup_forum.py --author-username spammer123
    
    # Delete by author display name (for anonymous users)
    python scripts/cleanup_forum.py --author-display-name "Spam Bot"
    
    # Delete by content pattern
    python scripts/cleanup_forum.py --content-contains "spam text"
    
    # Delete by date range (older than X hours)
    python scripts/cleanup_forum.py --older-than-hours 24
    
    # Delete duplicates (same user, same title/content within 1 hour)
    python scripts/cleanup_forum.py --delete-duplicates
    
    # Combine multiple criteria
    python scripts/cleanup_forum.py --author-username spammer123 --older-than-hours 24
"""
import os
import sys
import argparse
from datetime import datetime, timedelta
from typing import List, Optional

# Add parent directory to path so we can import from api
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import SessionLocal
from models import ForumThread, ForumReply, ForumReplyUpvote, User
from sqlalchemy import or_, and_
from sqlalchemy.orm import joinedload

# Load environment variables
from dotenv import load_dotenv
load_dotenv()


def delete_threads(
    db: SessionLocal,
    threads: List[ForumThread],
    dry_run: bool = True
) -> int:
    """Delete forum threads and their replies. Returns count of deleted threads."""
    deleted_count = 0
    
        for thread in threads:
        # Get author info
        author_name = thread.author_display_name or "Anonymous"
        if thread.author_id:
            author = db.query(User).filter(User.id == thread.author_id).first()
            if author:
                author_name = author.username or author.display_name or author_name
        
        if dry_run:
            print(f"[DRY RUN] Would delete thread #{thread.id}: '{thread.title}' by {author_name}")
        else:
            # Delete all replies (cascade should handle this, but we'll do it explicitly)
            replies = db.query(ForumReply).filter(ForumReply.thread_id == thread.id).all()
            for reply in replies:
                # Delete upvotes first
                db.query(ForumReplyUpvote).filter(ForumReplyUpvote.reply_id == reply.id).delete()
                db.delete(reply)
            
            # Delete thread
            db.delete(thread)
            deleted_count += 1
    
    if not dry_run:
        db.commit()
        print(f"✓ Deleted {deleted_count} thread(s)")
    
    return deleted_count if not dry_run else 0


def delete_replies(
    db: SessionLocal,
    replies: List[ForumReply],
    dry_run: bool = True
) -> int:
    """Delete forum replies. Returns count of deleted replies."""
    deleted_count = 0
    
        for reply in replies:
        # Get author info
        author_name = reply.author_display_name or "Anonymous"
        if reply.author_id:
            author = db.query(User).filter(User.id == reply.author_id).first()
            if author:
                author_name = author.username or author.display_name or author_name
        
        if dry_run:
            thread = db.query(ForumThread).filter(ForumThread.id == reply.thread_id).first()
            thread_title = thread.title if thread else f"Thread #{reply.thread_id}"
            print(f"[DRY RUN] Would delete reply #{reply.id} in thread '{thread_title}' by {author_name}")
        else:
            # Delete upvotes first
            db.query(ForumReplyUpvote).filter(ForumReplyUpvote.reply_id == reply.id).delete()
            # Update thread reply count
            thread = db.query(ForumThread).filter(ForumThread.id == reply.thread_id).first()
            if thread:
                thread.reply_count = max(0, (thread.reply_count or 0) - 1)
            db.delete(reply)
            deleted_count += 1
    
    if not dry_run:
        db.commit()
        print(f"✓ Deleted {deleted_count} reply/replies")
    
    return deleted_count if not dry_run else 0


def find_duplicate_threads(db: SessionLocal, hours: int = 1) -> List[ForumThread]:
    """Find duplicate threads (same user, same title/content within time window)."""
    cutoff = datetime.utcnow() - timedelta(hours=hours)
    duplicates = []
    
    # Get all threads created after cutoff
    recent_threads = db.query(ForumThread).filter(
        ForumThread.created_at >= cutoff,
        ForumThread.is_deleted == False
    ).order_by(ForumThread.created_at).all()
    
    # Group by (author_id or author_display_name, title, content)
    seen = {}
    for thread in recent_threads:
        key = (
            thread.author_id or f"anon_{thread.author_display_name}",
            thread.title.strip().lower(),
            thread.content.strip().lower()
        )
        
        if key in seen:
            # This is a duplicate - keep all but the first one
            duplicates.append(thread)
        else:
            seen[key] = thread
    
    return duplicates


def main():
    parser = argparse.ArgumentParser(description="Cleanup spam forum posts")
    parser.add_argument("--dry-run", action="store_true", help="Preview what will be deleted without actually deleting")
    parser.add_argument("--author-username", type=str, help="Delete posts by username")
    parser.add_argument("--author-display-name", type=str, help="Delete posts by display name (for anonymous users)")
    parser.add_argument("--content-contains", type=str, help="Delete posts containing this text")
    parser.add_argument("--older-than-hours", type=int, help="Delete posts older than X hours")
    parser.add_argument("--delete-duplicates", action="store_true", help="Delete duplicate posts (same user, same content within 1 hour)")
    parser.add_argument("--threads-only", action="store_true", help="Only delete threads (not replies)")
    parser.add_argument("--replies-only", action="store_true", help="Only delete replies (not threads)")
    
    args = parser.parse_args()
    
    if not any([args.author_username, args.author_display_name, args.content_contains, 
                args.older_than_hours, args.delete_duplicates]):
        parser.print_help()
        print("\n❌ Please specify at least one cleanup criterion.")
        sys.exit(1)
    
    db = SessionLocal()
    
    try:
        mode = "DRY RUN" if args.dry_run else "DELETE"
        print(f"\n{'='*60}")
        print(f"Forum Cleanup - {mode}")
        print(f"{'='*60}\n")
        
        threads_to_delete = []
        replies_to_delete = []
        
        # Find threads to delete
        if not args.replies_only:
            thread_query = db.query(ForumThread).filter(ForumThread.is_deleted == False)
            
            if args.author_username:
                user = db.query(User).filter(User.username == args.author_username).first()
                if user:
                    thread_query = thread_query.filter(ForumThread.author_id == user.id)
                    print(f"Filtering threads by author username: {args.author_username} (user_id: {user.id})")
                else:
                    print(f"⚠️  User '{args.author_username}' not found")
            
            if args.author_display_name:
                thread_query = thread_query.filter(ForumThread.author_display_name == args.author_display_name)
                print(f"Filtering threads by display name: {args.author_display_name}")
            
            if args.content_contains:
                thread_query = thread_query.filter(
                    or_(
                        ForumThread.title.ilike(f"%{args.content_contains}%"),
                        ForumThread.content.ilike(f"%{args.content_contains}%")
                    )
                )
                print(f"Filtering threads containing: '{args.content_contains}'")
            
            if args.older_than_hours:
                cutoff = datetime.utcnow() - timedelta(hours=args.older_than_hours)
                thread_query = thread_query.filter(ForumThread.created_at < cutoff)
                print(f"Filtering threads older than: {args.older_than_hours} hours (before {cutoff.isoformat()})")
            
            threads_to_delete = thread_query.all()
            
            # Handle duplicates
            if args.delete_duplicates:
                duplicate_threads = find_duplicate_threads(db, hours=1)
                threads_to_delete.extend(duplicate_threads)
                # Remove duplicates from list
                threads_to_delete = list({t.id: t for t in threads_to_delete}.values())
                print(f"Found {len(duplicate_threads)} duplicate thread(s)")
        
        # Find replies to delete
        if not args.threads_only:
            reply_query = db.query(ForumReply).filter(ForumReply.is_deleted == False)
            
            if args.author_username:
                user = db.query(User).filter(User.username == args.author_username).first()
                if user:
                    reply_query = reply_query.filter(ForumReply.author_id == user.id)
                else:
                    # Already printed warning above
                    pass
            
            if args.author_display_name:
                reply_query = reply_query.filter(ForumReply.author_display_name == args.author_display_name)
            
            if args.content_contains:
                reply_query = reply_query.filter(ForumReply.content.ilike(f"%{args.content_contains}%"))
            
            if args.older_than_hours:
                cutoff = datetime.utcnow() - timedelta(hours=args.older_than_hours)
                reply_query = reply_query.filter(ForumReply.created_at < cutoff)
            
            replies_to_delete = reply_query.all()
        
        # Summary
        print(f"\n{'='*60}")
        print(f"Summary:")
        print(f"  Threads to delete: {len(threads_to_delete)}")
        print(f"  Replies to delete: {len(replies_to_delete)}")
        print(f"{'='*60}\n")
        
        if not threads_to_delete and not replies_to_delete:
            print("✅ No posts found matching criteria.")
            return
        
        # Show preview
        if threads_to_delete:
            print(f"\nThreads to delete ({len(threads_to_delete)}):")
            for thread in threads_to_delete[:10]:  # Show first 10
                author_name = thread.author_display_name or "Anonymous"
                if thread.author_id:
                    author = db.query(User).filter(User.id == thread.author_id).first()
                    if author:
                        author_name = author.username or author.display_name or author_name
                print(f"  - #{thread.id}: '{thread.title[:50]}...' by {author_name} ({thread.created_at})")
            if len(threads_to_delete) > 10:
                print(f"  ... and {len(threads_to_delete) - 10} more")
        
        if replies_to_delete:
            print(f"\nReplies to delete ({len(replies_to_delete)}):")
            for reply in replies_to_delete[:10]:  # Show first 10
                author_name = reply.author_display_name or "Anonymous"
                if reply.author_id:
                    author = db.query(User).filter(User.id == reply.author_id).first()
                    if author:
                        author_name = author.username or author.display_name or author_name
                print(f"  - Reply #{reply.id} in thread #{reply.thread_id} by {author_name} ({reply.created_at})")
            if len(replies_to_delete) > 10:
                print(f"  ... and {len(replies_to_delete) - 10} more")
        
        # Confirm if not dry run
        if not args.dry_run:
            print(f"\n⚠️  WARNING: This will permanently delete {len(threads_to_delete)} thread(s) and {len(replies_to_delete)} reply/replies!")
            response = input("Type 'DELETE' to confirm: ")
            if response != "DELETE":
                print("❌ Aborted.")
                return
        
        # Delete
        deleted_threads = 0
        deleted_replies = 0
        
        if threads_to_delete:
            deleted_threads = delete_threads(db, threads_to_delete, dry_run=args.dry_run)
        
        if replies_to_delete:
            deleted_replies = delete_replies(db, replies_to_delete, dry_run=args.dry_run)
        
        if args.dry_run:
            print(f"\n✅ DRY RUN complete. Use without --dry-run to actually delete.")
        else:
            print(f"\n✅ Cleanup complete!")
            print(f"   Deleted {deleted_threads} thread(s)")
            print(f"   Deleted {deleted_replies} reply/replies")
    
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        db.rollback()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
