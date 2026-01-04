"""Guild configuration manager for per-server bot settings."""
import os
import httpx
import logging
from typing import Dict, Any, Optional

from utils.auth import get_api_url

# Default configuration structure
DEFAULT_CONFIG = {
    "allowed_channels": [],
    "denied_channels": [],
    "command_cooldowns": {},
    "auto_delete_seconds": None,
    "command_prefix": None,
    "disabled_commands": []
}

TIMEOUT = 3.0  # Reduced timeout for faster failure detection
logger = logging.getLogger(__name__)

# Bot API token for authenticating guild config requests
BOT_API_TOKEN = os.getenv("BOT_API_TOKEN", "")


class GuildConfig:
    """Manages per-server bot configuration stored in database via API."""
    
    def __init__(self):
        """Initialize config manager."""
        pass
    
    async def _api_request(self, method: str, guild_id: str, data: Optional[Dict] = None) -> Dict[str, Any]:
        """Make API request for guild config."""
        api_url = get_api_url()
        url = f"{api_url}/api/guild-configs/{guild_id}"
        
        params = {}
        if BOT_API_TOKEN:
            params["token"] = BOT_API_TOKEN
        
        async with httpx.AsyncClient(timeout=TIMEOUT) as client:
            try:
                if method == "GET":
                    response = await client.get(url, params=params)
                elif method == "PUT":
                    response = await client.put(url, params=params, json=data)
                elif method == "DELETE":
                    response = await client.delete(url, params=params)
                else:
                    raise ValueError(f"Unsupported method: {method}")
                
                response.raise_for_status()
                return response.json()
            except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.TimeoutException) as e:
                logger.error(f"Timeout {method}ing guild config for {guild_id}: {type(e).__name__}")
                raise Exception("CONFIG_CONNECTION_TIMEOUT")
            except httpx.ConnectError as e:
                logger.error(f"Connection error {method}ing guild config for {guild_id}: {type(e).__name__}")
                raise Exception("CONFIG_CONNECTION_ERROR")
            except httpx.RequestError as e:
                logger.error(f"Failed to {method} guild config for {guild_id}: {type(e).__name__}")
                raise Exception(f"CONFIG_REQUEST_ERROR: {str(e)}")
    
    async def load_config(self, guild_id: str) -> Dict[str, Any]:
        """Load configuration for a guild from API, returning defaults if not found."""
        try:
            result = await self._api_request("GET", guild_id)
            config = result.get("config", DEFAULT_CONFIG.copy())
            # Merge with defaults to ensure all keys exist
            merged = DEFAULT_CONFIG.copy()
            merged.update(config)
            return merged
        except Exception as e:
            # Re-raise config errors so command handlers can show error embeds
            if str(e).startswith("CONFIG_"):
                raise
            logger.error(f"Error loading config for guild {guild_id}: {e}")
            raise Exception("CONFIG_LOAD_ERROR")
    
    async def save_config(self, guild_id: str, config: Dict[str, Any]) -> bool:
        """Save configuration for a guild via API."""
        try:
            await self._api_request("PUT", guild_id, {"config": config})
            return True
        except Exception as e:
            logger.error(f"Error saving config for guild {guild_id}: {e}")
            return False
    
    async def get_config(self, guild_id: str) -> Dict[str, Any]:
        """Get configuration for a guild (async alias for load_config)."""
        return await self.load_config(guild_id)
    
    async def reset_config(self, guild_id: str) -> bool:
        """Reset configuration to defaults for a guild."""
        try:
            await self._api_request("DELETE", guild_id)
            return True
        except Exception as e:
            logger.error(f"Error resetting config for guild {guild_id}: {e}")
            return False
    
    async def update_config(self, guild_id: str, updates: Dict[str, Any]) -> bool:
        """Update specific keys in a guild's configuration."""
        config = await self.load_config(guild_id)
        config.update(updates)
        return await self.save_config(guild_id, config)


# Global instance
guild_config = GuildConfig()
