"""Command restriction checking utilities."""
from typing import Optional, Tuple
import discord
from discord.ext import commands

from utils.config import guild_config
from utils.cooldowns import cooldown_tracker
from utils.embeds import create_error_embed


async def check_command_restrictions(
    guild_id: Optional[str],
    user_id: str,
    channel_id: int,
    command_name: str,
    ctx: Optional[commands.Context] = None,
    interaction: Optional[discord.Interaction] = None
) -> Tuple[bool, Optional[discord.Embed]]:
    """
    Check all command restrictions (channel, cooldown, disabled).
    
    Returns:
        Tuple of (is_allowed, error_embed)
        If is_allowed is True, error_embed is None
        If is_allowed is False, error_embed contains the error message
    """
    # Skip checks for DMs
    if not guild_id:
        return True, None
    
    try:
        config = await guild_config.get_config(guild_id)
    except Exception as e:
        # If config can't be loaded, fail open (allow commands) but log the error
        # This prevents the bot from breaking if the API is temporarily down
        import logging
        logger = logging.getLogger(__name__)
        logger.warning(f"Failed to load config for guild {guild_id}, allowing command: {type(e).__name__}")
        # Return default config to allow commands
        from utils.config import DEFAULT_CONFIG
        config = DEFAULT_CONFIG.copy()
    
    # Check if command is disabled
    disabled_commands = config.get("disabled_commands", [])
    if command_name.lower() in disabled_commands:
        error_embed = create_error_embed(
            "Command Disabled",
            f"The command `{command_name}` is disabled in this server."
        )
        return False, error_embed
    
    # Check if user has manage_guild permission - mods bypass all channel restrictions
    has_mod_permission = False
    if ctx and ctx.author:
        has_mod_permission = ctx.author.guild_permissions.manage_guild
    elif interaction and interaction.user:
        member = interaction.guild.get_member(interaction.user.id) if interaction.guild else None
        if member:
            has_mod_permission = member.guild_permissions.manage_guild
    
    # If user has mod permission, skip channel restrictions for all commands
    if not has_mod_permission:
        # Apply channel restrictions for non-mods
        allowed_channels = config.get("allowed_channels", [])
        denied_channels = config.get("denied_channels", [])
        
        if channel_id in denied_channels:
            # Silently ignore (don't send error to avoid spam)
            return False, None
        
        if allowed_channels and channel_id not in allowed_channels:
            # Silently ignore (don't send error to avoid spam)
            return False, None
    
    # Check cooldown
    cooldowns = config.get("command_cooldowns", {})
    command_cooldown = cooldowns.get(command_name.lower(), 0)
    
    if command_cooldown > 0:
        is_on_cooldown, remaining = cooldown_tracker.check_cooldown(
            guild_id, user_id, command_name.lower(), command_cooldown
        )
        
        if is_on_cooldown:
            error_embed = create_error_embed(
                "Command on Cooldown",
                f"Please wait {remaining:.1f} more second(s) before using `{command_name}` again."
            )
            return False, error_embed
    
    # All checks passed
    return True, None


def record_command_use(guild_id: Optional[str], user_id: str, command_name: str) -> None:
    """Record that a command was used (for cooldown tracking)."""
    if guild_id:
        cooldown_tracker.record_command_use(guild_id, user_id, command_name.lower())

