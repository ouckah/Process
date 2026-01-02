import datetime
import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, or_
from typing import List

from database import get_db
from models import Process, ProcessStatus, User
from schemas import ProcessCreate, ProcessResponse, ProcessUpdate, ProcessDetailResponse, StageResponse, ProcessShareToggle
from auth import get_current_user

router = APIRouter(prefix="/api/processes", tags=["processes"])


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
    # The last stage in the list should be the most recent
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


@router.get("/{process_id}", response_model=ProcessResponse)
def get_process(
    process_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a process by ID (only if owned by current user).
    Status is automatically calculated from the most recent stage.
    """
    process = db.query(Process).options(joinedload(Process.stages)).filter(
        Process.id == process_id,
        Process.user_id == current_user.id
    ).first()
    if not process:
        raise HTTPException(status_code=404, detail=f"Process with id {process_id} not found")
    
    # Calculate status from stages
    calculated_status = calculate_status_from_stages(process.stages)
    # Update database if status changed
    if process.status != calculated_status:
        process.status = calculated_status
        db.commit()
    
    # Convert to response format with ISO string dates
    return ProcessResponse(
        id=process.id,
        company_name=process.company_name,
        position=process.position,
        status=calculated_status.value,
        is_public=process.is_public,
        share_id=process.share_id,
        created_at=process.created_at.isoformat(),
        updated_at=process.updated_at.isoformat(),
    )


@router.get("/{process_id}/detail", response_model=ProcessDetailResponse)
def get_process_detail(
    process_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a process by ID with all stages included (only if owned by current user).
    """
    process = db.query(Process).options(
        joinedload(Process.stages)
    ).filter(
        Process.id == process_id,
        Process.user_id == current_user.id
    ).first()
    
    if not process:
        raise HTTPException(status_code=404, detail=f"Process with id {process_id} not found")
    
    # Calculate status from stages
    calculated_status = calculate_status_from_stages(process.stages)
    # Update database if status changed
    if process.status != calculated_status:
        process.status = calculated_status
        db.commit()
    
    # Convert to response format with stages
    return {
        "id": process.id,
        "company_name": process.company_name,
        "position": process.position,
        "status": calculated_status.value,
        "is_public": process.is_public,
        "share_id": process.share_id,
        "created_at": process.created_at.isoformat(),
        "updated_at": process.updated_at.isoformat(),
        "stages": [
            {
                "id": s.id,
                "process_id": s.process_id,
                "stage_name": s.stage_name,
                "stage_date": s.stage_date.isoformat(),
                "notes": s.notes,
                "order": s.order,
                "created_at": s.created_at.isoformat(),
                "updated_at": s.updated_at.isoformat(),
            }
            for s in process.stages
        ]
    }


@router.get("/", response_model=List[ProcessResponse])
def get_processes(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all processes for the authenticated user.
    Status is automatically calculated from the most recent stage.
    """
    processes = db.query(Process).options(joinedload(Process.stages)).filter(Process.user_id == current_user.id).all()
    result = []
    for p in processes:
        # Calculate status from stages
        calculated_status = calculate_status_from_stages(p.stages)
        # Update database if status changed
        if p.status != calculated_status:
            p.status = calculated_status
            db.commit()
        
        result.append(ProcessResponse(
            id=p.id,
            company_name=p.company_name,
            position=p.position,
            status=calculated_status.value,
            is_public=p.is_public,
            share_id=p.share_id,
            created_at=p.created_at.isoformat(),
            updated_at=p.updated_at.isoformat(),
        ))
    return result


@router.post("/", response_model=ProcessResponse, status_code=201)
def post_process(
    process_data: ProcessCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new process for the authenticated user.
    Status is automatically set to ACTIVE (will be calculated from stages later).
    Prevents duplicate processes with the same company name and position (case-insensitive).
    """
    # Check for duplicate process (same company name and position, case-insensitive)
    # Normalize position: treat None, empty string, or whitespace-only as None
    position_value = process_data.position.strip() if process_data.position and process_data.position.strip() else None
    
    # Build query for case-insensitive company name match
    query = db.query(Process).filter(
        Process.user_id == current_user.id,
        func.lower(Process.company_name) == func.lower(process_data.company_name)
    )
    
    # Handle position matching: both None/empty or both same (case-insensitive)
    if position_value is None:
        # Match processes where position is None, empty string, or whitespace-only
        # This prevents creating duplicate processes with same company and no job title
        query = query.filter(
            or_(
                Process.position.is_(None),
                Process.position == "",
                func.trim(Process.position) == ""
            )
        )
    else:
        # Match processes where position matches (case-insensitive, trimmed)
        # This prevents creating duplicate processes with same company and same job title
        query = query.filter(
            func.lower(func.trim(Process.position)) == func.lower(position_value)
        )
    
    existing_process = query.first()
    
    if existing_process:
        position_text = f" for position '{position_value}'" if position_value else ""
        raise HTTPException(
            status_code=400,
            detail=f"A process for company '{process_data.company_name}'{position_text} already exists. Please use a different company name or position."
        )
    
    # Status is ignored - always starts as ACTIVE (no stages yet)
    new_process = Process(
        user_id = current_user.id,  # Get from authenticated user
        company_name = process_data.company_name,
        position = position_value,
        status = ProcessStatus.ACTIVE,  # Always ACTIVE for new processes
    )
    
    # add to database
    db.add(new_process)
    db.commit()
    db.refresh(new_process)  # refresh to get the generated ID
    
    # Convert to response format with ISO string dates
    return ProcessResponse(
        id=new_process.id,
        company_name=new_process.company_name,
        position=new_process.position,
        status=new_process.status.value,
        is_public=new_process.is_public,
        share_id=new_process.share_id,
        created_at=new_process.created_at.isoformat(),
        updated_at=new_process.updated_at.isoformat(),
    )


@router.patch("/{process_id}", response_model=ProcessResponse)
def update_process(
    process_id: int,
    update_data: ProcessUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a process by ID (only if owned by current user).
    Only provided fields will be updated.
    Prevents duplicate processes with the same company name and position (case-insensitive).
    """
    process = db.query(Process).filter(
        Process.id == process_id,
        Process.user_id == current_user.id
    ).first()
    if not process:
        raise HTTPException(status_code=404, detail=f"Process with id {process_id} not found")
    
    # Determine the new values (use existing if not provided in update)
    new_company_name = update_data.company_name if update_data.company_name is not None else process.company_name
    new_position = update_data.position if update_data.position is not None else process.position
    # Normalize position: treat None, empty string, or whitespace-only as None
    new_position_value = new_position.strip() if new_position and new_position.strip() else None
    
    # Check if the update would create a duplicate (excluding the current process)
    # Only check if company_name or position is being changed
    if (update_data.company_name is not None or update_data.position is not None):
        query = db.query(Process).filter(
            Process.user_id == current_user.id,
            Process.id != process_id,  # Exclude the current process
            func.lower(Process.company_name) == func.lower(new_company_name)
        )
        
        # Handle position matching: both None/empty or both same (case-insensitive)
        if new_position_value is None:
            # Match processes where position is None, empty string, or whitespace-only
            # This prevents updating to create duplicate processes with same company and no job title
            query = query.filter(
                or_(
                    Process.position.is_(None),
                    Process.position == "",
                    func.trim(Process.position) == ""
                )
            )
        else:
            # Match processes where position matches (case-insensitive, trimmed)
            # This prevents updating to create duplicate processes with same company and same job title
            query = query.filter(
                func.lower(func.trim(Process.position)) == func.lower(new_position_value)
            )
        
        existing_process = query.first()
        
        if existing_process:
            position_text = f" for position '{new_position_value}'" if new_position_value else ""
            raise HTTPException(
                status_code=400,
                detail=f"A process for company '{new_company_name}'{position_text} already exists. Please use a different company name or position."
            )
    
    # update only the fields that are provided
    # Status is ignored - it's automatically calculated from stages
    if update_data.company_name is not None:
        process.company_name = update_data.company_name
    if update_data.position is not None:
        process.position = new_position_value
    
    # Load stages to calculate status
    db.refresh(process, ["stages"])
    # Calculate status from stages
    calculated_status = calculate_status_from_stages(process.stages)
    process.status = calculated_status

    db.commit()
    db.refresh(process)
    
    # Convert to response format with ISO string dates
    return ProcessResponse(
        id=process.id,
        company_name=process.company_name,
        position=process.position,
        status=calculated_status.value,
        is_public=process.is_public,
        share_id=process.share_id,
        created_at=process.created_at.isoformat(),
        updated_at=process.updated_at.isoformat(),
    )


@router.delete("/{process_id}", response_model=ProcessResponse)
def delete_process(
    process_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a process by ID (only if owned by current user).
    """
    process = db.query(Process).filter(
        Process.id == process_id,
        Process.user_id == current_user.id
    ).first()
    if not process:
        raise HTTPException(status_code=404, detail=f"Process with id {process_id} not found")
    
    # Store process data before deletion
    process_data = {
        "id": process.id,
        "company_name": process.company_name,
        "position": process.position,
        "status": process.status.value,
        "is_public": process.is_public,
        "share_id": process.share_id,
        "created_at": process.created_at.isoformat(),
        "updated_at": process.updated_at.isoformat(),
    }
    
    db.delete(process)
    db.commit()

    return ProcessResponse(**process_data)


@router.get("/share/{share_id}", response_model=ProcessDetailResponse)
def get_public_process(
    share_id: str,
    db: Session = Depends(get_db)
):
    """
    Get a public process by share ID (no authentication required).
    """
    process = db.query(Process).options(
        joinedload(Process.stages)
    ).filter(
        Process.share_id == share_id,
        Process.is_public == True
    ).first()
    
    if not process:
        raise HTTPException(status_code=404, detail="Process not found or not publicly shared")
    
    # Calculate status from stages
    calculated_status = calculate_status_from_stages(process.stages)
    
    # Convert to response format with stages
    return {
        "id": process.id,
        "company_name": process.company_name,
        "position": process.position,
        "status": calculated_status.value,
        "is_public": process.is_public,
        "share_id": process.share_id,
        "created_at": process.created_at.isoformat(),
        "updated_at": process.updated_at.isoformat(),
        "stages": [
            {
                "id": s.id,
                "process_id": s.process_id,
                "stage_name": s.stage_name,
                "stage_date": s.stage_date.isoformat(),
                "notes": s.notes,
                "order": s.order,
                "created_at": s.created_at.isoformat(),
                "updated_at": s.updated_at.isoformat(),
            }
            for s in process.stages
        ]
    }


@router.patch("/{process_id}/share", response_model=ProcessResponse)
def toggle_process_sharing(
    process_id: int,
    share_data: ProcessShareToggle,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Toggle public sharing for a process.
    If making public, generates a share_id. If making private, removes share_id.
    """
    process = db.query(Process).filter(
        Process.id == process_id,
        Process.user_id == current_user.id
    ).first()
    
    if not process:
        raise HTTPException(status_code=404, detail=f"Process with id {process_id} not found")
    
    process.is_public = share_data.is_public
    if share_data.is_public:
        # Generate share_id if making public
        if not process.share_id:
            process.share_id = str(uuid.uuid4())
    else:
        # Remove share_id if making private
        process.share_id = None
    
    # Load stages to calculate status
    db.refresh(process, ["stages"])
    # Calculate status from stages
    calculated_status = calculate_status_from_stages(process.stages)
    process.status = calculated_status
    
    db.commit()
    db.refresh(process)
    
    # Convert to response format with ISO string dates
    return ProcessResponse(
        id=process.id,
        company_name=process.company_name,
        position=process.position,
        status=calculated_status.value,
        is_public=process.is_public,
        share_id=process.share_id,
        created_at=process.created_at.isoformat(),
        updated_at=process.updated_at.isoformat(),
    )