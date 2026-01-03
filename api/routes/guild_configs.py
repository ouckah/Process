"""API routes for Discord bot guild configuration."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from database import get_db
from models import GuildConfig
from schemas import GuildConfigResponse, GuildConfigUpdate
import os

router = APIRouter(prefix="/api/guild-configs", tags=["guild-configs"])

# Default configuration structure
DEFAULT_CONFIG = {
    "allowed_channels": [],
    "denied_channels": [],
    "command_cooldowns": {},
    "auto_delete_seconds": None,
    "command_prefix": None,
    "disabled_commands": []
}

# Simple bot token authentication (set via environment variable)
BOT_TOKEN = os.getenv("BOT_API_TOKEN", "")


def verify_bot_token(token: Optional[str] = None):
    """Verify bot API token."""
    if not BOT_TOKEN:
        # If no token is set, allow access (for development)
        return True
    if not token or token != BOT_TOKEN:
        raise HTTPException(status_code=401, detail="Invalid bot token")
    return True


@router.get("/{guild_id}", response_model=GuildConfigResponse)
def get_guild_config(
    guild_id: str,
    token: Optional[str] = Query(None, description="Bot API token"),
    db: Session = Depends(get_db)
):
    """
    Get guild configuration.
    Bot should pass token as query parameter: ?token=YOUR_BOT_TOKEN
    """
    verify_bot_token(token)
    
    guild_config = db.query(GuildConfig).filter(GuildConfig.guild_id == guild_id).first()
    
    if not guild_config:
        # Return default config if not found
        return GuildConfigResponse(
            guild_id=guild_id,
            config=DEFAULT_CONFIG.copy(),
            updated_at=None
        )
    
    # Merge with defaults to ensure all keys exist
    merged_config = DEFAULT_CONFIG.copy()
    merged_config.update(guild_config.config)
    
    return GuildConfigResponse(
        guild_id=guild_config.guild_id,
        config=merged_config,
        updated_at=guild_config.updated_at
    )


@router.put("/{guild_id}", response_model=GuildConfigResponse)
def update_guild_config(
    guild_id: str,
    config_update: GuildConfigUpdate,
    token: Optional[str] = Query(None, description="Bot API token"),
    db: Session = Depends(get_db)
):
    """
    Update guild configuration.
    Bot should pass token as query parameter: ?token=YOUR_BOT_TOKEN
    """
    verify_bot_token(token)
    
    guild_config = db.query(GuildConfig).filter(GuildConfig.guild_id == guild_id).first()
    
    if not guild_config:
        # Create new config
        guild_config = GuildConfig(
            guild_id=guild_id,
            config=config_update.config
        )
        db.add(guild_config)
    else:
        # Update existing config
        guild_config.config = config_update.config
    
    db.commit()
    db.refresh(guild_config)
    
    # Merge with defaults
    merged_config = DEFAULT_CONFIG.copy()
    merged_config.update(guild_config.config)
    
    return GuildConfigResponse(
        guild_id=guild_config.guild_id,
        config=merged_config,
        updated_at=guild_config.updated_at
    )


@router.delete("/{guild_id}")
def reset_guild_config(
    guild_id: str,
    token: Optional[str] = Query(None, description="Bot API token"),
    db: Session = Depends(get_db)
):
    """
    Reset guild configuration to defaults.
    Bot should pass token as query parameter: ?token=YOUR_BOT_TOKEN
    """
    verify_bot_token(token)
    
    guild_config = db.query(GuildConfig).filter(GuildConfig.guild_id == guild_id).first()
    
    if guild_config:
        db.delete(guild_config)
        db.commit()
    
    return {"message": "Guild config reset to defaults"}

