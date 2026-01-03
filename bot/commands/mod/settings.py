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


async def handle_settings(guild_id: str) -> discord.Embed:
    """View all current bot settings."""
    config = await guild_config.get_config(guild_id)
    
    # Format channel lists
    allowed = config.get("allowed_channels", [])
    denied = config.get("denied_channels", [])
    allowed_text = ", ".join([f"<#{ch}>" for ch in allowed]) if allowed else "None"
    denied_text = ", ".join([f"<#{ch}>" for ch in denied]) if denied else "None"
    
    # Format cooldowns
    cooldowns = config.get("command_cooldowns", {})
    cooldown_text = ", ".join([f"`{cmd}`: {s}s" for cmd, s in sorted(cooldowns.items())]) if cooldowns else "None"
    
    # Format disabled commands
    disabled = config.get("disabled_commands", [])
    disabled_text = ", ".join([f"`{cmd}`" for cmd in sorted(disabled)]) if disabled else "None"
    
    # Auto-delete
    auto_delete = config.get("auto_delete_seconds")
    auto_delete_text = f"{auto_delete}s" if auto_delete is not None else "Disabled"
    
    # Prefix
    prefix = config.get("command_prefix")
    prefix_text = f"`{prefix}`" if prefix else f"Default (`{PREFIX}`)"
    
    embed = create_info_embed(
        "Bot Settings",
        "Current bot configuration for this server:"
    )
    embed.add_field(name="Allowed Channels", value=allowed_text, inline=False)
    embed.add_field(name="Denied Channels", value=denied_text, inline=False)
    embed.add_field(name="Command Cooldowns", value=cooldown_text, inline=False)
    embed.add_field(name="Disabled Commands", value=disabled_text, inline=False)
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

