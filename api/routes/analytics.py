"""
Analytics routes for public analytics data and Sankey diagram generation.
"""
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.orm import Session, joinedload
from typing import List, Dict, Any
import io
import urllib.parse

from database import get_db
from models import Process, User, ProcessStatus, Stage
from schemas import ProcessResponse, ProcessDetailResponse, StageResponse
from auth import get_user_by_username

router = APIRouter(prefix="/api/analytics", tags=["analytics"])


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


def get_public_processes_for_user(db: Session, user: User) -> tuple[List[Process], List[Dict[str, Any]]]:
    """
    Get all public processes for a user with their stages.
    Returns tuple of (processes, process_details).
    """
    # Get all public processes for this user
    # A process is public if is_public is True AND it has a share_id
    processes = db.query(Process).options(joinedload(Process.stages)).filter(
        Process.user_id == user.id,
        Process.is_public.is_(True),
        Process.share_id.isnot(None)
    ).all()
    
    # Format process responses
    process_list = []
    process_details = []
    
    for p in processes:
        calculated_status = calculate_status_from_stages(p.stages)
        
        process_response = ProcessResponse(
            id=p.id,
            company_name=p.company_name,
            position=p.position,
            status=calculated_status.value,
            is_public=p.is_public,
            share_id=p.share_id,
            created_at=p.created_at.isoformat(),
            updated_at=p.updated_at.isoformat(),
        )
        process_list.append(process_response)
        
        # Create process detail with stages
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
        
        process_detail = ProcessDetailResponse(
            **process_response.model_dump(),
            stages=stage_responses
        )
        process_details.append(process_detail.model_dump())
    
    return process_list, process_details


@router.get("/{username}/public")
def get_public_analytics(
    username: str,
    db: Session = Depends(get_db)
):
    """
    Get public analytics data for a user by username.
    Returns user info, public processes with details, and analytics stats.
    No authentication required.
    """
    # URL decode the username in case it has special characters
    username = urllib.parse.unquote(username)
    
    user = get_user_by_username(db, username)
    
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")
    
    # Get public processes
    process_list, process_details = get_public_processes_for_user(db, user)
    
    # Calculate stage counts for stats
    stage_counts: Dict[str, int] = {}
    for detail in process_details:
        for stage in detail.get("stages", []):
            stage_name = stage.get("stage_name")
            if stage_name:
                stage_counts[stage_name] = stage_counts.get(stage_name, 0) + 1
    
    # Determine display name based on anonymization
    display_name = None
    if user.is_anonymous:
        display_name = user.display_name or "Anonymous User"
    
    return {
        "username": user.username,
        "display_name": display_name,
        "is_anonymous": user.is_anonymous,
        "processes": process_list,
        "process_details": process_details,
        "stats": {
            "total_public_processes": len(process_list),
            "stage_counts": stage_counts
        }
    }


def transform_processes_to_sankey(processes: List[Dict], process_details: List[Dict]) -> Dict[str, Any]:
    """
    Transform process data into Sankey format.
    Reused from bot/commands/sankey.py logic.
    """
    # Create a map for quick lookup
    process_details_map = {pd["id"]: pd for pd in process_details}
    
    # Track all unique stage names and transitions
    node_set = set()
    node_count_map = {}  # stage name -> total count
    link_map = {}  # "source->target" -> count
    
    # Analyze each process to get actual stage transitions
    for process in processes:
        detail = process_details_map.get(process["id"])
        stages = detail.get("stages", []) if detail else []
        
        if not stages:
            continue
        
        # Sort stages by date to get chronological order
        sorted_stages = sorted(stages, key=lambda s: s.get("stage_date", ""))
        
        # Add all stage names to node set and count occurrences
        for stage in sorted_stages:
            stage_name = stage.get("stage_name")
            if stage_name:
                node_set.add(stage_name)
                node_count_map[stage_name] = node_count_map.get(stage_name, 0) + 1
        
        # Count transitions between consecutive stages
        for i in range(len(sorted_stages) - 1):
            source = sorted_stages[i].get("stage_name")
            target = sorted_stages[i + 1].get("stage_name")
            if source and target:
                key = f"{source}->{target}"
                link_map[key] = link_map.get(key, 0) + 1
    
    # Order nodes by typical flow
    stage_order = [
        'Applied',
        'OA',
        'Phone Screen',
        'Technical Interview',
        'HM Interview',
        'Final Interview',
        'On-site Interview',
        'Take-home Assignment',
        'System Design',
        'Behavioral Interview',
        'Coding Challenge',
        'Offer',
        'Reject',
        'Other',
    ]
    
    # Create nodes array - ordered by typical flow, then any others
    ordered_nodes = [s for s in stage_order if s in node_set]
    other_nodes = [s for s in node_set if s not in stage_order]
    nodes = [{"name": name, "count": node_count_map.get(name, 0)} for name in ordered_nodes + other_nodes]
    
    # Create node index map
    node_index_map = {node["name"]: idx for idx, node in enumerate(nodes)}
    
    # Create links array from actual transitions
    links = []
    for key, value in link_map.items():
        source, target = key.split("->")
        source_index = node_index_map.get(source)
        target_index = node_index_map.get(target)
        
        if source_index is not None and target_index is not None:
            links.append({
                "source": source_index,
                "target": target_index,
                "value": value
            })
    
    return {"nodes": nodes, "links": links}


