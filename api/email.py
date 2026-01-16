"""
Email service for sending welcome and notification emails using Resend.
Implements smart batching to prevent email spam.
"""
import os
import logging
from datetime import datetime, timedelta
from typing import List, Optional
from sqlalchemy.orm import Session

try:
    import resend
except ImportError:
    resend = None

from models import User, Notification, ProfileComment

logger = logging.getLogger(__name__)

# Initialize Resend
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
resend_configured = False

if RESEND_API_KEY:
    if resend:
        resend.api_key = RESEND_API_KEY
        resend_configured = True
    else:
        logger.warning("Resend package not installed. Email functionality will be disabled.")
else:
    logger.warning("RESEND_API_KEY not set. Email functionality will be disabled.")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")
EMAIL_FROM = os.getenv("EMAIL_FROM", "notifications@processes.cc")  # Update with your verified domain
BATCH_INTERVAL_HOURS = 2  # Send at most one email every 2 hours


def can_send_email(user: User) -> bool:
    """Check if we can send emails to this user."""
    if not user.email:
        return False
    if not user.email_notifications_enabled:
        return False
    if not resend_configured:
        return False
    return True


def should_send_immediately(user: User) -> bool:
    """
    Check if we should send an email immediately or queue it for batching.
    Returns True if last email was sent more than 2 hours ago (or never).
    """
    if not user.last_notification_email_sent_at:
        return True  # Never sent an email, send immediately
    
    time_since_last_email = datetime.utcnow() - user.last_notification_email_sent_at
    return time_since_last_email >= timedelta(hours=BATCH_INTERVAL_HOURS)


def send_welcome_email(user: User) -> bool:
    """
    Send welcome email to a new user.
    Returns True if email was sent successfully, False otherwise.
    """
    if not can_send_email(user):
        logger.info(f"Skipping welcome email for user {user.id}: email disabled or no email address")
        return False
    
    try:
        dashboard_url = f"{FRONTEND_URL}/dashboard"
        profile_url = f"{FRONTEND_URL}/profile/{user.username}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #1a1a1a; color: #f5f5dc; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #f5f5dc; text-decoration: none; border-radius: 4px; margin: 10px 0; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Process!</h1>
                </div>
                <div class="content">
                    <p>Hi {user.username},</p>
                    <p>Welcome to Process! We're excited to have you on board.</p>
                    <p>Process helps you track your job application journey. Here's what you can do:</p>
                    <ul>
                        <li>Track applications and their stages</li>
                        <li>Share your process publicly (optional)</li>
                        <li>Receive comments and questions on your profile</li>
                        <li>Explore other users' processes</li>
                    </ul>
                    <p>
                        <a href="{dashboard_url}" class="button">Go to Dashboard</a>
                    </p>
                    <p>
                        <a href="{profile_url}" class="button">View Your Profile</a>
                    </p>
                    <p>If you have any questions, feel free to reach out!</p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} Process. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        params = {
            "from": EMAIL_FROM,
            "to": [user.email],
            "subject": "Welcome to Process!",
            "html": html_content,
        }
        
        email = resend.Emails.send(params)
        logger.info(f"Welcome email sent to {user.email} (user {user.id})")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to user {user.id}: {e}")
        return False


def send_notification_email_immediate(user: User, notification: Notification, db: Session) -> bool:
    """
    Send an immediate notification email for a single notification.
    Updates user.last_notification_email_sent_at timestamp.
    Returns True if email was sent successfully, False otherwise.
    """
    if not can_send_email(user):
        return False
    
    try:
        # Get notification details
        comment = None
        author_name = "Someone"
        notification_text = "notification"
        
        if notification.comment_id:
            comment = db.query(ProfileComment).filter(ProfileComment.id == notification.comment_id).first()
            if comment:
                if notification.type == "question":
                    notification_text = "asked a question"
                else:
                    notification_text = "left a comment"
                
                if comment.author_id:
                    author = db.query(User).filter(User.id == comment.author_id).first()
                    if author:
                        author_name = author.display_name or author.username
                else:
                    author_name = comment.author_display_name or "Anonymous"
        
        profile_url = f"{FRONTEND_URL}/profile/{user.username}"
        notifications_url = f"{FRONTEND_URL}/notifications"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #1a1a1a; color: #f5f5dc; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .notification-box {{ background-color: #fff; border-left: 4px solid #1a1a1a; padding: 15px; margin: 15px 0; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #f5f5dc; text-decoration: none; border-radius: 4px; margin: 10px 0; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New {notification.type.title()}</h1>
                </div>
                <div class="content">
                    <p>Hi {user.username},</p>
                    <p><strong>{author_name}</strong> {notification_text} on your profile.</p>
                    {f'<div class="notification-box"><p>{comment.content[:200]}{"..." if len(comment.content) > 200 else ""}</p></div>' if comment else ''}
                    <p>
                        <a href="{notifications_url}" class="button">View Notification</a>
                    </p>
                    <p>
                        <a href="{profile_url}" class="button">View Your Profile</a>
                    </p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} Process. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        params = {
            "from": EMAIL_FROM,
            "to": [user.email],
            "subject": f"New {notification.type} on your profile",
            "html": html_content,
        }
        
        email = resend.Emails.send(params)
        
        # Update timestamp
        user.last_notification_email_sent_at = datetime.utcnow()
        notification.email_sent = True
        db.commit()
        
        logger.info(f"Notification email sent to {user.email} (user {user.id}, notification {notification.id})")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send notification email to user {user.id}: {e}")
        return False


