"""Auto-delete settings commands for moderators."""
import discord
from discord import app_commands
from discord.ext import commands
import os
from typing import Optional

from utils.config import guild_config
from utils.permissions import require_mod_permission
from utils.embeds import create_success_embed, create_error_embed, create_usage_embed
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")


async def handle_autodelete_set(guild_id: str, seconds: Optional[float]) -> discord.Embed:
    """Set auto-delete delay."""
    if seconds is not None and seconds < 0:
        return create_error_embed(
            "Invalid Delay",
            "Auto-delete delay must be 0 or greater."
        )
    
    config = guild_config.get_config(guild_id)
    config["auto_delete_seconds"] = seconds
    guild_config.save_config(guild_id, config)
    
    if seconds is None:
        return create_success_embed(
            "Auto-Delete Disabled",
            "Bot responses will no longer be automatically deleted."
        )
    else:
        return create_success_embed(
            "Auto-Delete Set",
            f"Bot responses will be automatically deleted after {seconds} seconds."
        )


def setup_autodelete_commands(autodelete_group: app_commands.Group):
    """Register autodelete slash commands."""
    @autodelete_group.command(name="set", description="Set auto-delete delay for bot responses")
    @app_commands.describe(seconds="Delay in seconds (0 to disable)")
    async def autodelete_set_slash(interaction: discord.Interaction, seconds: float):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod autodelete set", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_autodelete_set(str(interaction.guild.id), seconds if seconds > 0 else None)
        await interaction.followup.send(embed=embed)
    
    @autodelete_group.command(name="disable", description="Disable auto-delete")
    async def autodelete_disable_slash(interaction: discord.Interaction):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod autodelete disable", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_autodelete_set(str(interaction.guild.id), None)
        await interaction.followup.send(embed=embed)


async def handle_prefix_autodelete(ctx: commands.Context, args: list):
    """Handle prefix autodelete command routing."""
    guild_id = str(ctx.guild.id)
    
    if len(args) < 2:
        embed = create_usage_embed(
            f"Usage: `{PREFIX}mod autodelete <set|disable> [seconds]`"
        )
        await ctx.send(embed=embed)
        return
    
    action = args[1].lower()
    
    if action == "disable":
        embed = await handle_autodelete_set(guild_id, None)
        await ctx.send(embed=embed)
    elif action == "set":
        if len(args) < 3:
            embed = create_usage_embed(
                f"Usage: `{PREFIX}mod autodelete set <seconds>`"
            )
            await ctx.send(embed=embed)
            return
        
        try:
            seconds = float(args[2])
            embed = await handle_autodelete_set(guild_id, seconds if seconds > 0 else None)
        except ValueError:
            embed = create_error_embed(
                "Invalid Seconds",
                "Seconds must be a number."
            )
        await ctx.send(embed=embed)
    else:
        embed = create_usage_embed(
            f"Usage: `{PREFIX}mod autodelete <set|disable> [seconds]`"
        )
        await ctx.send(embed=embed)

