import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from api.database import get_db
from api.models import Stage, Process, User
from api.schemas import StageCreate, StageResponse, StageUpdate
from api.auth import get_current_user


router = APIRouter(prefix="/api/stages", tags=["stages"])


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
    """
    # get the process that the stage is associated with
    process = db.query(Process).filter(
        Process.id == stage_data.process_id,
        Process.user_id == current_user.id
    ).first()
    if not process:
        raise HTTPException(status_code=404, detail=f"Process with id {stage_data.process_id} not found")

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

    return StageResponse(**stage_data)