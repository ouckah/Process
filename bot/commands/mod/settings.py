"""Settings and reset commands for moderators."""
import discord
from discord import app_commands
from discord.ext import commands
import os

from utils.config import guild_config
from utils.permissions import require_mod_permission
from utils.embeds import create_success_embed, create_info_embed
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")

# Discord embed field value limit
MAX_FIELD_VALUE_LENGTH = 1024


def truncate_field_value(text: str, max_length: int = MAX_FIELD_VALUE_LENGTH, item_count: int = None) -> str:
    """Truncate text to fit Discord embed field value limit."""
    if len(text) <= max_length:
        return text
    # Calculate suffix length
    if item_count:
        suffix = f"\n... ({item_count} total items)"
    else:
        suffix = "..."
    suffix_len = len(suffix)
    # Truncate to leave exact room for suffix
    truncated = text[:max_length - suffix_len] + suffix
    return truncated


def _split_list_into_fields(items: list, field_name_prefix: str, format_func, max_per_field: int = 15) -> list:
    """Split a list of items into multiple embed fields."""
    if not items:
        return [{"name": field_name_prefix, "value": "None", "inline": False}]
    
    fields = []
    formatted_items = [format_func(item) for item in items]
    
    # Split into chunks
    for i in range(0, len(formatted_items), max_per_field):
        chunk = formatted_items[i:i + max_per_field]
        chunk_text = "\n".join(chunk)
        
        # Determine field name
        if len(items) <= max_per_field:
            field_name = field_name_prefix
        else:
            start = i + 1
            end = min(i + max_per_field, len(items))
            field_name = f"{field_name_prefix} ({start}-{end})"
        
        fields.append({
            "name": field_name,
            "value": chunk_text,
            "inline": False
        })
    
    return fields


async def handle_settings(guild_id: str) -> discord.Embed:
    """View all current bot settings."""
    config = await guild_config.get_config(guild_id)
    
    # Get channel lists
    allowed = config.get("allowed_channels", [])
    denied = config.get("denied_channels", [])
    
    # Format cooldowns
    cooldowns = config.get("command_cooldowns", {})
    cooldown_items = sorted(cooldowns.items()) if cooldowns else []
    
    # Format disabled commands
    disabled = config.get("disabled_commands", [])
    disabled_items = sorted(disabled) if disabled else []
    
    # Auto-delete
    auto_delete = config.get("auto_delete_seconds")
    auto_delete_text = f"{auto_delete}s" if auto_delete is not None else "Disabled"
    
    # Prefix
    prefix = config.get("command_prefix")
    prefix_text = f"`{prefix}`" if prefix else f"Default (`{PREFIX}`)"
    
    embed = create_info_embed(
        "Bot Settings",
        f"Current bot configuration for this server:\n**Allowed:** {len(allowed)} | **Denied:** {len(denied)} | **Cooldowns:** {len(cooldowns)} | **Disabled:** {len(disabled)}"
    )
    
    # Split allowed channels into multiple fields if needed
    allowed_fields = _split_list_into_fields(
        allowed, 
        "Allowed Channels", 
        lambda ch: f"<#{ch}>",
        max_per_field=15
    )
    for field in allowed_fields:
        embed.add_field(**field)
    
    # Split denied channels into multiple fields if needed
    denied_fields = _split_list_into_fields(
        denied,
        "Denied Channels",
        lambda ch: f"<#{ch}>",
        max_per_field=15
    )
    for field in denied_fields:
        embed.add_field(**field)
    
    # Split cooldowns into multiple fields if needed
    cooldown_fields = _split_list_into_fields(
        cooldown_items,
        "Command Cooldowns",
        lambda item: f"`{item[0]}`: {item[1]}s",
        max_per_field=15
    )
    for field in cooldown_fields:
        embed.add_field(**field)
    
    # Split disabled commands into multiple fields if needed
    disabled_fields = _split_list_into_fields(
        disabled_items,
        "Disabled Commands",
        lambda cmd: f"`{cmd}`",
        max_per_field=20
    )
    for field in disabled_fields:
        embed.add_field(**field)
    
    embed.add_field(name="Auto-Delete Delay", value=auto_delete_text, inline=True)
    embed.add_field(name="Command Prefix", value=prefix_text, inline=True)
    
    return embed


async def handle_reset(guild_id: str) -> discord.Embed:
    """Reset all settings to defaults."""
    await guild_config.reset_config(guild_id)
    
    return create_success_embed(
        "Settings Reset",
        "All bot settings have been reset to defaults."
    )


def setup_settings_commands(mod_group: app_commands.Group):
    """Register settings and reset slash commands."""
    @mod_group.command(name="settings", description="View all current bot settings")
    async def settings_slash(interaction: discord.Interaction):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod settings", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_settings(str(interaction.guild.id))
        await interaction.followup.send(embed=embed)
    
    @mod_group.command(name="reset", description="Reset all settings to defaults")
    async def reset_slash(interaction: discord.Interaction):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod reset", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_reset(str(interaction.guild.id))
        await interaction.followup.send(embed=embed)

