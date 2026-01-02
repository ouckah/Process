"""
Profile comment routes for user interactions on public profiles.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import urllib.parse

from database import get_db
from models import User, ProfileComment, CommentUpvote
from schemas import ProfileCommentCreate, ProfileCommentUpdate, ProfileCommentResponse
from auth import get_current_user, get_user_by_username, get_current_user_optional

router = APIRouter(prefix="/api/profiles", tags=["comments"])


def get_profile_user(username: str, db: Session) -> User:
    """Get user by username, raising 404 if not found."""
    username = urllib.parse.unquote(username)
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")
    return user


def build_comment_response(comment: ProfileComment, db: Session, current_user_id: Optional[int] = None) -> ProfileCommentResponse:
    """Build a ProfileCommentResponse with nested replies."""
    # Get author display info
    author_username = None
    author_display_name = None
    
    if comment.author_id:
        author = db.query(User).filter(User.id == comment.author_id).first()
        if author:
            if author.is_anonymous:
                author_display_name = author.display_name or "Anonymous User"
            else:
                author_username = author.username
                author_display_name = author.display_name or author.username
    else:
        # Anonymous comment
        author_display_name = comment.author_display_name or "Anonymous User"
    
    # Check if current user has upvoted
    user_has_upvoted = False
    if current_user_id:
        upvote = db.query(CommentUpvote).filter(
            CommentUpvote.comment_id == comment.id,
            CommentUpvote.user_id == current_user_id
        ).first()
        user_has_upvoted = upvote is not None
    
    # Get replies
    replies = db.query(ProfileComment).filter(
        ProfileComment.parent_comment_id == comment.id,
        ProfileComment.is_deleted == False
    ).order_by(ProfileComment.created_at.asc()).all()
    
    reply_responses = [build_comment_response(reply, db, current_user_id) for reply in replies]
    
    return ProfileCommentResponse(
        id=comment.id,
        profile_user_id=comment.profile_user_id,
        author_id=comment.author_id,
        author_display_name=author_display_name,
        author_username=author_username,
        parent_comment_id=comment.parent_comment_id,
        content=comment.content,
        is_question=comment.is_question,
        is_answered=comment.is_answered,
        upvotes=comment.upvotes or 0,
        user_has_upvoted=user_has_upvoted,
        created_at=comment.created_at.isoformat(),
        updated_at=comment.updated_at.isoformat(),
        replies=reply_responses
    )


@router.get("/{username}/comments", response_model=List[ProfileCommentResponse])
def get_profile_comments(
    username: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Get all comments/questions for a user's public profile.
    No authentication required.
    Returns threaded comments (parent-child relationships), sorted by upvotes (descending).
    """
    profile_user = get_profile_user(username, db)
    
    # Get top-level comments (no parent), sorted by upvotes descending, then by creation date descending
    comments = db.query(ProfileComment).filter(
        ProfileComment.profile_user_id == profile_user.id,
        ProfileComment.parent_comment_id.is_(None),
        ProfileComment.is_deleted == False
    ).order_by(ProfileComment.upvotes.desc(), ProfileComment.created_at.desc()).all()
    
    current_user_id = current_user.id if current_user else None
    return [build_comment_response(comment, db, current_user_id) for comment in comments]


