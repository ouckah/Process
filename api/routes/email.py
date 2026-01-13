"""
Internal email processing routes for digest management.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from database import get_db
from email_service import process_pending_digests
import os

router = APIRouter(prefix="/api/internal", tags=["internal"])

# Simple API key for internal endpoints (set via env var)
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY", "")


def verify_internal_key(request_key: str = None):
    """Verify internal API key for security."""
    if not INTERNAL_API_KEY:
        # If no key is set, allow access (for development)
        return True
    if not request_key or request_key != INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid internal API key"
        )
    return True


@router.post("/process-email-digests")
def process_email_digests_endpoint(
    api_key: str = None,
    db: Session = Depends(get_db)
):
    """
    Process pending email digests.
    Can be called by cron job or scheduler.
    Requires INTERNAL_API_KEY if set in environment.
    """
    try:
        verify_internal_key(api_key)
        count = process_pending_digests(db)
        return {
            "success": True,
            "digests_sent": count,
            "message": f"Processed {count} digest emails"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing digests: {str(e)}"
        )
