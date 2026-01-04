"""
Profile routes for public user profiles.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from models import Process, User, ProcessStatus
from schemas import ProcessResponse, PublicProfileResponse
from models import ProfileComment
from auth import get_user_by_username

router = APIRouter(prefix="/api/profiles", tags=["profiles"])


def calculate_status_from_stages(stages: List) -> ProcessStatus:
    """
    Calculate process status based on the most recent stage.
    - If most recent stage is "Reject" → REJECTED
    - If most recent stage is "Offer" → COMPLETED
    - Otherwise → ACTIVE
    """
    if not stages:
        return ProcessStatus.ACTIVE
    
    # Get the most recent stage (stages are ordered by 'order' field)
    most_recent_stage = stages[-1] if stages else None
    
    if not most_recent_stage:
        return ProcessStatus.ACTIVE
    
    stage_name_lower = most_recent_stage.stage_name.lower().strip()
    
    if stage_name_lower == "reject":
        return ProcessStatus.REJECTED
    elif stage_name_lower == "offer":
        return ProcessStatus.COMPLETED
    else:
        return ProcessStatus.ACTIVE


@router.get("/discord/{discord_id}/username")
def get_username_by_discord_id(
    discord_id: str,
    db: Session = Depends(get_db)
):
    """
    Get username for a user by Discord ID.
    Returns 404 if user doesn't exist.
    No authentication required - read-only check.
    """
    from auth import get_user_by_discord_id
    
    user = get_user_by_discord_id(db, discord_id)
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"username": user.username, "discord_id": user.discord_id}


@router.get("/{username}", response_model=PublicProfileResponse)
def get_public_profile(
    username: str,
    db: Session = Depends(get_db)
):
    """
    Get public profile information for a user by username.
    Returns user info and all public processes.
    No authentication required.
    """
    # URL decode the username in case it has special characters
    import urllib.parse
    username = urllib.parse.unquote(username)
    
    user = get_user_by_username(db, username)
    
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")
    
    # Get all public processes for this user
    # A process is public if is_public is True AND it has a share_id
    processes = db.query(Process).options(joinedload(Process.stages)).filter(
        Process.user_id == user.id,
        Process.is_public.is_(True),
        Process.share_id.isnot(None)
    ).all()
    
    # Calculate status for each process and format response
    process_list = []
    offers_count = 0
    active_count = 0
    rejected_count = 0
    
    for p in processes:
        calculated_status = calculate_status_from_stages(p.stages)
        
        if calculated_status == ProcessStatus.COMPLETED:
            offers_count += 1
        elif calculated_status == ProcessStatus.ACTIVE:
            active_count += 1
        elif calculated_status == ProcessStatus.REJECTED:
            rejected_count += 1
        
        process_list.append(ProcessResponse(
            id=p.id,
            company_name=p.company_name,
            position=p.position,
            status=calculated_status.value,
            is_public=p.is_public,
            share_id=p.share_id,
            created_at=p.created_at.isoformat(),
            updated_at=p.updated_at.isoformat(),
        ))
    
    # Get comment count
    comment_count = db.query(ProfileComment).filter(
        ProfileComment.profile_user_id == user.id,
        ProfileComment.is_deleted == False
    ).count()
    
    # Determine display name based on anonymization
    display_name = None
    if user.is_anonymous:
        display_name = user.display_name or "Anonymous User"
    
    return PublicProfileResponse(
        username=user.username,
        display_name=display_name,
        discord_avatar=user.discord_avatar,
        discord_id=user.discord_id,  # Include for avatar URL generation
        is_anonymous=user.is_anonymous,
        comments_enabled=user.comments_enabled,
        account_created_at=user.created_at.isoformat(),
        processes=process_list,
        stats={
            "total_public_processes": len(process_list),
            "offers_received": offers_count,
            "active_applications": active_count,
            "rejected": rejected_count,
            "success_rate": round(offers_count / len(process_list) * 100, 1) if len(process_list) > 0 else 0.0,
            "comment_count": comment_count
        }
    )