@router.post("/{username}/comments", response_model=ProfileCommentResponse, status_code=201)
def create_profile_comment(
    username: str,
    comment_data: ProfileCommentCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Create a comment or question on a user's public profile.
    Requires authentication, but can post anonymously.
    """
    profile_user = get_profile_user(username, db)
    
    # Check if comments are enabled
    if not profile_user.comments_enabled:
        raise HTTPException(
            status_code=403,
            detail="Comments are disabled for this profile"
        )
    
    # Validate authentication
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to post comments"
        )
    
    # Validate parent comment exists if provided
    if comment_data.parent_comment_id:
        parent = db.query(ProfileComment).filter(
            ProfileComment.id == comment_data.parent_comment_id,
            ProfileComment.profile_user_id == profile_user.id,
            ProfileComment.is_deleted == False
        ).first()
        if not parent:
            raise HTTPException(
                status_code=404,
                detail="Parent comment not found"
            )
    
    # Determine author info
    author_id = None
    author_display_name = None
    
    # Check if posting anonymously
    if comment_data.author_display_name:
        # Posting anonymously - require display name
        author_display_name = comment_data.author_display_name.strip()
        if not author_display_name:
            raise HTTPException(
                status_code=400,
                detail="Display name is required for anonymous comments"
            )
    else:
        # Posting as authenticated user
        author_id = current_user.id
        if current_user.is_anonymous:
            author_display_name = current_user.display_name or "Anonymous User"
        else:
            author_display_name = current_user.display_name or current_user.username
    
    # Create comment
    new_comment = ProfileComment(
        profile_user_id=profile_user.id,
        author_id=author_id,
        author_display_name=author_display_name if not author_id else None,
        parent_comment_id=comment_data.parent_comment_id,
        content=comment_data.content,
        is_question=comment_data.is_question
    )
    
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    
    return build_comment_response(new_comment, db, current_user.id)


@router.patch("/{username}/comments/{comment_id}", response_model=ProfileCommentResponse)
def update_profile_comment(
    username: str,
    comment_id: int,
    comment_data: ProfileCommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a comment (author only).
    """
    profile_user = get_profile_user(username, db)
    
    comment = db.query(ProfileComment).filter(
        ProfileComment.id == comment_id,
        ProfileComment.profile_user_id == profile_user.id,
        ProfileComment.is_deleted == False
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user is the author
    if comment.author_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You can only edit your own comments"
        )
    
    # Anonymous comments cannot be edited
    if comment.author_id is None:
        raise HTTPException(
            status_code=403,
            detail="Anonymous comments cannot be edited"
        )
    
    # Update comment
    if comment_data.content is not None:
        comment.content = comment_data.content
    
    db.commit()
    db.refresh(comment)
    
    return build_comment_response(comment, db, current_user.id)


@router.delete("/{username}/comments/{comment_id}", status_code=204)
def delete_profile_comment(
    username: str,
    comment_id: int,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Delete a comment.
    Author can delete own comment, profile owner can delete any comment on their profile.
    """
    profile_user = get_profile_user(username, db)
    
    comment = db.query(ProfileComment).filter(
        ProfileComment.id == comment_id,
        ProfileComment.profile_user_id == profile_user.id,
        ProfileComment.is_deleted == False
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check permissions
    is_author = current_user and comment.author_id == current_user.id
    is_profile_owner = current_user and current_user.id == profile_user.id
    
    if not (is_author or is_profile_owner):
        raise HTTPException(
            status_code=403,
            detail="You don't have permission to delete this comment"
        )
    
    # Soft delete
    comment.is_deleted = True
    db.commit()
    
    return None


@router.post("/{username}/comments/{comment_id}/reply", response_model=ProfileCommentResponse, status_code=201)
def reply_to_comment(
    username: str,
    comment_id: int,
    comment_data: ProfileCommentCreate,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """
    Reply to a comment.
    Requires authentication, but can post anonymously.
    """
    profile_user = get_profile_user(username, db)
    
    # Check if comments are enabled
    if not profile_user.comments_enabled:
        raise HTTPException(
            status_code=403,
            detail="Comments are disabled for this profile"
        )
    
    # Validate authentication
    if not current_user:
        raise HTTPException(
            status_code=401,
            detail="Authentication required to post replies"
        )
    
    # Validate parent comment exists
    parent = db.query(ProfileComment).filter(
        ProfileComment.id == comment_id,
        ProfileComment.profile_user_id == profile_user.id,
        ProfileComment.is_deleted == False
    ).first()
    
    if not parent:
        raise HTTPException(status_code=404, detail="Parent comment not found")
    
    # Use the same logic as create_comment but with parent_comment_id set
    reply_data = ProfileCommentCreate(
        content=comment_data.content,
        is_question=comment_data.is_question,
        author_display_name=comment_data.author_display_name,
        parent_comment_id=comment_id
    )
    
    return create_profile_comment(username, reply_data, current_user, db)


@router.patch("/{username}/comments/{comment_id}/answer", response_model=ProfileCommentResponse)
def mark_question_as_answered(
    username: str,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a question as answered (profile owner only).
    """
    profile_user = get_profile_user(username, db)
    
    # Check if current user is profile owner
    if current_user.id != profile_user.id:
        raise HTTPException(
            status_code=403,
            detail="Only the profile owner can mark questions as answered"
        )
    
    comment = db.query(ProfileComment).filter(
        ProfileComment.id == comment_id,
        ProfileComment.profile_user_id == profile_user.id,
        ProfileComment.is_deleted == False
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    if not comment.is_question:
        raise HTTPException(
            status_code=400,
            detail="This comment is not a question"
        )
    
    comment.is_answered = True
    db.commit()
    db.refresh(comment)
    
    return build_comment_response(comment, db, current_user.id)


@router.post("/{username}/comments/{comment_id}/upvote", response_model=ProfileCommentResponse)
def upvote_comment(
    username: str,
    comment_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upvote a comment. Users can only upvote once per comment (toggle on/off).
    """
    profile_user = get_profile_user(username, db)
    
    comment = db.query(ProfileComment).filter(
        ProfileComment.id == comment_id,
        ProfileComment.profile_user_id == profile_user.id,
        ProfileComment.is_deleted == False
    ).first()
    
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    
    # Check if user already upvoted
    existing_upvote = db.query(CommentUpvote).filter(
        CommentUpvote.comment_id == comment_id,
        CommentUpvote.user_id == current_user.id
    ).first()
    
    if existing_upvote:
        # Remove upvote (toggle off)
        db.delete(existing_upvote)
        comment.upvotes = max(0, (comment.upvotes or 0) - 1)
    else:
        # Add upvote
        new_upvote = CommentUpvote(
            comment_id=comment_id,
            user_id=current_user.id
        )
        db.add(new_upvote)
        comment.upvotes = (comment.upvotes or 0) + 1
    
    db.commit()
    db.refresh(comment)
    
    return build_comment_response(comment, db, current_user.id)

