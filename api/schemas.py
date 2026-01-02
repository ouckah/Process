import datetime
from pydantic import BaseModel, field_validator
from typing import Optional, List, Union, Any
from datetime import date, datetime


# Auth Schemas
class TokenResponse(BaseModel):
    """Schema for authentication token response."""
    access_token: str
    token_type: str


class UserRegister(BaseModel):
    """Schema for user registration."""
    email: str
    username: str
    password: str
    
    class Config:
        # Add example values for API docs
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "username": "johndoe",
                "password": "password123"
            }
        }


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    username: Optional[str] = None
    display_name: Optional[str] = None
    is_anonymous: Optional[bool] = None
    comments_enabled: Optional[bool] = None
    discord_privacy_mode: Optional[str] = None
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v):
        """Validate username format."""
        if v is None:
            return v
        if not v.strip():
            raise ValueError('Username cannot be empty')
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if len(v) > 30:
            raise ValueError('Username must be at most 30 characters long')
        # Allow alphanumeric, underscores, and hyphens
        if not v.replace('_', '').replace('-', '').isalnum():
            raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v.strip()
    
    @field_validator('display_name')
    @classmethod
    def validate_display_name(cls, v):
        """Validate display name format."""
        if v is None:
            return v
        v = v.strip()
        if not v:
            return None  # Empty string becomes None
        if len(v) > 100:
            raise ValueError('Display name must be at most 100 characters long')
        return v


class UserResponse(BaseModel):
    """Schema for user response."""
    id: int
    email: Optional[str] = None  # Can be None for ghost accounts (Discord-only users)
    username: str
    discord_id: Optional[str] = None
    google_id: Optional[str] = None
    display_name: Optional[str] = None
    is_anonymous: Optional[bool] = None
    comments_enabled: Optional[bool] = None

    class Config:
        from_attributes = True


# Process Schemas
class ProcessCreate(BaseModel):
    """Schema for creating a new process."""
    company_name: str
    position: Optional[str] = None
    status: str = "active"


class ProcessUpdate(BaseModel):
    """Schema for updating a process."""
    company_name: Optional[str] = None
    position: Optional[str] = None
    status: Optional[str] = None


class ProcessResponse(BaseModel):
    """Schema for process response."""
    id: int
    company_name: str
    position: Optional[str]
    status: str
    is_public: bool = False
    share_id: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True


# Stage Schemas
class StageCreate(BaseModel):
    """Schema for creating a new stage."""
    process_id: int
    stage_name: str
    stage_date: datetime
    notes: Optional[str] = None
    order: Optional[int] = None
    
    @field_validator('stage_date', mode='before')
    @classmethod
    def parse_datetime_string(cls, v):
        """Parse datetime from ISO string if needed."""
        if isinstance(v, str):
            try:
                # Handle Z suffix (UTC) - convert to +00:00 format
                # fromisoformat doesn't handle Z directly, so we need to replace it
                if v.endswith('Z'):
                    # Remove Z and add +00:00 for UTC timezone
                    v = v[:-1] + '+00:00'
                # Use fromisoformat which handles ISO 8601 format
                # This handles formats like: 2025-01-15T19:30:00.000+00:00
                parsed = datetime.fromisoformat(v)
                return parsed
            except (ValueError, AttributeError) as e:
                raise ValueError(f"Invalid datetime format: {v}. Error: {str(e)}")
        # If it's already a datetime, return as-is
        if isinstance(v, datetime):
            return v
        # If it's not a string or datetime, raise an error
        raise ValueError(f"Expected datetime or ISO string, got {type(v).__name__}: {v}")


