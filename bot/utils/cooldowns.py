"""Cooldown tracking and enforcement for Discord bot commands."""
import time
from typing import Dict, Tuple, Optional
from collections import defaultdict


class CooldownTracker:
    """Tracks command cooldowns per guild/user/command."""
    
    def __init__(self):
        # Structure: {guild_id: {user_id: {command_name: last_used_timestamp}}}
        self._cooldowns: Dict[str, Dict[str, Dict[str, float]]] = defaultdict(lambda: defaultdict(dict))
    
    def check_cooldown(
        self, 
        guild_id: str, 
        user_id: str, 
        command_name: str, 
        cooldown_seconds: float
    ) -> Tuple[bool, Optional[float]]:
        """
        Check if a command is on cooldown.
        
        Args:
            guild_id: Discord guild ID
            user_id: Discord user ID
            command_name: Name of the command
            cooldown_seconds: Cooldown duration in seconds
        
        Returns:
            Tuple of (is_on_cooldown, remaining_seconds)
            If is_on_cooldown is False, remaining_seconds is None
            If is_on_cooldown is True, remaining_seconds is the time remaining
        """
        if cooldown_seconds <= 0:
            return False, None
        
        current_time = time.time()
        last_used = self._cooldowns[guild_id][user_id].get(command_name, 0)
        
        if last_used == 0:
            # First time using command, allow it
            return False, None
        
        time_since_last_use = current_time - last_used
        
        if time_since_last_use >= cooldown_seconds:
            # Cooldown has expired
            return False, None
        
        # Still on cooldown
        remaining = cooldown_seconds - time_since_last_use
        return True, remaining
    
    def record_command_use(
        self, 
        guild_id: str, 
        user_id: str, 
        command_name: str
    ) -> None:
        """Record that a command was used (updates cooldown timestamp)."""
        current_time = time.time()
        self._cooldowns[guild_id][user_id][command_name] = current_time
    
    def clear_cooldown(
        self, 
        guild_id: str, 
        user_id: Optional[str] = None, 
        command_name: Optional[str] = None
    ) -> None:
        """
        Clear cooldowns.
        
        Args:
            guild_id: Discord guild ID
            user_id: Optional user ID (if None, clears all users in guild)
            command_name: Optional command name (if None, clears all commands)
        """
        if guild_id not in self._cooldowns:
            return
        
        if user_id is None:
            # Clear all cooldowns for the guild
            del self._cooldowns[guild_id]
        elif command_name is None:
            # Clear all cooldowns for the user
            if user_id in self._cooldowns[guild_id]:
                del self._cooldowns[guild_id][user_id]
        else:
            # Clear specific command cooldown
            if user_id in self._cooldowns[guild_id]:
                if command_name in self._cooldowns[guild_id][user_id]:
                    del self._cooldowns[guild_id][user_id][command_name]


# Global instance
cooldown_tracker = CooldownTracker()

