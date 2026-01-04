"""Cooldown management commands for moderators."""
import discord
from discord import app_commands
from discord.ext import commands
import os

from utils.config import guild_config
from utils.permissions import require_mod_permission
from utils.embeds import create_success_embed, create_error_embed, create_info_embed, create_usage_embed
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


async def handle_cooldown_set(guild_id: str, command_name: str, seconds: float) -> discord.Embed:
    """Set cooldown for a command."""
    if seconds < 0:
        return create_error_embed(
            "Invalid Cooldown",
            "Cooldown must be 0 or greater."
        )
    
    config = await guild_config.get_config(guild_id)
    config["command_cooldowns"][command_name.lower()] = seconds
    await guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Cooldown Set",
        f"Cooldown for `{command_name}` set to {seconds} seconds."
    )


async def handle_cooldown_remove(guild_id: str, command_name: str) -> discord.Embed:
    """Remove cooldown for a command."""
    config = await guild_config.get_config(guild_id)
    command_key = command_name.lower()
    
    if command_key not in config["command_cooldowns"]:
        return create_error_embed(
            "Cooldown Not Found",
            f"No cooldown set for `{command_name}`."
        )
    
    del config["command_cooldowns"][command_key]
    await guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Cooldown Removed",
        f"Cooldown for `{command_name}` has been removed."
    )


async def handle_cooldown_list(guild_id: str) -> discord.Embed:
    """List all command cooldowns."""
    config = await guild_config.get_config(guild_id)
    cooldowns = config.get("command_cooldowns", {})
    
    if not cooldowns:
        return create_info_embed(
            "Command Cooldowns",
            "No cooldowns are currently set."
        )
    
    cooldown_text = "\n".join([
        f"`{cmd}`: {seconds}s" for cmd, seconds in sorted(cooldowns.items())
    ])
    
    embed = create_info_embed(
        "Command Cooldowns",
        "Current cooldowns for commands:"
    )
    embed.add_field(name="Cooldowns", value=truncate_field_value(cooldown_text, item_count=len(cooldowns) if cooldowns else 0), inline=False)
    
    return embed


def setup_cooldown_commands(cooldown_group: app_commands.Group):
    """Register cooldown slash commands."""
    @cooldown_group.command(name="set", description="Set cooldown for a command")
    @app_commands.describe(command="The command name", seconds="Cooldown in seconds")
    async def cooldown_set_slash(interaction: discord.Interaction, command: str, seconds: float):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod cooldown set", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_cooldown_set(str(interaction.guild.id), command, seconds)
        await interaction.followup.send(embed=embed)
    
    @cooldown_group.command(name="remove", description="Remove cooldown for a command")
    @app_commands.describe(command="The command name")
    async def cooldown_remove_slash(interaction: discord.Interaction, command: str):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod cooldown remove", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_cooldown_remove(str(interaction.guild.id), command)
        await interaction.followup.send(embed=embed)
    
    @cooldown_group.command(name="list", description="List all command cooldowns")
    async def cooldown_list_slash(interaction: discord.Interaction):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod cooldown list", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_cooldown_list(str(interaction.guild.id))
        await interaction.followup.send(embed=embed)


async def handle_prefix_cooldown(ctx: commands.Context, args: list):
    """Handle prefix cooldown command routing."""
    guild_id = str(ctx.guild.id)
    
    if len(args) < 2:
        embed = create_usage_embed(
            f"Usage: `{PREFIX}mod cooldown <set|remove|list> [command] [seconds]`"
        )
        await ctx.send(embed=embed)
        return
    
    action = args[1].lower()
    
    if action == "list":
        embed = await handle_cooldown_list(guild_id)
        await ctx.send(embed=embed)
    elif action == "set":
        if len(args) < 4:
            embed = create_usage_embed(
                f"Usage: `{PREFIX}mod cooldown set <command> <seconds>`"
            )
            await ctx.send(embed=embed)
            return
        
        command_name = args[2]
        try:
            seconds = float(args[3])
        except ValueError:
            embed = create_error_embed(
                "Invalid Seconds",
                "Seconds must be a number."
            )
            await ctx.send(embed=embed)
            return
        
        embed = await handle_cooldown_set(guild_id, command_name, seconds)
        await ctx.send(embed=embed)
    elif action == "remove":
        if len(args) < 3:
            embed = create_usage_embed(
                f"Usage: `{PREFIX}mod cooldown remove <command>`"
            )
            await ctx.send(embed=embed)
            return
        
        command_name = args[2]
        embed = await handle_cooldown_remove(guild_id, command_name)
        await ctx.send(embed=embed)
    else:
        embed = create_usage_embed(
            f"Usage: `{PREFIX}mod cooldown <set|remove|list> [command] [seconds]`"
        )
        await ctx.send(embed=embed)