class StageUpdate(BaseModel):
    """Schema for updating a stage."""
    stage_name: Optional[str] = None
    stage_date: Optional[datetime] = None
    notes: Optional[str] = None
    order: Optional[int] = None
    
    @field_validator('stage_date', mode='before')
    @classmethod
    def parse_datetime_string(cls, v):
        """Parse datetime from ISO string if needed."""
        if v is None:
            return None
        if isinstance(v, str):
            try:
                # Handle Z suffix (UTC) - convert to +00:00 format
                # fromisoformat doesn't handle Z directly, so we need to replace it
                if v.endswith('Z'):
                    # Remove Z and add +00:00 for UTC timezone
                    v = v[:-1] + '+00:00'
                # Use fromisoformat which handles ISO 8601 format
                # This handles formats like: 2025-01-15T19:30:00.000+00:00
                parsed = datetime.fromisoformat(v)
                return parsed
            except (ValueError, AttributeError) as e:
                raise ValueError(f"Invalid datetime format: {v}. Error: {str(e)}")
        # If it's already a datetime, return as-is
        if isinstance(v, datetime):
            return v
        # If it's not a string or datetime, raise an error
        raise ValueError(f"Expected datetime or ISO string, got {type(v).__name__}: {v}")


class StageResponse(BaseModel):
    """Schema for stage response."""
    id: int
    process_id: int
    stage_name: str
    stage_date: str
    notes: Optional[str] = None
    order: int
    created_at: str
    updated_at: str
    
    class Config:
        from_attributes = True


class ProcessDetailResponse(ProcessResponse):
    """Schema for process response with stages included."""
    stages: List[StageResponse] = []

    class Config:
        from_attributes = True


class ProcessShareToggle(BaseModel):
    """Schema for toggling process sharing."""
    is_public: bool


# Feedback Schemas
class FeedbackCreate(BaseModel):
    """Schema for creating feedback."""
    message: str
    name: Optional[str] = None  # Required for anonymous users
    email: Optional[str] = None  # Required for anonymous users


class FeedbackResponse(BaseModel):
    """Schema for feedback response."""
    id: int
    user_id: Optional[int] = None
    name: Optional[str] = None
    email: Optional[str] = None
    message: str
    created_at: str
    # Include user info if available
    username: Optional[str] = None
    user_email: Optional[str] = None

    class Config:
        from_attributes = True


class DiscordBotTokenRequest(BaseModel):
    """Schema for Discord bot token request."""
    discord_id: str
    username: str


# Profile Comment Schemas
class ProfileCommentCreate(BaseModel):
    """Schema for creating a profile comment."""
    content: str
    is_question: bool = False
    author_display_name: Optional[str] = None  # Required if posting anonymously
    parent_comment_id: Optional[int] = None  # For replies
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        """Validate comment content."""
        if not v or not v.strip():
            raise ValueError('Comment content cannot be empty')
        if len(v) > 2000:
            raise ValueError('Comment content must be at most 2000 characters long')
        return v.strip()


class ProfileCommentUpdate(BaseModel):
    """Schema for updating a profile comment."""
    content: Optional[str] = None
    
    @field_validator('content')
    @classmethod
    def validate_content(cls, v):
        """Validate comment content."""
        if v is None:
            return v
        if not v.strip():
            raise ValueError('Comment content cannot be empty')
        if len(v) > 2000:
            raise ValueError('Comment content must be at most 2000 characters long')
        return v.strip()


class ProfileCommentResponse(BaseModel):
    """Schema for profile comment response."""
    id: int
    profile_user_id: int
    author_id: Optional[int] = None
    author_display_name: Optional[str] = None
    author_username: Optional[str] = None  # Only if not anonymous
    parent_comment_id: Optional[int] = None
    content: str
    is_question: bool
    is_answered: bool
    upvotes: int
    user_has_upvoted: bool = False  # Whether the current user has upvoted
    created_at: str
    updated_at: str
    replies: List['ProfileCommentResponse'] = []  # Nested replies
    
    class Config:
        from_attributes = True


# Update forward reference
ProfileCommentResponse.model_rebuild()


class PublicProfileResponse(BaseModel):
    """Schema for public profile response."""
    username: str
    display_name: Optional[str] = None
    is_anonymous: bool
    comments_enabled: bool
    account_created_at: str
    processes: List[ProcessResponse]
    stats: dict  # Detailed stats will be included here
    
    class Config:
        from_attributes = True