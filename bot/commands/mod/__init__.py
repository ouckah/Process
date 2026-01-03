"""Moderator commands handler for bot configuration."""
import discord
from discord import app_commands
from discord.ext import commands
import os

from utils.permissions import require_mod_permission
from utils.embeds import create_usage_embed, create_error_embed
from utils.errors import handle_command_error
from utils.logging import log_command

# Import subcommand modules
from . import channel, cooldown, autodelete, prefix, command, settings

PREFIX = os.getenv("PREFIX", "p!")


def setup_mod_command(bot: commands.Bot):
    """Setup moderator command (both slash and prefix)."""
    
    # Slash command with subcommands
    mod_group = app_commands.Group(name="mod", description="Moderator commands for bot configuration")
    
    # Channel subcommands
    channel_group = app_commands.Group(name="channel", description="Manage channel restrictions", parent=mod_group)
    channel.setup_channel_commands(channel_group)
    
    # Cooldown subcommands
    cooldown_group = app_commands.Group(name="cooldown", description="Manage command cooldowns", parent=mod_group)
    cooldown.setup_cooldown_commands(cooldown_group)
    
    # Autodelete subcommands
    autodelete_group = app_commands.Group(name="autodelete", description="Manage auto-delete settings", parent=mod_group)
    autodelete.setup_autodelete_commands(autodelete_group)
    
    # Prefix subcommands
    prefix_group = app_commands.Group(name="prefix", description="Manage command prefix", parent=mod_group)
    prefix.setup_prefix_commands(prefix_group)
    
    # Command enable/disable subcommands
    command_group = app_commands.Group(name="command", description="Enable/disable commands", parent=mod_group)
    command.setup_command_commands(command_group)
    
    # Settings and reset commands
    settings.setup_settings_commands(mod_group)
    
    bot.tree.add_command(mod_group)
    
    # Prefix command handler
    @bot.command(name="mod")
    async def mod_prefix(ctx: commands.Context, *args):
        """Moderator command: p!mod <subcommand> [args]"""
        if not ctx.guild:
            embed = create_error_embed(
                "Permission Error",
                "This command can only be used in a server."
            )
            await ctx.send(embed=embed)
            return
        
        has_permission, error_embed = await require_mod_permission(ctx=ctx)
        if not has_permission:
            await ctx.send(embed=error_embed)
            return
        
        if not args:
            embed = create_usage_embed(
                f"Usage: `{PREFIX}mod <subcommand> [args]`",
                examples=[
                    f"{PREFIX}mod channel allow #general",
                    f"{PREFIX}mod cooldown set add 5",
                    f"{PREFIX}mod settings"
                ],
                fields=[{
                    "name": "Subcommands",
                    "value": "channel, cooldown, autodelete, prefix, command, settings, reset",
                    "inline": False
                }]
            )
            await ctx.send(embed=embed)
            return
        
        subcommand = args[0].lower()
        guild_id = str(ctx.guild.id)
        
        log_command("prefix", f"mod {subcommand}", str(ctx.author.id), ctx.author.name, " ".join(args[1:]) if len(args) > 1 else None)
        
        try:
            if subcommand == "channel":
                await channel.handle_prefix_channel(ctx, list(args))
            elif subcommand == "cooldown":
                await cooldown.handle_prefix_cooldown(ctx, list(args))
            elif subcommand == "autodelete":
                await autodelete.handle_prefix_autodelete(ctx, list(args))
            elif subcommand == "prefix":
                await prefix.handle_prefix_prefix(ctx, list(args))
            elif subcommand == "command":
                await command.handle_prefix_command(ctx, list(args))
            elif subcommand == "settings":
                embed = await settings.handle_settings(guild_id)
                await ctx.send(embed=embed)
            elif subcommand == "reset":
                embed = await settings.handle_reset(guild_id)
                await ctx.send(embed=embed)
            else:
                embed = create_usage_embed(
                    f"Unknown subcommand: `{subcommand}`",
                    fields=[{
                        "name": "Available subcommands",
                        "value": "channel, cooldown, autodelete, prefix, command, settings, reset",
                        "inline": False
                    }]
                )
                await ctx.send(embed=embed)
        
        except Exception as e:
            embed = handle_command_error(e, f"mod {subcommand}")
            await ctx.send(embed=embed)
