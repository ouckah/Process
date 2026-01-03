"""Permission checking utilities for Discord bot."""
import discord
from discord.ext import commands
from typing import Optional


def has_mod_permission(user: discord.Member, guild: Optional[discord.Guild] = None) -> bool:
    """
    Check if a user has moderator permissions (Manage Server).
    
    Args:
        user: Discord member to check
        guild: Optional guild context (if None, uses user.guild)
    
    Returns:
        True if user has Manage Server permission, False otherwise
    """
    if not guild:
        guild = getattr(user, 'guild', None)
    
    if not guild:
        return False
    
    # Check if user has Manage Server permission
    return user.guild_permissions.manage_guild


async def require_mod_permission(ctx: commands.Context = None, interaction: discord.Interaction = None) -> tuple[bool, Optional[discord.Embed]]:
    """
    Check if user has moderator permission and return error embed if not.
    
    Args:
        ctx: Command context (for prefix commands)
        interaction: Discord interaction (for slash commands)
    
    Returns:
        Tuple of (has_permission, error_embed)
        If has_permission is True, error_embed is None
        If has_permission is False, error_embed contains the error message
    """
    from utils.embeds import create_error_embed
    
    user = None
    guild = None
    
    if ctx:
        user = ctx.author
        guild = ctx.guild
    elif interaction:
        user = interaction.user
        guild = interaction.guild
    
    if not user or not guild:
        error_embed = create_error_embed(
            "Permission Error",
            "This command can only be used in a server."
        )
        return False, error_embed
    
    if not has_mod_permission(user, guild):
        error_embed = create_error_embed(
            "Permission Denied",
            "You need the **Manage Server** permission to use this command."
        )
        return False, error_embed
    
    return True, None

