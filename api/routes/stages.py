import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import List

from database import get_db
from models import Stage, Process, User, ProcessStatus
from schemas import StageCreate, StageResponse, StageUpdate, StageReorderRequest, StageReorderItem
from auth import get_current_user


router = APIRouter(prefix="/api/stages", tags=["stages"])


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


@router.get("/{stage_id}", response_model=StageResponse)
def get_stage(
    stage_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get a stage by ID (only if owned by current user).
    """
    stage = db.query(Stage).join(Process).filter(
        Stage.id == stage_id,
        Process.user_id == current_user.id
    ).first()
    if not stage:
        raise HTTPException(status_code=404, detail=f"Stage with id {stage_id} not found")

    # Convert to response format with ISO string dates
    return StageResponse(
        id=stage.id,
        process_id=stage.process_id,
        stage_name=stage.stage_name,
        stage_date=stage.stage_date.isoformat(),
        notes=stage.notes,
        order=stage.order,
        created_at=stage.created_at.isoformat(),
        updated_at=stage.updated_at.isoformat(),
    )

@router.get("/process/{process_id}", response_model=List[StageResponse])
def get_stages(
    process_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all stages for a specific process.
    """
    # get the process that the stages are associated with
    process = db.query(Process).filter(
        Process.id == process_id,
        Process.user_id == current_user.id
    ).first()
    if not process:
        raise HTTPException(status_code=404, detail=f"Process with id {process_id} not found")
    
    # get all stages for the process, ordered by order
    stages = db.query(Stage).filter(Stage.process_id == process_id).order_by(Stage.order).all()
    
    return [
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
        for s in stages
    ]


@router.post("/", response_model=StageResponse)
def post_stage(
    stage_data: StageCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Add a new stage to a process.
    Allows duplicate stage names as long as the dates differ.
    """
    # get the process that the stage is associated with
    process = db.query(Process).filter(
        Process.id == stage_data.process_id,
        Process.user_id == current_user.id
    ).first()
    if not process:
        raise HTTPException(status_code=404, detail=f"Process with id {stage_data.process_id} not found")

    # Check for duplicate stage (same name and same date)
    existing_stage = db.query(Stage).filter(
        Stage.process_id == process.id,
        Stage.stage_name == stage_data.stage_name,
        Stage.stage_date == stage_data.stage_date
    ).first()
    
    if existing_stage:
        raise HTTPException(
            status_code=400,
            detail=f"A stage '{stage_data.stage_name}' already exists for this process on {stage_data.stage_date}. Use a different date to add another stage with the same name."
        )

    # create the new stage
    new_stage = Stage(
        process_id = process.id,
        stage_name = stage_data.stage_name,
        stage_date = stage_data.stage_date,
        notes = stage_data.notes,
        order = stage_data.order if stage_data.order is not None else db.query(Stage).filter(Stage.process_id == process.id).count() + 1    
    )

    # add to database
    db.add(new_stage)
    db.commit()
    db.refresh(new_stage)  # refresh to get the generated ID
    
    # Recalculate process status from stages
    db.refresh(process, ["stages"])
    calculated_status = calculate_status_from_stages(process.stages)
    if process.status != calculated_status:
        process.status = calculated_status
        db.commit()
    
    # Convert to response format with ISO string dates
    return StageResponse(
        id=new_stage.id,
        process_id=new_stage.process_id,
        stage_name=new_stage.stage_name,
        stage_date=new_stage.stage_date.isoformat(),
        notes=new_stage.notes,
        order=new_stage.order,
        created_at=new_stage.created_at.isoformat(),
        updated_at=new_stage.updated_at.isoformat(),
    )


@router.patch("/{stage_id}", response_model=StageResponse)
def update_stage(
    stage_id: int,
    update_data: StageUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a stage by ID (only if owned by current user).
    Only provided fields will be updated.
    """
    stage = db.query(Stage).join(Process).filter(
        Stage.id == stage_id,
        Process.user_id == current_user.id
    ).first()
    if not stage:
        raise HTTPException(status_code=404, detail=f"Stage with id {stage_id} not found")

    # update only the fields that are provided
    if update_data.stage_name is not None:
        stage.stage_name = update_data.stage_name
    if update_data.stage_date is not None:
        stage.stage_date = update_data.stage_date
    if update_data.notes is not None:
        stage.notes = update_data.notes
    if update_data.order is not None:
        stage.order = update_data.order

    db.commit()
    db.refresh(stage)
    
    # Recalculate process status from stages
    process = db.query(Process).options(joinedload(Process.stages)).filter(Process.id == stage.process_id).first()
    if process:
        calculated_status = calculate_status_from_stages(process.stages)
        if process.status != calculated_status:
            process.status = calculated_status
            db.commit()

    # Convert to response format with ISO string dates
    return StageResponse(
        id=stage.id,
        process_id=stage.process_id,
        stage_name=stage.stage_name,
        stage_date=stage.stage_date.isoformat(),
        notes=stage.notes,
        order=stage.order,
        created_at=stage.created_at.isoformat(),
        updated_at=stage.updated_at.isoformat(),
    )


@router.delete("/{stage_id}", response_model=StageResponse)
def delete_stage(
    stage_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a stage by ID (only if owned by current user).
    """
    stage = db.query(Stage).join(Process).filter(
        Stage.id == stage_id,
        Process.user_id == current_user.id
    ).first()
    if not stage:
        raise HTTPException(status_code=404, detail=f"Stage with id {stage_id} not found")

    # Store stage data before deletion
    process_id = stage.process_id
    stage_data = {
        "id": stage.id,
        "process_id": stage.process_id,
        "stage_name": stage.stage_name,
        "stage_date": stage.stage_date.isoformat(),
        "notes": stage.notes,
        "order": stage.order,
        "created_at": stage.created_at.isoformat(),
        "updated_at": stage.updated_at.isoformat(),
    }
    
    db.delete(stage)
    db.commit()
    
    # Recalculate process status from remaining stages
    process = db.query(Process).options(joinedload(Process.stages)).filter(Process.id == process_id).first()
    if process:
        calculated_status = calculate_status_from_stages(process.stages)
        if process.status != calculated_status:
            process.status = calculated_status
            db.commit()

    return StageResponse(**stage_data)


@router.post("/reorder", response_model=List[StageResponse])
def reorder_stages(
    reorder_data: StageReorderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Batch reorder stages for a process.
    Updates the order of multiple stages at once.
    """
    if not reorder_data.stages:
        raise HTTPException(status_code=400, detail="No stages provided for reordering")
    
    # Get the first stage to verify process ownership
    first_stage = db.query(Stage).join(Process).filter(
        Stage.id == reorder_data.stages[0].id,
        Process.user_id == current_user.id
    ).first()
    
    if not first_stage:
        raise HTTPException(status_code=404, detail="Stage not found or access denied")
    
    process_id = first_stage.process_id
    
    # Verify all stages belong to the same process and user
    stage_ids = [item.id for item in reorder_data.stages]
    stages = db.query(Stage).join(Process).filter(
        Stage.id.in_(stage_ids),
        Process.user_id == current_user.id,
        Process.id == process_id
    ).all()
    
    if len(stages) != len(stage_ids):
        raise HTTPException(status_code=400, detail="Some stages not found or access denied")
    
    # Create a mapping of stage_id -> new order
    order_map = {item.id: item.order for item in reorder_data.stages}
    
    # Update orders
    for stage in stages:
        if stage.id in order_map:
            stage.order = order_map[stage.id]
    
    db.commit()
    
    # Refresh all stages and return them in new order
    db.refresh(first_stage, ["process"])
    process = first_stage.process
    db.refresh(process, ["stages"])
    
    # Recalculate process status from stages
    calculated_status = calculate_status_from_stages(process.stages)
    if process.status != calculated_status:
        process.status = calculated_status
        db.commit()
    
    # Return all stages for the process in new order
    updated_stages = db.query(Stage).filter(Stage.process_id == process_id).order_by(Stage.order).all()
    
    return [
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
        for s in updated_stages
    ]