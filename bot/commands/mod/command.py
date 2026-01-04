"""Command enable/disable commands for moderators."""
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


async def handle_command_disable(guild_id: str, command_name: str) -> discord.Embed:
    """Disable a command in this server."""
    config = await guild_config.get_config(guild_id)
    command_key = command_name.lower()
    
    if command_key in config["disabled_commands"]:
        return create_error_embed(
            "Command Already Disabled",
            f"Command `{command_name}` is already disabled."
        )
    
    config["disabled_commands"].append(command_key)
    await guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Command Disabled",
        f"Command `{command_name}` has been disabled in this server."
    )


async def handle_command_enable(guild_id: str, command_name: str) -> discord.Embed:
    """Re-enable a disabled command."""
    config = await guild_config.get_config(guild_id)
    command_key = command_name.lower()
    
    if command_key not in config["disabled_commands"]:
        return create_error_embed(
            "Command Not Disabled",
            f"Command `{command_name}` is not disabled."
        )
    
    config["disabled_commands"].remove(command_key)
    await guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Command Enabled",
        f"Command `{command_name}` has been re-enabled in this server."
    )


async def handle_command_list(guild_id: str) -> discord.Embed:
    """List disabled commands."""
    config = await guild_config.get_config(guild_id)
    disabled = config.get("disabled_commands", [])
    
    if not disabled:
        return create_info_embed(
            "Disabled Commands",
            "No commands are currently disabled."
        )
    
    disabled_text = "\n".join([f"`{cmd}`" for cmd in sorted(disabled)])
    
    embed = create_info_embed(
        "Disabled Commands",
        "Commands currently disabled in this server:"
    )
    embed.add_field(name="Disabled", value=truncate_field_value(disabled_text, item_count=len(disabled) if disabled else 0), inline=False)
    
    return embed


def setup_command_commands(command_group: app_commands.Group):
    """Register command enable/disable slash commands."""
    @command_group.command(name="disable", description="Disable a command in this server")
    @app_commands.describe(command="The command name to disable")
    async def command_disable_slash(interaction: discord.Interaction, command: str):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod command disable", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_command_disable(str(interaction.guild.id), command)
        await interaction.followup.send(embed=embed)
    
    @command_group.command(name="enable", description="Re-enable a disabled command")
    @app_commands.describe(command="The command name to enable")
    async def command_enable_slash(interaction: discord.Interaction, command: str):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod command enable", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_command_enable(str(interaction.guild.id), command)
        await interaction.followup.send(embed=embed)
    
    @command_group.command(name="list", description="List disabled commands")
    async def command_list_slash(interaction: discord.Interaction):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod command list", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_command_list(str(interaction.guild.id))
        await interaction.followup.send(embed=embed)


async def handle_prefix_command(ctx: commands.Context, args: list):
    """Handle prefix command enable/disable routing."""
    guild_id = str(ctx.guild.id)
    
    if len(args) < 2:
        embed = create_usage_embed(
            f"Usage: `{PREFIX}mod command <disable|enable|list> [command]`"
        )
        await ctx.send(embed=embed)
        return
    
    action = args[1].lower()
    
    if action == "list":
        embed = await handle_command_list(guild_id)
        await ctx.send(embed=embed)
    elif action in ["disable", "enable"]:
        if len(args) < 3:
            embed = create_usage_embed(
                f"Usage: `{PREFIX}mod command {action} <command>`"
            )
            await ctx.send(embed=embed)
            return
        
        command_name = args[2]
        if action == "disable":
            embed = await handle_command_disable(guild_id, command_name)
        else:
            embed = await handle_command_enable(guild_id, command_name)
        await ctx.send(embed=embed)
    else:
        embed = create_usage_embed(
            f"Usage: `{PREFIX}mod command <disable|enable|list> [command]`"
        )
        await ctx.send(embed=embed)

