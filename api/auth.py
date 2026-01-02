"""
Authentication utilities for JWT token handling.
"""
from datetime import datetime, timedelta
from typing import Optional
import os
import hashlib
import bcrypt
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from dotenv import load_dotenv

from database import get_db
from models import User

# Load environment variables
load_dotenv()

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")


def _pre_hash_password(password: str) -> bytes:
    """
    Pre-hash password with SHA-256 to handle bcrypt's 72-byte limit.
    Returns bytes (32 bytes) which is well under bcrypt's 72-byte limit.
    """
    return hashlib.sha256(password.encode('utf-8')).digest()


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against a hash."""
    try:
        # Pre-hash the password to handle bcrypt's 72-byte limit
        pre_hashed = _pre_hash_password(plain_password)
        # bcrypt expects bytes
        return bcrypt.checkpw(pre_hashed, hashed_password.encode('utf-8'))
    except (ValueError, TypeError, Exception):
        return False


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    # Pre-hash the password to handle bcrypt's 72-byte limit
    pre_hashed = _pre_hash_password(password)
    # Generate salt and hash (bcrypt handles salt automatically)
    hashed = bcrypt.hashpw(pre_hashed, bcrypt.gensalt())
    # Return as string for storage
    return hashed.decode('utf-8')


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create a JWT access token."""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Get a user by email (case-insensitive for SQLite compatibility)."""
    if not email:
        return None
    # Use case-insensitive comparison (works with SQLite)
    from sqlalchemy import func
    return db.query(User).filter(func.lower(User.email) == func.lower(email)).first()


def get_user_by_username(db: Session, username: str) -> Optional[User]:
    """Get a user by username (case-insensitive for SQLite compatibility)."""
    if not username:
        return None
    # Use case-insensitive comparison (works with SQLite)
    from sqlalchemy import func
    return db.query(User).filter(func.lower(User.username) == func.lower(username)).first()


def get_user_by_discord_id(db: Session, discord_id: str) -> Optional[User]:
    """Get a user by Discord ID."""
    return db.query(User).filter(User.discord_id == discord_id).first()


def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
    """Get a user by Google ID."""
    return db.query(User).filter(User.google_id == google_id).first()


def authenticate_user(db: Session, identifier: str, password: str) -> Optional[User]:
    """
    Authenticate a user with username or email and password.
    Tries email first, then username if email lookup fails.
    """
    # Try email first
    user = get_user_by_email(db, identifier)
    
    # If not found by email, try username
    if not user:
        user = get_user_by_username(db, identifier)
    
    if not user:
        return None
    if not user.hashed_password:
        return None  # User doesn't have a password (OAuth only)
    if not verify_password(password, user.hashed_password):
        return None
    return user


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user from JWT token."""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
        # Ensure user_id is an integer
        user_id = int(user_id)
    except (JWTError, ValueError, TypeError):
        raise credentials_exception
    
    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise credentials_exception
    return user


def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get the current authenticated user from JWT token, or None if not authenticated."""
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        user_id = int(user_id)
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except (JWTError, ValueError, TypeError):
        return None


def is_admin_user(user: User) -> bool:
    """Check if a user is an admin based on email."""
    if not user.email:
        return False  # Ghost accounts cannot be admins
    admin_emails = os.getenv("ADMIN_EMAILS", "")
    if not admin_emails:
        return False
    
    # Split comma-separated emails and check if user's email is in the list
    admin_email_list = [email.strip().lower() for email in admin_emails.split(",")]
    return user.email.lower() in admin_email_list


def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get the current authenticated user and verify they are an admin."""
    if not is_admin_user(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user


def merge_user_accounts(db: Session, source_user: User, target_user: User) -> None:
    """
    Merge source_user into target_user.
    Transfers all processes, stages, and feedback from source to target.
    If processes with the same company name AND matching position (both null or both same) exist,
    the source (Discord) process overwrites the target (web) process.
    Otherwise keeps them as separate processes.
    Deletes source_user after transfer.
    """
    from models import Process, Feedback, Stage
    from sqlalchemy import func
    
    # Get all processes from source user
    source_processes = db.query(Process).filter(Process.user_id == source_user.id).all()
    
    # Get all processes from target user (for matching)
    target_processes = db.query(Process).filter(Process.user_id == target_user.id).all()
    # Create a lookup key: (company_name_lower, position_or_none)
    target_processes_by_key = {}
    for p in target_processes:
        key = (p.company_name.lower(), p.position)
        target_processes_by_key[key] = p
    
    for source_process in source_processes:
        # Create matching key for source process
        key = (source_process.company_name.lower(), source_process.position)
        
        # Check if target user has a process with matching company name AND position
        # (both None counts as a match, or both must be the same string)
        if key in target_processes_by_key:
            # Discord process overwrites web process: delete the web process and keep the Discord one
            target_process = target_processes_by_key[key]
            
            # Delete the target (web) process - cascade will delete its stages
            db.delete(target_process)
            
            # Transfer the source (Discord) process to target user
            source_process.user_id = target_user.id
        else:
            # No matching process, just transfer the process
            source_process.user_id = target_user.id
    
    # Transfer all feedback
    feedback_items = db.query(Feedback).filter(Feedback.user_id == source_user.id).all()
    for feedback in feedback_items:
        feedback.user_id = target_user.id
    
    # Commit transfers
    db.commit()
    
    # Delete source user (cascade will handle any remaining relationships)
    db.delete(source_user)
    db.commit()