def send_notification_digest(user: User, notifications: List[Notification], db: Session) -> bool:
    """
    Send a batched digest email with summary of multiple notifications.
    Updates user.last_notification_email_sent_at timestamp.
    Returns True if email was sent successfully, False otherwise.
    """
    if not can_send_email(user):
        return False
    
    if not notifications:
        return False
    
    try:
        # Count notifications by type
        comment_count = sum(1 for n in notifications if n.type == "comment")
        question_count = sum(1 for n in notifications if n.type == "question")
        
        total_count = len(notifications)
        
        # Build summary text
        summary_parts = []
        if comment_count > 0:
            summary_parts.append(f"{comment_count} new comment{'s' if comment_count > 1 else ''}")
        if question_count > 0:
            summary_parts.append(f"{question_count} new question{'s' if question_count > 1 else ''}")
        
        summary_text = " and ".join(summary_parts) if summary_parts else f"{total_count} new notification{'s' if total_count > 1 else ''}"
        
        notifications_url = f"{FRONTEND_URL}/notifications"
        profile_url = f"{FRONTEND_URL}/profile/{user.username}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #1a1a1a; color: #f5f5dc; padding: 20px; text-align: center; }}
                .content {{ padding: 20px; background-color: #f9f9f9; }}
                .summary-box {{ background-color: #fff; border-left: 4px solid #1a1a1a; padding: 15px; margin: 15px 0; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #f5f5dc; text-decoration: none; border-radius: 4px; margin: 10px 0; }}
                .footer {{ padding: 20px; text-align: center; color: #666; font-size: 12px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>New Activity on Your Profile</h1>
                </div>
                <div class="content">
                    <p>Hi {user.username},</p>
                    <p>You have {summary_text} on your profile.</p>
                    <div class="summary-box">
                        <p><strong>Summary:</strong></p>
                        <ul>
                            {f'<li>{comment_count} comment{"s" if comment_count > 1 else ""}</li>' if comment_count > 0 else ''}
                            {f'<li>{question_count} question{"s" if question_count > 1 else ""}</li>' if question_count > 0 else ''}
                        </ul>
                    </div>
                    <p>
                        <a href="{notifications_url}" class="button">View All Notifications</a>
                    </p>
                    <p>
                        <a href="{profile_url}" class="button">View Your Profile</a>
                    </p>
                </div>
                <div class="footer">
                    <p>© {datetime.now().year} Process. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        params = {
            "from": EMAIL_FROM,
            "to": [user.email],
            "subject": f"You have {summary_text} on your profile",
            "html": html_content,
        }
        
        email = resend.Emails.send(params)
        
        # Update timestamp and mark all notifications as sent
        user.last_notification_email_sent_at = datetime.utcnow()
        for notification in notifications:
            notification.email_sent = True
        db.commit()
        
        logger.info(f"Digest email sent to {user.email} (user {user.id}, {total_count} notifications)")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send digest email to user {user.id}: {e}")
        return False


def process_pending_digests(db: Session) -> int:
    """
    Process pending notification digests for users with unsent notifications older than 2 hours.
    Returns the number of users who received digest emails.
    """
    if not resend_configured:
        logger.warning("Resend not configured, skipping digest processing")
        return 0
    
    try:
        # Find notifications that are unsent and older than 2 hours
        cutoff_time = datetime.utcnow() - timedelta(hours=BATCH_INTERVAL_HOURS)
        
        pending_notifications = db.query(Notification).filter(
            Notification.email_sent == False,
            Notification.created_at < cutoff_time
        ).all()
        
        if not pending_notifications:
            logger.debug("No pending notifications to process")
            return 0
        
        # Group notifications by user
        notifications_by_user = {}
        for notification in pending_notifications:
            if notification.user_id not in notifications_by_user:
                notifications_by_user[notification.user_id] = []
            notifications_by_user[notification.user_id].append(notification)
        
        # Send digest for each user
        emails_sent = 0
        for user_id, notifications in notifications_by_user.items():
            user = db.query(User).filter(User.id == user_id).first()
            if user and can_send_email(user):
                if send_notification_digest(user, notifications, db):
                    emails_sent += 1
        
        logger.info(f"Processed {emails_sent} digest emails for {len(notifications_by_user)} users")
        return emails_sent
        
    except Exception as e:
        logger.error(f"Error processing pending digests: {e}")
        return 0
