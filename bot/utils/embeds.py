"""Embed builders for Discord bot messages."""
import discord
from typing import Optional


def create_success_embed(title: str, description: str) -> discord.Embed:
    """Create a success embed (green)."""
    embed = discord.Embed(
        title=f"✅ {title}",
        description=description,
        color=0x00FF00  # Green
    )
    embed.timestamp = discord.utils.utcnow()
    return embed


def create_error_embed(title: str, description: str, fields: Optional[list[dict]] = None, footer: Optional[str] = None) -> discord.Embed:
    """Create an error embed (red)."""
    embed = discord.Embed(
        title=f"❌ {title}",
        description=description,
        color=0xFF0000  # Red
    )
    if fields:
        for field in fields:
            embed.add_field(**field)
    if footer:
        embed.set_footer(text=footer)
    return embed


def create_usage_embed(description: str, examples: Optional[str] = None, fields: Optional[list[dict]] = None) -> discord.Embed:
    """Create a usage error embed (orange)."""
    embed = discord.Embed(
        title="❌ Usage Error",
        description=description,
        color=0xFF9900  # Orange
    )
    if examples:
        embed.add_field(name="Examples", value=examples, inline=False)
    if fields:
        for field in fields:
            embed.add_field(**field)
    return embed


def create_info_embed(title: str, description: str, fields: Optional[list[dict]] = None) -> discord.Embed:
    """Create an info embed (gray)."""
    embed = discord.Embed(
        title=title,
        description=description,
        color=0x808080  # Gray
    )
    if fields:
        for field in fields:
            embed.add_field(**field)
    embed.timestamp = discord.utils.utcnow()
    return embed

