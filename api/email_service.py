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
EMAIL_FROM_ADDRESS = os.getenv("EMAIL_FROM", "notifications@processes.cc")  # Update with your verified domain
EMAIL_FROM = f"Process <{EMAIL_FROM_ADDRESS}>"  # Sender name is "Process"
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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
                
                body {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    line-height: 1.6;
                    color: #1c1917;
                    background-color: #fefcf8;
                    margin: 0;
                    padding: 20px;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #fefcf8;
                }}
                .icon-container {{
                    text-align: center;
                    margin-bottom: 24px;
                }}
                .icon {{
                    width: 64px;
                    height: 64px;
                    color: #4f46e5;
                    margin: 0 auto;
                }}
                .title-wrapper {{
                    position: relative;
                    display: inline-block;
                    margin-bottom: -12px;
                    z-index: 2;
                }}
                .title-shadow {{
                    position: absolute;
                    inset: 0;
                    background-color: #1c1917;
                    transform: translate(8px, 8px);
                }}
                .title-banner {{
                    position: relative;
                    background-color: #1c1917;
                    color: #fefcf8;
                    padding: 16px 24px;
                    border: 4px solid #1c1917;
                    transform: rotate(1deg);
                }}
                .title-text {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 24px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                    margin: 0;
                    text-align: center;
                }}
                .title-wrapper:hover {{
                    transform: translate(2px, 2px);
                }}
                .title-wrapper:hover .title-shadow {{
                    transform: translate(10px, 10px);
                }}
                .description-wrapper {{
                    position: relative;
                    display: inline-block;
                    z-index: 1;
                    margin-top: -12px;
                }}
                .description-shadow {{
                    position: absolute;
                    inset: 0;
                    background-color: #f5f5f0;
                    transform: translate(4px, 4px);
                }}
                .description-box {{
                    position: relative;
                    background-color: #f5f5f0;
                    border: 2px solid #1c1917;
                    padding: 24px;
                    padding-top: 36px;
                    transform: rotate(-1deg);
                    max-width: 500px;
                }}
                .description-text {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 14px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #57534e;
                    text-align: center;
                    margin: 0;
                }}
                .quick-start-wrapper {{
                    position: relative;
                    margin: 24px 0;
                }}
                .quick-start-shadow {{
                    position: absolute;
                    inset: 0;
                    background-color: #4f46e5;
                    transform: translate(8px, 8px);
                }}
                .quick-start-box {{
                    position: relative;
                    background-color: #4f46e5;
                    border: 4px solid #1c1917;
                    padding: 24px;
                    transform: rotate(-1deg);
                }}
                .quick-start-title-wrapper {{
                    position: relative;
                    display: inline-block;
                    margin-bottom: 16px;
                }}
                .quick-start-title-shadow {{
                    position: absolute;
                    inset: 0;
                    background-color: #1c1917;
                    transform: translate(4px, 4px);
                }}
                .quick-start-title {{
                    position: relative;
                    background-color: #1c1917;
                    color: #fefcf8;
                    padding: 8px 16px;
                    border: 2px solid #1c1917;
                    transform: rotate(1deg);
                }}
                .quick-start-title-text {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 18px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                    margin: 0;
                }}
                .quick-start-wrapper:hover {{
                    transform: translate(2px, 2px) rotate(-1deg);
                }}
                .quick-start-wrapper:hover .quick-start-shadow {{
                    transform: translate(10px, 10px);
                }}
                .quick-start-list {{
                    list-style: decimal;
                    list-style-position: inside;
                    padding: 0;
                    margin: 0;
                    color: #ffffff;
                }}
                .quick-start-list li {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 13px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 12px;
                    line-height: 1.5;
                }}
                .button-container {{
                    text-align: center;
                    margin: 32px 0;
                }}
                .button-wrapper {{
                    position: relative;
                    display: inline-block;
                }}
                .button-shadow {{
                    position: absolute;
                    inset: 0;
                    background-color: #4f46e5;
                    transform: translate(8px, 8px);
                }}
                .button {{
                    position: relative;
                    display: inline-block;
                    background-color: #4f46e5;
                    color: #ffffff;
                    padding: 16px 32px;
                    text-decoration: none;
                    border: 4px solid #1c1917;
                    transform: rotate(-1deg);
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 14px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    transition: transform 0.2s;
                }}
                .button:hover {{
                    transform: rotate(0deg) scale(1.05);
                }}
                .button-wrapper:hover .button-shadow {{
                    transform: translate(12px, 12px);
                }}
                .button-icon {{
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    vertical-align: middle;
                    margin-right: 8px;
                }}
                .footer {{
                    text-align: center;
                    padding: 24px 0;
                    color: #78716c;
                    font-size: 12px;
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                }}
                .text-center {{
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="text-center">
                    <!-- Icon -->
                    <div class="icon-container">
                        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                        </svg>
                    </div>
                    
                    <!-- Welcome Banner -->
                    <div class="title-wrapper">
                        <div class="title-shadow"></div>
                        <div class="title-banner">
                            <h1 class="title-text">WELCOME TO PROCESS!</h1>
                        </div>
                    </div>
                    
                    <!-- Description Box -->
                    <div class="description-wrapper">
                        <div class="description-shadow"></div>
                        <div class="description-box">
                            <p class="description-text">
                                TRACK YOUR JOB APPLICATIONS, MANAGE STAGES, AND VISUALIZE YOUR PROGRESS ALL IN ONE PLACE.
                            </p>
                        </div>
                    </div>
                    
                    <!-- Quick Start Guide -->
                    <div class="quick-start-wrapper">
                        <div class="quick-start-shadow"></div>
                        <div class="quick-start-box">
                            <div class="quick-start-title-wrapper">
                                <div class="quick-start-title-shadow"></div>
                                <div class="quick-start-title">
                                    <h2 class="quick-start-title-text">QUICK START GUIDE</h2>
                                </div>
                            </div>
                            <ol class="quick-start-list">
                                <li>CREATE A PROCESS FOR EACH JOB APPLICATION YOU'RE TRACKING</li>
                                <li>ADD STAGES AS YOU PROGRESS THROUGH THE INTERVIEW PROCESS</li>
                                <li>UPDATE STAGES WITH DATES AND NOTES TO KEEP TRACK OF YOUR PROGRESS</li>
                                <li>USE THE DASHBOARD TO SEE AN OVERVIEW OF ALL YOUR APPLICATIONS</li>
                            </ol>
                        </div>
                    </div>
                    
                    <!-- Get Started Button -->
                    <div class="button-container">
                        <div class="button-wrapper">
                            <div class="button-shadow"></div>
                            <a href="{dashboard_url}" class="button">
                                <span class="button-icon">+</span>
                                GET STARTED
                            </a>
                        </div>
                    </div>
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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');
                
                body {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    line-height: 1.6;
                    color: #1c1917;
                    background-color: #fefcf8;
                    margin: 0;
                    padding: 20px;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #fefcf8;
                }}
                .header-wrapper {{
                    position: relative;
                    display: inline-block;
                    margin-bottom: 16px;
                }}
                .header-shadow {{
                    position: absolute;
                    inset: 0;
                    background-color: #1c1917;
                    transform: translate(8px, 8px);
                }}
                .header-banner {{
                    position: relative;
                    background-color: #1c1917;
                    color: #fefcf8;
                    padding: 16px 24px;
                    border: 4px solid #1c1917;
                    transform: rotate(1deg);
                }}
                .header-text {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 20px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                    margin: 0;
                }}
                .header-wrapper:hover {{
                    transform: translate(2px, 2px);
                }}
                .header-wrapper:hover .header-shadow {{
                    transform: translate(10px, 10px);
                }}
                .content {{
                    padding: 20px 0;
                }}
                .notification-wrapper {{
                    position: relative;
                    margin: 20px 0;
                }}
                .notification-shadow {{
                    position: absolute;
                    inset: 0;
                    background-color: #1c1917;
                    transform: translate(8px, 8px);
                }}
                .notification-box {{
                    position: relative;
                    background-color: #fefcf8;
                    border: 4px solid #1c1917;
                    padding: 24px;
                    transform: rotate(-1deg);
                }}
                .notification-author {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 14px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #1c1917;
                    margin-bottom: 12px;
                }}
                .notification-content {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #1c1917;
                    margin: 0;
                    white-space: pre-wrap;
                }}
                .question-badge {{
                    display: inline-block;
                    background-color: #2563eb;
                    color: #ffffff;
                    padding: 4px 8px;
                    border: 2px solid #1c1917;
                    transform: rotate(1deg);
                    margin-left: 8px;
                }}
                .question-badge-text {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 12px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }}
                .button-wrapper {{
                    position: relative;
                    display: inline-block;
                    margin: 8px 4px;
                }}
                .button-shadow {{
                    position: absolute;
                    inset: 0;
                    background-color: #4f46e5;
                    transform: translate(8px, 8px);
                }}
                .button {{
                    position: relative;
                    display: inline-block;
                    background-color: #4f46e5;
                    color: #ffffff;
                    padding: 12px 24px;
                    text-decoration: none;
                    border: 4px solid #1c1917;
                    transform: rotate(-1deg);
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 13px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }}
                .footer {{
                    text-align: center;
                    padding: 24px 0;
                    color: #78716c;
                    font-size: 12px;
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                }}
                .text-center {{
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="text-center">
                    <div class="header-wrapper">
                        <div class="header-shadow"></div>
                        <div class="header-banner">
                            <h1 class="header-text">New {notification.type.title()}</h1>
                        </div>
                    </div>
                </div>
                <div class="content">
                    <p style="font-family: 'DM Sans', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Hi {user.username},</p>
                    <p style="font-family: 'DM Sans', sans-serif;"><strong>{author_name}</strong> {notification_text} on your profile.</p>
                    {f'''
                    <div class="notification-wrapper">
                        <div class="notification-shadow"></div>
                        <div class="notification-box">
                            <div class="notification-author">
                                {author_name}
                                {f'<span class="question-badge"><span class="question-badge-text">Question</span></span>' if notification.type == 'question' else ''}
                            </div>
                            <p class="notification-content">{comment.content[:200]}{"..." if len(comment.content) > 200 else ""}</p>
                        </div>
                    </div>
                    ''' if comment else ''}
                    <div class="text-center" style="margin-top: 24px;">
                        <div class="button-wrapper">
                            <div class="button-shadow"></div>
                            <a href="{notifications_url}" class="button">View Notification</a>
                        </div>
                        <div class="button-wrapper">
                            <div class="button-shadow"></div>
                            <a href="{profile_url}" class="button">View Profile</a>
                        </div>
                    </div>
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
        
        # Get first comment and first question content
        first_comment = None
        first_question = None
        first_comment_author = None
        first_question_author = None
        
        # Find first comment notification
        for notification in notifications:
            if notification.type == "comment" and notification.comment_id and not first_comment:
                comment = db.query(ProfileComment).filter(ProfileComment.id == notification.comment_id).first()
                if comment:
                    first_comment = comment
                    # Get author name
                    if comment.author_id:
                        author = db.query(User).filter(User.id == comment.author_id).first()
                        if author:
                            first_comment_author = author.display_name or author.username
                    else:
                        first_comment_author = comment.author_display_name or "Anonymous"
        
        # Find first question notification
        for notification in notifications:
            if notification.type == "question" and notification.comment_id and not first_question:
                question = db.query(ProfileComment).filter(ProfileComment.id == notification.comment_id).first()
                if question:
                    first_question = question
                    # Get author name
                    if question.author_id:
                        author = db.query(User).filter(User.id == question.author_id).first()
                        if author:
                            first_question_author = author.display_name or author.username
                    else:
                        first_question_author = question.author_display_name or "Anonymous"
        
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
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                body {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    line-height: 1.6;
                    color: #1c1917;
                    background-color: #fefcf8;
                    margin: 0;
                    padding: 20px;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background-color: #fefcf8;
                }}
                .header-banner {{
                    background-color: #1c1917;
                    color: #fefcf8;
                    padding: 16px 24px;
                    border: 4px solid #1c1917;
                    transform: rotate(1deg);
                    display: inline-block;
                    margin-bottom: 16px;
                }}
                .header-text {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 20px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                    margin: 0;
                }}
                .content {{
                    padding: 20px 0;
                }}
                .summary-wrapper {{
                    position: relative;
                    margin: 20px 0;
                }}
                .summary-shadow {{
                    position: absolute;
                    inset: 0;
                    background-color: #4f46e5;
                    transform: translate(8px, 8px);
                }}
                .summary-box {{
                    position: relative;
                    background-color: #4f46e5;
                    border: 4px solid #1c1917;
                    padding: 24px;
                    transform: rotate(-1deg);
                }}
                .summary-title-wrapper {{
                    position: relative;
                    display: inline-block;
                    margin-bottom: 16px;
                }}
                .summary-title-shadow {{
                    position: absolute;
                    inset: 0;
                    background-color: #1c1917;
                    transform: translate(4px, 4px);
                }}
                .summary-title {{
                    position: relative;
                    background-color: #1c1917;
                    color: #fefcf8;
                    padding: 8px 16px;
                    border: 2px solid #1c1917;
                    transform: rotate(1deg);
                }}
                .summary-title-text {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 16px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                    margin: 0;
                }}
                .summary-wrapper:hover {{
                    transform: translate(2px, 2px) rotate(-1deg);
                }}
                .summary-wrapper:hover .summary-shadow {{
                    transform: translate(10px, 10px);
                }}
                .description-wrapper:hover {{
                    transform: translate(1px, 1px) rotate(-1deg);
                }}
                .description-wrapper:hover .description-shadow {{
                    transform: translate(5px, 5px);
                }}
                .notification-wrapper:hover {{
                    transform: translate(1px, 1px);
                }}
                .notification-wrapper:hover .notification-shadow {{
                    transform: translate(5px, 5px);
                }}
                .preview-wrapper:hover {{
                    transform: translate(1px, 1px);
                }}
                .preview-wrapper:hover .preview-shadow {{
                    transform: translate(5px, 5px);
                }}
                .summary-list {{
                    list-style: none;
                    padding: 0;
                    margin: 0;
                    color: #ffffff;
                }}
                .summary-list li {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 14px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    margin-bottom: 8px;
                }}
                .preview-wrapper {{
                    position: relative;
                    margin: 16px 0;
                }}
                .preview-shadow {{
                    position: absolute;
                    inset: 0;
                    background-color: #1c1917;
                    transform: translate(8px, 8px);
                }}
                .preview-box {{
                    position: relative;
                    background-color: #fefcf8;
                    border: 4px solid #1c1917;
                    padding: 24px;
                    transform: rotate(-1deg);
                }}
                .preview-author {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 14px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #1c1917;
                    margin-bottom: 12px;
                }}
                .preview-content {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #1c1917;
                    margin: 0;
                    white-space: pre-wrap;
                }}
                .preview-question-badge {{
                    display: inline-block;
                    background-color: #2563eb;
                    color: #ffffff;
                    padding: 4px 8px;
                    border: 2px solid #1c1917;
                    transform: rotate(1deg);
                    margin-left: 8px;
                }}
                .preview-question-badge-text {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 12px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }}
                .summary-count-text {{
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 14px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                    color: #ffffff;
                    margin-bottom: 12px;
                }}
                .button-wrapper {{
                    position: relative;
                    display: inline-block;
                    margin: 8px 4px;
                }}
                .button-shadow {{
                    position: absolute;
                    inset: 0;
                    background-color: #4f46e5;
                    transform: translate(8px, 8px);
                }}
                .button {{
                    position: relative;
                    display: inline-block;
                    background-color: #4f46e5;
                    color: #ffffff;
                    padding: 12px 24px;
                    text-decoration: none;
                    border: 4px solid #1c1917;
                    transform: rotate(-1deg);
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                    font-size: 13px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }}
                .footer {{
                    text-align: center;
                    padding: 24px 0;
                    color: #78716c;
                    font-size: 12px;
                    font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
                }}
                .text-center {{
                    text-align: center;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="text-center">
                    <div class="header-wrapper">
                        <div class="header-shadow"></div>
                        <div class="header-banner">
                            <h1 class="header-text">New Activity on Your Profile</h1>
                        </div>
                    </div>
                </div>
                <div class="content">
                    <p style="font-family: 'DM Sans', sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;">Hi {user.username},</p>
                    <p style="font-family: 'DM Sans', sans-serif;">You have {summary_text} on your profile.</p>
                    <div class="summary-wrapper">
                        <div class="summary-shadow"></div>
                        <div class="summary-box">
                            <div class="summary-title-wrapper">
                                <div class="summary-title-shadow"></div>
                                <div class="summary-title">
                                    <h2 class="summary-title-text">Summary</h2>
                                </div>
                            </div>
                            
                            {f'''
                            <div style="margin-bottom: 20px;">
                                <div class="summary-count-text">
                                    {comment_count} comment{"s" if comment_count > 1 else ""}
                                </div>
                                <div class="preview-wrapper">
                                    <div class="preview-shadow"></div>
                                    <div class="preview-box">
                                        <div class="preview-author">{first_comment_author}</div>
                                        <p class="preview-content">{first_comment.content[:200]}{"..." if len(first_comment.content) > 200 else ""}</p>
                                    </div>
                                </div>
                            </div>
                            ''' if first_comment else ''}
                            
                            {f'''
                            <div style="margin-bottom: 20px;">
                                <div class="summary-count-text">
                                    {question_count} question{"s" if question_count > 1 else ""}
                                </div>
                                <div class="preview-wrapper">
                                    <div class="preview-shadow"></div>
                                    <div class="preview-box">
                                        <div class="preview-author">
                                            {first_question_author}
                                            <span class="preview-question-badge"><span class="preview-question-badge-text">Question</span></span>
                                        </div>
                                        <p class="preview-content">{first_question.content[:200]}{"..." if len(first_question.content) > 200 else ""}</p>
                                    </div>
                                </div>
                            </div>
                            ''' if first_question else ''}
                        </div>
                    </div>
                    <div class="text-center" style="margin-top: 24px;">
                        <div class="button-wrapper">
                            <div class="button-shadow"></div>
                            <a href="{notifications_url}" class="button">View All Notifications</a>
                        </div>
                        <div class="button-wrapper">
                            <div class="button-shadow"></div>
                            <a href="{profile_url}" class="button">View Profile</a>
                        </div>
                    </div>
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
