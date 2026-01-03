"""Prefix management commands for moderators."""
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


async def handle_prefix_set(guild_id: str, prefix: Optional[str]) -> discord.Embed:
    """Set custom prefix for server."""
    if prefix and len(prefix) > 10:
        return create_error_embed(
            "Invalid Prefix",
            "Prefix must be 10 characters or less."
        )
    
    config = await guild_config.get_config(guild_id)
    config["command_prefix"] = prefix
    await guild_config.save_config(guild_id, config)
    
    if prefix is None:
        return create_success_embed(
            "Prefix Reset",
            f"Server prefix reset to default: `{PREFIX}`"
        )
    else:
        return create_success_embed(
            "Prefix Set",
            f"Server prefix set to: `{prefix}`"
        )


def setup_prefix_commands(prefix_group: app_commands.Group):
    """Register prefix slash commands."""
    @prefix_group.command(name="set", description="Set custom prefix for this server")
    @app_commands.describe(prefix="The new prefix (leave empty to reset to default)")
    async def prefix_set_slash(interaction: discord.Interaction, prefix: str = None):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod prefix set", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_prefix_set(str(interaction.guild.id), prefix if prefix else None)
        await interaction.followup.send(embed=embed)
    
    @prefix_group.command(name="reset", description="Reset prefix to default")
    async def prefix_reset_slash(interaction: discord.Interaction):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod prefix reset", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_prefix_set(str(interaction.guild.id), None)
        await interaction.followup.send(embed=embed)


async def handle_prefix_prefix(ctx: commands.Context, args: list):
    """Handle prefix prefix command routing."""
    guild_id = str(ctx.guild.id)
    
    if len(args) < 2:
        embed = create_usage_embed(
            f"Usage: `{PREFIX}mod prefix <set|reset> [prefix]`"
        )
        await ctx.send(embed=embed)
        return
    
    action = args[1].lower()
    
    if action == "reset":
        embed = await handle_prefix_set(guild_id, None)
        await ctx.send(embed=embed)
    elif action == "set":
        if len(args) < 3:
            embed = create_usage_embed(
                f"Usage: `{PREFIX}mod prefix set <prefix>`"
            )
            await ctx.send(embed=embed)
            return
        
        prefix = args[2]
        embed = await handle_prefix_set(guild_id, prefix)
        await ctx.send(embed=embed)
    else:
        embed = create_usage_embed(
            f"Usage: `{PREFIX}mod prefix <set|reset> [prefix]`"
        )
        await ctx.send(embed=embed)

