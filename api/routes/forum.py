"""
Forum routes for community discussions.
"""
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, desc
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import User, ForumThread, ForumReply, ForumReplyUpvote
from schemas import (
    ForumThreadCreate,
    ForumThreadUpdate,
    ForumThreadResponse,
    ForumReplyCreate,
    ForumReplyUpdate,
    ForumReplyResponse,
)
from auth import get_current_user, get_current_user_optional
from rate_limiter import limiter

router = APIRouter(prefix="/api/forum", tags=["forum"])


def build_reply_response(reply: ForumReply, db: Session, current_user_id: Optional[int] = None) -> ForumReplyResponse:
    """Build a ForumReplyResponse with nested replies."""
    # Get author display info
    author_username = None
    author_display_name = None
    author_discord_avatar = None
    author_discord_id = None
    
    if reply.author_id:
        author = db.query(User).filter(User.id == reply.author_id).first()
        if author:
            if author.is_anonymous:
                author_display_name = author.display_name or "Anonymous User"
            else:
                author_username = author.username
                author_display_name = author.display_name or author.username
                author_discord_avatar = author.discord_avatar
                author_discord_id = author.discord_id
    else:
        # Anonymous reply
        author_display_name = reply.author_display_name or "Anonymous User"
    
    # Check if current user has upvoted
    user_has_upvoted = False
    if current_user_id:
        upvote = db.query(ForumReplyUpvote).filter(
            ForumReplyUpvote.reply_id == reply.id,
            ForumReplyUpvote.user_id == current_user_id
        ).first()
        user_has_upvoted = upvote is not None
    
    # Get nested replies
    nested_replies = db.query(ForumReply).filter(
        ForumReply.parent_reply_id == reply.id,
        ForumReply.is_deleted == False
    ).order_by(ForumReply.created_at.asc()).all()
    
    nested_responses = [build_reply_response(nr, db, current_user_id) for nr in nested_replies]
    
    return ForumReplyResponse(
        id=reply.id,
        thread_id=reply.thread_id,
        author_id=reply.author_id,
        author_display_name=author_display_name,
        author_username=author_username,
        author_discord_avatar=author_discord_avatar,
        author_discord_id=author_discord_id,
        content=reply.content,
        parent_reply_id=reply.parent_reply_id,
        is_deleted=reply.is_deleted,
        upvotes=reply.upvotes or 0,
        user_has_upvoted=user_has_upvoted,
        created_at=reply.created_at.isoformat(),
        updated_at=reply.updated_at.isoformat(),
        nested_replies=nested_responses
    )


def build_thread_response(thread: ForumThread, db: Session, current_user_id: Optional[int] = None) -> ForumThreadResponse:
    """Build a ForumThreadResponse with replies."""
    # Get author display info
    author_username = None
    author_display_name = None
    author_discord_avatar = None
    author_discord_id = None
    
    if thread.author_id:
        author = db.query(User).filter(User.id == thread.author_id).first()
        if author:
            if author.is_anonymous:
                author_display_name = author.display_name or "Anonymous User"
            else:
                author_username = author.username
                author_display_name = author.display_name or author.username
                author_discord_avatar = author.discord_avatar
                author_discord_id = author.discord_id
    else:
        # Anonymous thread
        author_display_name = thread.author_display_name or "Anonymous User"
    
    # Get top-level replies (no parent)
    top_replies = db.query(ForumReply).filter(
        ForumReply.thread_id == thread.id,
        ForumReply.parent_reply_id.is_(None),
        ForumReply.is_deleted == False
    ).order_by(ForumReply.created_at.asc()).all()
    
    reply_responses = [build_reply_response(reply, db, current_user_id) for reply in top_replies]
    
    return ForumThreadResponse(
        id=thread.id,
        title=thread.title,
        content=thread.content,
        author_id=thread.author_id,
        author_display_name=author_display_name,
        author_username=author_username,
        author_discord_avatar=author_discord_avatar,
        author_discord_id=author_discord_id,
        category=thread.category,
        related_company=thread.related_company,
        related_stage=thread.related_stage,
        is_pinned=thread.is_pinned,
        is_locked=thread.is_locked,
        view_count=thread.view_count or 0,
        reply_count=thread.reply_count or 0,
        created_at=thread.created_at.isoformat(),
        updated_at=thread.updated_at.isoformat(),
        last_reply_at=thread.last_reply_at.isoformat() if thread.last_reply_at else None,
        replies=reply_responses
    )


