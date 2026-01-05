"""
Notification routes for user notifications.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime

from database import get_db
from models import User, Notification, ProfileComment
from schemas import NotificationResponse
from auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


def build_notification_response(notification: Notification, db: Session) -> NotificationResponse:
    """Build a NotificationResponse with comment details."""
    comment_content = None
    author_display_name = None
    author_username = None
    author_discord_avatar = None
    author_discord_id = None
    profile_username = None
    
    if notification.comment_id:
        comment = db.query(ProfileComment).filter(ProfileComment.id == notification.comment_id).first()
        if comment:
            comment_content = comment.content
            
            # Get author info
            if comment.author_id:
                author = db.query(User).filter(User.id == comment.author_id).first()
                if author:
                    if author.is_anonymous:
                        author_display_name = author.display_name or "Anonymous User"
                    else:
                        author_username = author.username
                        author_display_name = author.display_name or author.username
                        author_discord_avatar = author.discord_avatar
                        author_discord_id = author.discord_id
            else:
                # Anonymous comment
                author_display_name = comment.author_display_name or "Anonymous User"
            
            # Get profile owner username
            profile_user = db.query(User).filter(User.id == comment.profile_user_id).first()
            if profile_user:
                profile_username = profile_user.username
    
    return NotificationResponse(
        id=notification.id,
        user_id=notification.user_id,
        type=notification.type,
        comment_id=notification.comment_id,
        is_read=notification.is_read,
        created_at=notification.created_at.isoformat(),
        comment_content=comment_content,
        author_display_name=author_display_name,
        author_username=author_username,
        author_discord_avatar=author_discord_avatar,
        author_discord_id=author_discord_id,
        profile_username=profile_username
    )


@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all notifications for the current user.
    Returns notifications sorted by creation date (newest first).
    """
    notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id
    ).order_by(Notification.created_at.desc()).all()
    
    return [build_notification_response(notif, db) for notif in notifications]


@router.get("/unread-count", response_model=dict)
def get_unread_count(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get the count of unread notifications for the current user.
    """
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()
    
    return {"unread_count": count}


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    notification_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark a specific notification as read.
    """
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == current_user.id
    ).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    
    return build_notification_response(notification, db)


@router.patch("/read-all", response_model=dict)
def mark_all_notifications_as_read(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Mark all notifications as read for the current user.
    """
    updated = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).update({"is_read": True})
    
    db.commit()
    
    return {"message": f"Marked {updated} notifications as read"}

