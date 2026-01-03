"""Guild configuration manager for per-server bot settings."""
import json
import os
from pathlib import Path
from typing import Dict, Any, Optional

# Default configuration structure
DEFAULT_CONFIG = {
    "allowed_channels": [],
    "denied_channels": [],
    "command_cooldowns": {},
    "auto_delete_seconds": None,
    "command_prefix": None,
    "disabled_commands": []
}

# Config directory path
CONFIG_DIR = Path(__file__).parent.parent / "configs"


class GuildConfig:
    """Manages per-server bot configuration stored in JSON files."""
    
    def __init__(self):
        """Initialize config manager and ensure config directory exists."""
        CONFIG_DIR.mkdir(exist_ok=True)
    
    def _get_config_path(self, guild_id: str) -> Path:
        """Get the file path for a guild's config."""
        return CONFIG_DIR / f"{guild_id}.json"
    
    def load_config(self, guild_id: str) -> Dict[str, Any]:
        """Load configuration for a guild, returning defaults if not found."""
        config_path = self._get_config_path(guild_id)
        
        if not config_path.exists():
            return DEFAULT_CONFIG.copy()
        
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                config = json.load(f)
                # Merge with defaults to ensure all keys exist
                merged = DEFAULT_CONFIG.copy()
                merged.update(config)
                return merged
        except (json.JSONDecodeError, IOError) as e:
            # If config is corrupted, return defaults
            print(f"Error loading config for guild {guild_id}: {e}")
            return DEFAULT_CONFIG.copy()
    
    def save_config(self, guild_id: str, config: Dict[str, Any]) -> bool:
        """Save configuration for a guild."""
        config_path = self._get_config_path(guild_id)
        
        try:
            # Ensure directory exists
            config_path.parent.mkdir(exist_ok=True)
            
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            return True
        except IOError as e:
            print(f"Error saving config for guild {guild_id}: {e}")
            return False
    
    def get_config(self, guild_id: str) -> Dict[str, Any]:
        """Get configuration for a guild (alias for load_config)."""
        return self.load_config(guild_id)
    
    def reset_config(self, guild_id: str) -> bool:
        """Reset configuration to defaults for a guild."""
        config_path = self._get_config_path(guild_id)
        
        try:
            if config_path.exists():
                config_path.unlink()
            return True
        except IOError as e:
            print(f"Error resetting config for guild {guild_id}: {e}")
            return False
    
    def update_config(self, guild_id: str, updates: Dict[str, Any]) -> bool:
        """Update specific keys in a guild's configuration."""
        config = self.load_config(guild_id)
        config.update(updates)
        return self.save_config(guild_id, config)


# Global instance
guild_config = GuildConfig()