@router.get("/threads", response_model=List[ForumThreadResponse])
@limiter.limit("60/minute")
def get_forum_threads(
    request: Request,
    category: Optional[str] = Query(None, description="Filter by category"),
    company: Optional[str] = Query(None, description="Filter by related company"),
    stage: Optional[str] = Query(None, description="Filter by related stage"),
    sort: str = Query("newest", description="Sort by: newest, most_replies, most_views"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    List forum threads with pagination, sorting, and filtering.
    """
    query = db.query(ForumThread).filter(ForumThread.is_deleted == False)
    
    # Apply filters
    if category:
        query = query.filter(ForumThread.category == category)
    if company:
        query = query.filter(ForumThread.related_company.ilike(f"%{company}%"))
    if stage:
        query = query.filter(ForumThread.related_stage.ilike(f"%{stage}%"))
    
    # Apply sorting
    if sort == "newest":
        query = query.order_by(desc(ForumThread.created_at))
    elif sort == "most_replies":
        query = query.order_by(desc(ForumThread.reply_count), desc(ForumThread.created_at))
    elif sort == "most_views":
        query = query.order_by(desc(ForumThread.view_count), desc(ForumThread.created_at))
    else:
        # Default: pinned first, then by newest
        query = query.order_by(desc(ForumThread.is_pinned), desc(ForumThread.created_at))
    
    # Apply pagination
    offset = (page - 1) * limit
    threads = query.offset(offset).limit(limit).all()
    
    current_user_id = current_user.id if current_user else None
    return [build_thread_response(thread, db, current_user_id) for thread in threads]


@router.post("/threads", response_model=ForumThreadResponse, status_code=201)
@limiter.limit("10/minute")
def create_forum_thread(
    request: Request,
    thread_data: ForumThreadCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Create a new forum thread.
    Authentication optional (supports anonymous posting).
    """
    # If authenticated, use user info; otherwise require display_name
    author_id = current_user.id if current_user else None
    author_display_name = None
    
    if not author_id:
        if not thread_data.author_display_name:
            raise HTTPException(status_code=400, detail="author_display_name is required for anonymous posts")
        author_display_name = thread_data.author_display_name
    elif current_user and current_user.is_anonymous:
        author_display_name = current_user.display_name
    
    thread = ForumThread(
        title=thread_data.title,
        content=thread_data.content,
        author_id=author_id,
        author_display_name=author_display_name,
        category=thread_data.category,
        related_company=thread_data.related_company,
        related_stage=thread_data.related_stage,
    )
    
    db.add(thread)
    db.commit()
    db.refresh(thread)
    
    current_user_id = current_user.id if current_user else None
    return build_thread_response(thread, db, current_user_id)


@router.get("/threads/{thread_id}", response_model=ForumThreadResponse)
@limiter.limit("60/minute")
def get_forum_thread(
    request: Request,
    thread_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get a forum thread with all replies.
    Increments view count.
    """
    thread = db.query(ForumThread).filter(
        ForumThread.id == thread_id,
        ForumThread.is_deleted == False
    ).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Increment view count
    thread.view_count = (thread.view_count or 0) + 1
    db.commit()
    db.refresh(thread)
    
    current_user_id = current_user.id if current_user else None
    return build_thread_response(thread, db, current_user_id)


@router.patch("/threads/{thread_id}", response_model=ForumThreadResponse)
@limiter.limit("20/minute")
def update_forum_thread(
    request: Request,
    thread_id: int,
    thread_data: ForumThreadUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a forum thread (author only).
    """
    thread = db.query(ForumThread).filter(
        ForumThread.id == thread_id,
        ForumThread.is_deleted == False
    ).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Check authorization
    if thread.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this thread")
    
    # Update fields
    if thread_data.title is not None:
        thread.title = thread_data.title
    if thread_data.content is not None:
        thread.content = thread_data.content
    
    thread.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(thread)
    
    return build_thread_response(thread, db, current_user.id)


@router.delete("/threads/{thread_id}", status_code=204)
@limiter.limit("10/minute")
def delete_forum_thread(
    request: Request,
    thread_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft delete a forum thread (author only).
    """
    thread = db.query(ForumThread).filter(
        ForumThread.id == thread_id,
        ForumThread.is_deleted == False
    ).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    # Check authorization
    if thread.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this thread")
    
    thread.is_deleted = True
    thread.updated_at = datetime.utcnow()
    db.commit()
    
    return None


@router.post("/threads/{thread_id}/replies", response_model=ForumReplyResponse, status_code=201)
@limiter.limit("20/minute")
def create_forum_reply(
    request: Request,
    thread_id: int,
    reply_data: ForumReplyCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Add a reply to a forum thread.
    Authentication optional (supports anonymous posting).
    """
    thread = db.query(ForumThread).filter(
        ForumThread.id == thread_id,
        ForumThread.is_deleted == False
    ).first()
    
    if not thread:
        raise HTTPException(status_code=404, detail="Thread not found")
    
    if thread.is_locked:
        raise HTTPException(status_code=400, detail="Thread is locked")
    
    # If authenticated, use user info; otherwise require display_name
    author_id = current_user.id if current_user else None
    author_display_name = None
    
    if not author_id:
        if not reply_data.author_display_name:
            raise HTTPException(status_code=400, detail="author_display_name is required for anonymous posts")
        author_display_name = reply_data.author_display_name
    elif current_user and current_user.is_anonymous:
        author_display_name = current_user.display_name
    
    reply = ForumReply(
        thread_id=thread_id,
        author_id=author_id,
        author_display_name=author_display_name,
        content=reply_data.content,
        parent_reply_id=reply_data.parent_reply_id,
    )
    
    db.add(reply)
    
    # Update thread reply count and last_reply_at
    thread.reply_count = (thread.reply_count or 0) + 1
    thread.last_reply_at = datetime.utcnow()
    thread.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(reply)
    
    current_user_id = current_user.id if current_user else None
    return build_reply_response(reply, db, current_user_id)


@router.patch("/replies/{reply_id}", response_model=ForumReplyResponse)
@limiter.limit("20/minute")
def update_forum_reply(
    request: Request,
    reply_id: int,
    reply_data: ForumReplyUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a forum reply (author only).
    """
    reply = db.query(ForumReply).filter(
        ForumReply.id == reply_id,
        ForumReply.is_deleted == False
    ).first()
    
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    # Check authorization
    if reply.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to update this reply")
    
    # Update content
    if reply_data.content is not None:
        reply.content = reply_data.content
    
    reply.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(reply)
    
    return build_reply_response(reply, db, current_user.id)


@router.delete("/replies/{reply_id}", status_code=204)
@limiter.limit("10/minute")
def delete_forum_reply(
    request: Request,
    reply_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Soft delete a forum reply (author only).
    """
    reply = db.query(ForumReply).filter(
        ForumReply.id == reply_id,
        ForumReply.is_deleted == False
    ).first()
    
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    # Check authorization
    if reply.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this reply")
    
    reply.is_deleted = True
    reply.updated_at = datetime.utcnow()
    
    # Update thread reply count
    thread = db.query(ForumThread).filter(ForumThread.id == reply.thread_id).first()
    if thread:
        thread.reply_count = max(0, (thread.reply_count or 0) - 1)
        thread.updated_at = datetime.utcnow()
    
    db.commit()
    
    return None


@router.post("/replies/{reply_id}/upvote", status_code=201)
@limiter.limit("30/minute")
def upvote_forum_reply(
    request: Request,
    reply_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upvote a forum reply.
    """
    reply = db.query(ForumReply).filter(
        ForumReply.id == reply_id,
        ForumReply.is_deleted == False
    ).first()
    
    if not reply:
        raise HTTPException(status_code=404, detail="Reply not found")
    
    # Check if already upvoted
    existing = db.query(ForumReplyUpvote).filter(
        ForumReplyUpvote.reply_id == reply_id,
        ForumReplyUpvote.user_id == current_user.id
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="Already upvoted")
    
    # Create upvote
    upvote = ForumReplyUpvote(
        reply_id=reply_id,
        user_id=current_user.id
    )
    db.add(upvote)
    
    # Update reply upvote count
    reply.upvotes = (reply.upvotes or 0) + 1
    db.commit()
    
    return {"message": "Upvoted successfully"}


@router.delete("/replies/{reply_id}/upvote", status_code=204)
@limiter.limit("30/minute")
def remove_forum_reply_upvote(
    request: Request,
    reply_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Remove upvote from a forum reply.
    """
    upvote = db.query(ForumReplyUpvote).filter(
        ForumReplyUpvote.reply_id == reply_id,
        ForumReplyUpvote.user_id == current_user.id
    ).first()
    
    if not upvote:
        raise HTTPException(status_code=404, detail="Upvote not found")
    
    # Remove upvote
    db.delete(upvote)
    
    # Update reply upvote count
    reply = db.query(ForumReply).filter(ForumReply.id == reply_id).first()
    if reply:
        reply.upvotes = max(0, (reply.upvotes or 0) - 1)
    
    db.commit()
    
    return None