def generate_sankey_image(sankey_data: Dict[str, Any]) -> bytes:
    """Generate a Sankey diagram image using matplotlib."""
    try:
        import matplotlib
        matplotlib.use('Agg')  # Use non-interactive backend
        import matplotlib.pyplot as plt
        from matplotlib.patches import FancyBboxPatch, PathPatch
        from matplotlib.path import Path
    except ImportError:
        raise ImportError("matplotlib is required for Sankey diagram generation. Install with: pip install matplotlib")
    
    nodes = sankey_data["nodes"]
    links = sankey_data["links"]
    
    if not nodes or not links:
        raise ValueError("No data to visualize")
    
    # Stage colors matching the frontend
    COLORS = {
        'Applied': '#FDE68A',
        'OA': '#3B82F6',
        'Phone Screen': '#60A5FA',
        'Technical Interview': '#818CF8',
        'HM Interview': '#A78BFA',
        'Final Interview': '#C084FC',
        'On-site Interview': '#E879F9',
        'Take-home Assignment': '#F472B6',
        'System Design': '#FB7185',
        'Behavioral Interview': '#F87171',
        'Coding Challenge': '#EF4444',
        'Offer': '#10B981',
        'Reject': '#EF4444',
        'Other': '#6B7280',
    }
    
    # Create figure
    fig, ax = plt.subplots(figsize=(14, 8))
    ax.set_xlim(0, 10)
    ax.set_ylim(0, len(nodes) + 1)
    ax.axis('off')
    
    # Calculate node positions (vertical layout)
    node_height = 0.6
    node_width = 1.5
    spacing = 1.0
    start_y = len(nodes) * spacing / 2
    
    node_positions = {}
    for i, node in enumerate(nodes):
        y_pos = start_y - i * spacing
        node_positions[i] = {
            'x': 1.5,
            'y': y_pos,
            'width': node_width,
            'height': node_height,
            'name': node["name"],
            'count': node.get("count", 0),
            'color': COLORS.get(node["name"], '#8884d8')
        }
    
    # Draw nodes
    for idx, pos in node_positions.items():
        # Draw node rectangle
        rect = FancyBboxPatch(
            (pos['x'], pos['y'] - pos['height']/2),
            pos['width'],
            pos['height'],
            boxstyle="round,pad=0.05",
            facecolor=pos['color'],
            edgecolor='black',
            linewidth=1.5
        )
        ax.add_patch(rect)
        
        # Draw count text (above)
        ax.text(
            pos['x'] + pos['width']/2,
            pos['y'] + pos['height']/2 + 0.15,
            str(pos['count']),
            ha='center',
            va='bottom',
            fontsize=14,
            fontweight='bold'
        )
        
        # Draw name text (below)
        ax.text(
            pos['x'] + pos['width']/2,
            pos['y'] - pos['height']/2 - 0.15,
            pos['name'],
            ha='center',
            va='top',
            fontsize=12
        )
    
    # Draw links (curved paths)
    for link in links:
        source_idx = link["source"]
        target_idx = link["target"]
        value = link["value"]
        
        source_pos = node_positions[source_idx]
        target_pos = node_positions[target_idx]
        
        # Calculate connection points
        source_x = source_pos['x'] + source_pos['width']
        source_y = source_pos['y']
        target_x = target_pos['x']
        target_y = target_pos['y']
        
        # Draw curved path using Bezier curve
        verts = [
            (source_x, source_y),
            ((source_x + target_x) / 2, source_y),  # Control point 1
            ((source_x + target_x) / 2, target_y),  # Control point 2
            (target_x, target_y),
        ]
        codes = [Path.MOVETO, Path.CURVE4, Path.CURVE4, Path.CURVE4]
        
        path = Path(verts, codes)
        patch = PathPatch(
            path,
            facecolor='none',
            edgecolor=target_pos['color'],
            linewidth=max(1, value * 2),  # Thicker lines for higher values
            alpha=0.6
        )
        ax.add_patch(patch)
    
    # Add title
    ax.text(
        5,
        len(nodes) * spacing + 0.5,
        'Stage Flow (Sankey Diagram)',
        ha='center',
        va='bottom',
        fontsize=16,
        fontweight='bold'
    )
    
    # Save to bytes
    buf = io.BytesIO()
    plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
    buf.seek(0)
    plt.close(fig)
    
    return buf.getvalue()


@router.get("/{username}/sankey-image")
def get_sankey_image(
    username: str,
    db: Session = Depends(get_db)
):
    """
    Generate and return a Sankey diagram image for a user's public processes.
    Returns PNG image.
    No authentication required.
    """
    # URL decode the username
    username = urllib.parse.unquote(username)
    
    user = get_user_by_username(db, username)
    
    if not user:
        raise HTTPException(status_code=404, detail=f"User '{username}' not found")
    
    # Get public processes
    process_list, process_details = get_public_processes_for_user(db, user)
    
    if not process_list or not process_details:
        raise HTTPException(
            status_code=404,
            detail="No public processes found for this user"
        )
    
    # Transform to Sankey data
    sankey_data = transform_processes_to_sankey(
        [p.model_dump() for p in process_list],
        process_details
    )
    
    if not sankey_data["nodes"] or not sankey_data["links"]:
        raise HTTPException(
            status_code=400,
            detail="Insufficient data to generate Sankey diagram. Add more stages to your processes."
        )
    
    # Generate image
    try:
        image_bytes = generate_sankey_image(sankey_data)
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Image generation not available: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate image: {str(e)}"
        )
    
    # Return image response
    return Response(content=image_bytes, media_type="image/png")

