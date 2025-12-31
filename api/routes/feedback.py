"""
Feedback routes for submitting and viewing feedback.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import JWTError, jwt

from database import get_db
from models import Feedback, User
from schemas import FeedbackCreate, FeedbackResponse
from auth import get_current_admin_user, SECRET_KEY, ALGORITHM

router = APIRouter(prefix="/api/feedback", tags=["feedback"])


def get_optional_user(
    request: Request,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get current user if authenticated, otherwise return None."""
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return None
    
    try:
        token = auth_header.split(" ")[1]
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")
        if user_id is None:
            return None
        # Ensure user_id is an integer
        user_id = int(user_id)
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except (JWTError, ValueError, TypeError, Exception):
        # If token is invalid, just return None (anonymous user)
        return None


@router.post("/", response_model=FeedbackResponse, status_code=201)
def create_feedback(
    feedback_data: FeedbackCreate,
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Submit feedback. Can be called by authenticated or anonymous users.
    - If authenticated: uses user info, name/email not required
    - If anonymous: name and email are required
    """
    # Try to get current user if authenticated
    current_user = get_optional_user(request, db)
    
    # If user is authenticated, use their info
    if current_user:
        new_feedback = Feedback(
            user_id=current_user.id,
            message=feedback_data.message,
        )
    else:
        # Anonymous user - require name and email
        if not feedback_data.name or not feedback_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Name and email are required for anonymous feedback"
            )
        new_feedback = Feedback(
            name=feedback_data.name,
            email=feedback_data.email,
            message=feedback_data.message,
        )
    
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    
    # Build response with user info if available
    response_data = {
        "id": new_feedback.id,
        "user_id": new_feedback.user_id,
        "name": new_feedback.name,
        "email": new_feedback.email,
        "message": new_feedback.message,
        "created_at": new_feedback.created_at.isoformat(),
        "username": None,
        "user_email": None,
    }
    
    # If feedback has user_id, fetch user info
    if new_feedback.user_id and new_feedback.user:
        response_data["username"] = new_feedback.user.username
        response_data["user_email"] = new_feedback.user.email if new_feedback.user.email else None
    
    return FeedbackResponse(**response_data)


@router.get("/", response_model=List[FeedbackResponse])
def get_all_feedback(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """
    Get all feedback (admin only).
    Returns feedback sorted by newest first.
    """
    feedback_list = db.query(Feedback).order_by(Feedback.created_at.desc()).all()
    
    result = []
    for feedback in feedback_list:
        response_data = {
            "id": feedback.id,
            "user_id": feedback.user_id,
            "name": feedback.name,
            "email": feedback.email,
            "message": feedback.message,
            "created_at": feedback.created_at.isoformat(),
            "username": None,
            "user_email": None,
        }
        
        # If feedback has user_id, fetch user info
        if feedback.user_id and feedback.user:
            response_data["username"] = feedback.user.username
            response_data["user_email"] = feedback.user.email if feedback.user.email else None
        
        result.append(FeedbackResponse(**response_data))
    
    return result

