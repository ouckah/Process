from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_, distinct
from typing import List, Optional
from datetime import datetime

from database import get_db
from models import Process, ProcessStatus, User, Stage
from schemas import (
    ExploreProcessResponse,
    ExploreFiltersResponse,
    ExploreStatsResponse,
    ExploreProcessPaginatedResponse,
    StageResponse,
)
from routes.processes import calculate_status_from_stages
from rate_limiter import limiter

router = APIRouter(prefix="/api/explore", tags=["explore"])


@router.get("/processes", response_model=ExploreProcessPaginatedResponse)
@limiter.limit("60/minute")
def get_explore_processes(
    request: Request,
    search: Optional[str] = Query(None, description="Search text for company, position, or stage names"),
    company: Optional[str] = Query(None, description="Filter by company name"),
    stage: Optional[str] = Query(None, description="Filter by stage name"),
    position: Optional[str] = Query(None, description="Filter by position"),
    status: Optional[str] = Query(None, description="Filter by status (active, completed, rejected)"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_db)
):
    """
    Get public processes with filtering and search.
    Returns paginated list of processes with full details including stages.
    """
    # Base query: only public processes with share_id
    query = db.query(Process).options(joinedload(Process.stages), joinedload(Process.user)).filter(
        Process.is_public == True,
        Process.share_id.isnot(None)
    )
    
    # Apply filters
    if company:
        query = query.filter(Process.company_name.ilike(f"%{company}%"))
    
    if position:
        query = query.filter(Process.position.ilike(f"%{position}%"))
    
    if status:
        try:
            status_enum = ProcessStatus(status.lower())
            query = query.filter(Process.status == status_enum)
        except ValueError:
            pass  # Invalid status, ignore
    
    # Search across company, position, and stage names
    if search:
        search_term = f"%{search}%"
        # Search in company name or position
        query = query.filter(
            or_(
                Process.company_name.ilike(search_term),
                Process.position.ilike(search_term)
            )
        )
        # Also filter by stages that match search
        stage_ids = db.query(Stage.process_id).filter(
            Stage.stage_name.ilike(search_term)
        ).subquery()
        query = query.filter(
            or_(
                Process.id.in_(db.query(stage_ids.c.process_id)),
                Process.company_name.ilike(search_term),
                Process.position.ilike(search_term)
            )
        )
    
    # Filter by stage if provided
    if stage:
        stage_process_ids = db.query(Stage.process_id).filter(
            Stage.stage_name.ilike(f"%{stage}%")
        ).subquery()
        query = query.filter(Process.id.in_(db.query(stage_process_ids.c.process_id)))
    
    # Get total count before pagination
    total = query.count()
    
    # Calculate total pages
    total_pages = (total + limit - 1) // limit if total > 0 else 1
    
    # Apply pagination
    offset = (page - 1) * limit
    processes = query.order_by(Process.created_at.desc()).offset(offset).limit(limit).all()
    
    # Build response
    result = []
    for p in processes:
        calculated_status = calculate_status_from_stages(p.stages)
        
        # Get user info (respect privacy)
        user_username = None
        user_display_name = None
        user_is_anonymous = p.user.is_anonymous if p.user else True
        user_discord_avatar = None
        user_discord_id = None
        
        if p.user and not user_is_anonymous:
            user_username = p.user.username
            user_display_name = p.user.display_name
            user_discord_avatar = p.user.discord_avatar
            user_discord_id = p.user.discord_id
        elif p.user and user_is_anonymous:
            user_display_name = p.user.display_name
        
        # Format stages
        stage_responses = [
            StageResponse(
                id=s.id,
                process_id=s.process_id,
                stage_name=s.stage_name,
                stage_date=s.stage_date.isoformat(),
                notes=s.notes,
                order=s.order,
                created_at=s.created_at.isoformat(),
                updated_at=s.updated_at.isoformat(),
            )
            for s in sorted(p.stages, key=lambda s: s.stage_date)
        ]
        
        result.append(ExploreProcessResponse(
            id=p.id,
            company_name=p.company_name,
            position=p.position,
            status=calculated_status.value,
            is_public=p.is_public,
            share_id=p.share_id,
            created_at=p.created_at.isoformat(),
            updated_at=p.updated_at.isoformat(),
            stages=stage_responses,
            user_username=user_username,
            user_display_name=user_display_name,
            user_is_anonymous=user_is_anonymous,
            user_discord_avatar=user_discord_avatar,
            user_discord_id=user_discord_id,
        ))
    
    return ExploreProcessPaginatedResponse(
        processes=result,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages
    )


@router.get("/companies", response_model=List[str])
@limiter.limit("30/minute")
def get_explore_companies(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get distinct list of companies from public processes (for filter dropdown).
    """
    companies = db.query(distinct(Process.company_name)).filter(
        Process.is_public == True,
        Process.share_id.isnot(None)
    ).order_by(Process.company_name).all()
    
    return [c[0] for c in companies if c[0]]


@router.get("/stages", response_model=List[str])
@limiter.limit("30/minute")
def get_explore_stages(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get distinct list of stage names from public processes (for filter dropdown).
    """
    # Get stage names from public processes only
    public_process_ids = db.query(Process.id).filter(
        Process.is_public == True,
        Process.share_id.isnot(None)
    ).subquery()
    
    stages = db.query(distinct(Stage.stage_name)).filter(
        Stage.process_id.in_(db.query(public_process_ids.c.id))
    ).order_by(Stage.stage_name).all()
    
    return [s[0] for s in stages if s[0]]


@router.get("/stats", response_model=ExploreStatsResponse)
@limiter.limit("30/minute")
def get_explore_stats(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Get aggregate statistics for the explore page.
    """
    # Count public processes
    total_processes = db.query(Process).filter(
        Process.is_public == True,
        Process.share_id.isnot(None)
    ).count()
    
    # Count distinct companies
    total_companies = db.query(func.count(distinct(Process.company_name))).filter(
        Process.is_public == True,
        Process.share_id.isnot(None)
    ).scalar()
    
    # Count distinct users with public processes
    total_users = db.query(func.count(distinct(Process.user_id))).filter(
        Process.is_public == True,
        Process.share_id.isnot(None)
    ).scalar()
    
    return ExploreStatsResponse(
        total_processes=total_processes,
        total_companies=total_companies or 0,
        total_users=total_users or 0,
    )
