"""Guild configuration manager for per-server bot settings."""
import os
import httpx
import logging
import time
from typing import Dict, Any, Optional, Tuple

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
CACHE_TTL = 60  # Cache configs for 60 seconds
logger = logging.getLogger(__name__)

# Bot API token for authenticating guild config requests
BOT_API_TOKEN = os.getenv("BOT_API_TOKEN", "")


class GuildConfig:
    """Manages per-server bot configuration stored in database via API."""
    
    def __init__(self):
        """Initialize config manager with caching."""
        # Cache structure: {guild_id: (config_dict, timestamp)}
        self._cache: Dict[str, Tuple[Dict[str, Any], float]] = {}
    
    def _is_cache_valid(self, guild_id: str) -> bool:
        """Check if cached config is still valid."""
        if guild_id not in self._cache:
            return False
        
        config, timestamp = self._cache[guild_id]
        age = time.time() - timestamp
        return age < CACHE_TTL
    
    def _get_cached_config(self, guild_id: str) -> Optional[Dict[str, Any]]:
        """Get cached config if valid, otherwise None."""
        if self._is_cache_valid(guild_id):
            config, _ = self._cache[guild_id]
            return config
        return None
    
    def _set_cached_config(self, guild_id: str, config: Dict[str, Any]) -> None:
        """Cache a config with current timestamp."""
        self._cache[guild_id] = (config, time.time())
    
    def _invalidate_cache(self, guild_id: str) -> None:
        """Invalidate cached config for a guild."""
        if guild_id in self._cache:
            del self._cache[guild_id]
    
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
            except httpx.HTTPStatusError as e:
                logger.error(f"Error {method}ing guild config for {guild_id}: {e.response.status_code} - {e.response.text}")
                raise Exception(f"CONFIG_HTTP_ERROR: {e.response.status_code}")
            except (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.TimeoutException) as e:
                logger.error(f"Timeout {method}ing guild config for {guild_id}: {type(e).__name__}")
                raise Exception("CONFIG_CONNECTION_TIMEOUT")
            except httpx.ConnectError as e:
                logger.error(f"Connection error {method}ing guild config for {guild_id}: {type(e).__name__}")
                raise Exception("CONFIG_CONNECTION_ERROR")
            except httpx.RequestError as e:
                logger.error(f"Failed to {method} guild config for {guild_id}: {type(e).__name__}")
                raise Exception(f"CONFIG_REQUEST_ERROR: {str(e)}")
    
    async def load_config(self, guild_id: str, use_cache: bool = True) -> Dict[str, Any]:
        """
        Load configuration for a guild from API, returning defaults if not found.
        
        Args:
            guild_id: The guild ID
            use_cache: If True, use cached config if available and valid. If False, force refresh.
        
        Returns:
            Merged config dictionary with defaults
        """
        # Check cache first (unless force refresh)
        if use_cache:
            cached = self._get_cached_config(guild_id)
            if cached is not None:
                return cached
        
        # Fetch from API
        try:
            result = await self._api_request("GET", guild_id)
            config = result.get("config", DEFAULT_CONFIG.copy())
            # Merge with defaults to ensure all keys exist
            merged = DEFAULT_CONFIG.copy()
            merged.update(config)
            # Cache the result
            self._set_cached_config(guild_id, merged)
            return merged
        except Exception as e:
            # If we have a cached config and API fails, return cached (stale is better than nothing)
            if use_cache:
                cached = self._get_cached_config(guild_id)
                if cached is not None:
                    logger.warning(f"API failed for guild {guild_id}, using stale cache: {type(e).__name__}")
                    return cached
            
            # Re-raise config errors so command handlers can show error embeds
            if str(e).startswith("CONFIG_"):
                raise
            logger.error(f"Error loading config for guild {guild_id}: {e}")
            raise Exception("CONFIG_LOAD_ERROR")
    
    async def save_config(self, guild_id: str, config: Dict[str, Any]) -> bool:
        """Save configuration for a guild via API and update cache."""
        try:
            await self._api_request("PUT", guild_id, {"config": config})
            # Update cache with new config
            self._set_cached_config(guild_id, config)
            return True
        except Exception as e:
            logger.error(f"Error saving config for guild {guild_id}: {e}")
            return False
    
    async def get_config(self, guild_id: str) -> Dict[str, Any]:
        """Get configuration for a guild (async alias for load_config)."""
        return await self.load_config(guild_id)
    
    async def reset_config(self, guild_id: str) -> bool:
        """Reset configuration to defaults for a guild and invalidate cache."""
        try:
            await self._api_request("DELETE", guild_id)
            # Invalidate cache
            self._invalidate_cache(guild_id)
            return True
        except Exception as e:
            logger.error(f"Error resetting config for guild {guild_id}: {e}")
            return False
    
    async def update_config(self, guild_id: str, updates: Dict[str, Any]) -> bool:
        """Update specific keys in a guild's configuration."""
        config = await self.load_config(guild_id)
        config.update(updates)
        return await self.save_config(guild_id, config)
    
    def clear_cache(self, guild_id: Optional[str] = None) -> None:
        """
        Clear cache for a specific guild or all guilds.
        
        Args:
            guild_id: If provided, clear cache for this guild only. If None, clear all caches.
        """
        if guild_id:
            self._invalidate_cache(guild_id)
        else:
            self._cache.clear()


# Global instance
guild_config = GuildConfig()
