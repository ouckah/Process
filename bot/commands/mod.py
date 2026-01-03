"""Moderator commands handler for bot configuration."""
import discord
from discord import app_commands
from discord.ext import commands
import os
import asyncio
from typing import Optional

from utils.config import guild_config
from utils.permissions import require_mod_permission, has_mod_permission
from utils.embeds import create_success_embed, create_error_embed, create_info_embed, create_usage_embed
from utils.errors import handle_command_error
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")


async def handle_channel_allow(guild_id: str, channel_id: int) -> discord.Embed:
    """Add a channel to the allowed list."""
    config = guild_config.get_config(guild_id)
    
    if channel_id in config["allowed_channels"]:
        return create_error_embed(
            "Channel Already Allowed",
            f"Channel <#{channel_id}> is already in the allowed list."
        )
    
    # Remove from denied list if present
    if channel_id in config["denied_channels"]:
        config["denied_channels"].remove(channel_id)
    
    config["allowed_channels"].append(channel_id)
    guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Channel Allowed",
        f"Channel <#{channel_id}> has been added to the allowed list."
    )


async def handle_channel_deny(guild_id: str, channel_id: int) -> discord.Embed:
    """Add a channel to the denied list."""
    config = guild_config.get_config(guild_id)
    
    if channel_id in config["denied_channels"]:
        return create_error_embed(
            "Channel Already Denied",
            f"Channel <#{channel_id}> is already in the denied list."
        )
    
    # Remove from allowed list if present
    if channel_id in config["allowed_channels"]:
        config["allowed_channels"].remove(channel_id)
    
    config["denied_channels"].append(channel_id)
    guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Channel Denied",
        f"Channel <#{channel_id}> has been added to the denied list."
    )


async def handle_channel_remove(guild_id: str, channel_id: int) -> discord.Embed:
    """Remove a channel from allow/deny lists."""
    config = guild_config.get_config(guild_id)
    removed_from = []
    
    if channel_id in config["allowed_channels"]:
        config["allowed_channels"].remove(channel_id)
        removed_from.append("allowed")
    
    if channel_id in config["denied_channels"]:
        config["denied_channels"].remove(channel_id)
        removed_from.append("denied")
    
    if not removed_from:
        return create_error_embed(
            "Channel Not Found",
            f"Channel <#{channel_id}> is not in any restriction list."
        )
    
    guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Channel Removed",
        f"Channel <#{channel_id}> has been removed from the {' and '.join(removed_from)} list(s)."
    )


async def handle_channel_list(guild_id: str) -> discord.Embed:
    """List current channel restrictions."""
    config = guild_config.get_config(guild_id)
    
    allowed = config.get("allowed_channels", [])
    denied = config.get("denied_channels", [])
    
    allowed_text = "\n".join([f"<#{ch}>" for ch in allowed]) if allowed else "None"
    denied_text = "\n".join([f"<#{ch}>" for ch in denied]) if denied else "None"
    
    embed = create_info_embed(
        "Channel Restrictions",
        "Current channel restrictions for this server:"
    )
    embed.add_field(name="Allowed Channels", value=allowed_text, inline=False)
    embed.add_field(name="Denied Channels", value=denied_text, inline=False)
    
    if not allowed and not denied:
        embed.add_field(
            name="Note",
            value="No restrictions set. Bot works in all channels.",
            inline=False
        )
    
    return embed


async def handle_cooldown_set(guild_id: str, command_name: str, seconds: float) -> discord.Embed:
    """Set cooldown for a command."""
    if seconds < 0:
        return create_error_embed(
            "Invalid Cooldown",
            "Cooldown must be 0 or greater."
        )
    
    config = guild_config.get_config(guild_id)
    config["command_cooldowns"][command_name.lower()] = seconds
    guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Cooldown Set",
        f"Cooldown for `{command_name}` set to {seconds} seconds."
    )


async def handle_cooldown_remove(guild_id: str, command_name: str) -> discord.Embed:
    """Remove cooldown for a command."""
    config = guild_config.get_config(guild_id)
    command_key = command_name.lower()
    
    if command_key not in config["command_cooldowns"]:
        return create_error_embed(
            "Cooldown Not Found",
            f"No cooldown set for `{command_name}`."
        )
    
    del config["command_cooldowns"][command_key]
    guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Cooldown Removed",
        f"Cooldown for `{command_name}` has been removed."
    )


async def handle_cooldown_list(guild_id: str) -> discord.Embed:
    """List all command cooldowns."""
    config = guild_config.get_config(guild_id)
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
    embed.add_field(name="Cooldowns", value=cooldown_text, inline=False)
    
    return embed


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


async def handle_prefix_set(guild_id: str, prefix: Optional[str]) -> discord.Embed:
    """Set custom prefix for server."""
    if prefix and len(prefix) > 10:
        return create_error_embed(
            "Invalid Prefix",
            "Prefix must be 10 characters or less."
        )
    
    config = guild_config.get_config(guild_id)
    config["command_prefix"] = prefix
    guild_config.save_config(guild_id, config)
    
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


async def handle_command_disable(guild_id: str, command_name: str) -> discord.Embed:
    """Disable a command in this server."""
    config = guild_config.get_config(guild_id)
    command_key = command_name.lower()
    
    if command_key in config["disabled_commands"]:
        return create_error_embed(
            "Command Already Disabled",
            f"Command `{command_name}` is already disabled."
        )
    
    config["disabled_commands"].append(command_key)
    guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Command Disabled",
        f"Command `{command_name}` has been disabled in this server."
    )


async def handle_command_enable(guild_id: str, command_name: str) -> discord.Embed:
    """Re-enable a disabled command."""
    config = guild_config.get_config(guild_id)
    command_key = command_name.lower()
    
    if command_key not in config["disabled_commands"]:
        return create_error_embed(
            "Command Not Disabled",
            f"Command `{command_name}` is not disabled."
        )
    
    config["disabled_commands"].remove(command_key)
    guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Command Enabled",
        f"Command `{command_name}` has been re-enabled in this server."
    )


async def handle_command_list(guild_id: str) -> discord.Embed:
    """List disabled commands."""
    config = guild_config.get_config(guild_id)
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
    embed.add_field(name="Disabled", value=disabled_text, inline=False)
    
    return embed


async def handle_settings(guild_id: str) -> discord.Embed:
    """View all current bot settings."""
    config = guild_config.get_config(guild_id)
    
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
    guild_config.reset_config(guild_id)
    
    return create_success_embed(
        "Settings Reset",
        "All bot settings have been reset to defaults."
    )


def setup_mod_command(bot: commands.Bot):
    """Setup moderator command (both slash and prefix)."""
    
    # Slash command with subcommands
    mod_group = app_commands.Group(name="mod", description="Moderator commands for bot configuration")
    
    # Channel subcommands
    channel_group = app_commands.Group(name="channel", description="Manage channel restrictions", parent=mod_group)
    
    @channel_group.command(name="allow", description="Allow bot to work in a channel")
    @app_commands.describe(channel="The channel to allow")
    async def channel_allow_slash(interaction: discord.Interaction, channel: discord.TextChannel):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod channel allow", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_channel_allow(str(interaction.guild.id), channel.id)
        await interaction.followup.send(embed=embed)
    
    @channel_group.command(name="deny", description="Deny bot from working in a channel")
    @app_commands.describe(channel="The channel to deny")
    async def channel_deny_slash(interaction: discord.Interaction, channel: discord.TextChannel):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod channel deny", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_channel_deny(str(interaction.guild.id), channel.id)
        await interaction.followup.send(embed=embed)
    
    @channel_group.command(name="remove", description="Remove channel from allow/deny lists")
    @app_commands.describe(channel="The channel to remove")
    async def channel_remove_slash(interaction: discord.Interaction, channel: discord.TextChannel):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod channel remove", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_channel_remove(str(interaction.guild.id), channel.id)
        await interaction.followup.send(embed=embed)
    
    @channel_group.command(name="list", description="List current channel restrictions")
    async def channel_list_slash(interaction: discord.Interaction):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod channel list", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        embed = await handle_channel_list(str(interaction.guild.id))
        await interaction.followup.send(embed=embed)
    
    # Cooldown subcommands
    cooldown_group = app_commands.Group(name="cooldown", description="Manage command cooldowns", parent=mod_group)
    
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
    
    # Autodelete subcommands
    autodelete_group = app_commands.Group(name="autodelete", description="Manage auto-delete settings", parent=mod_group)
    
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
    
    # Prefix subcommands
    prefix_group = app_commands.Group(name="prefix", description="Manage command prefix", parent=mod_group)
    
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
    
    # Command enable/disable subcommands
    command_group = app_commands.Group(name="command", description="Enable/disable commands", parent=mod_group)
    
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
    
    # Settings and reset commands
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
                if len(args) < 2:
                    embed = create_usage_embed(
                        f"Usage: `{PREFIX}mod channel <allow|deny|remove|list> [channel]`"
                    )
                    await ctx.send(embed=embed)
                    return
                
                action = args[1].lower()
                
                if action == "list":
                    embed = await handle_channel_list(guild_id)
                    await ctx.send(embed=embed)
                elif action in ["allow", "deny", "remove"]:
                    if len(args) < 3:
                        embed = create_usage_embed(
                            f"Usage: `{PREFIX}mod channel {action} <#channel>`"
                        )
                        await ctx.send(embed=embed)
                        return
                    
                    # Parse channel mention
                    channel_mention = args[2]
                    channel_id = None
                    
                    # Try to extract channel ID from mention
                    if channel_mention.startswith("<#") and channel_mention.endswith(">"):
                        try:
                            channel_id = int(channel_mention[2:-1])
                        except ValueError:
                            pass
                    else:
                        # Try to find channel by name
                        channel = discord.utils.get(ctx.guild.channels, name=channel_mention)
                        if channel:
                            channel_id = channel.id
                    
                    if channel_id is None:
                        embed = create_error_embed(
                            "Invalid Channel",
                            f"Could not find channel: {channel_mention}"
                        )
                        await ctx.send(embed=embed)
                        return
                    
                    if action == "allow":
                        embed = await handle_channel_allow(guild_id, channel_id)
                    elif action == "deny":
                        embed = await handle_channel_deny(guild_id, channel_id)
                    else:  # remove
                        embed = await handle_channel_remove(guild_id, channel_id)
                    
                    await ctx.send(embed=embed)
                else:
                    embed = create_usage_embed(
                        f"Usage: `{PREFIX}mod channel <allow|deny|remove|list> [channel]`"
                    )
                    await ctx.send(embed=embed)
            
            elif subcommand == "cooldown":
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
            
            elif subcommand == "autodelete":
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
            
            elif subcommand == "prefix":
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
            
            elif subcommand == "command":
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
            
            elif subcommand == "settings":
                embed = await handle_settings(guild_id)
                await ctx.send(embed=embed)
            
            elif subcommand == "reset":
                embed = await handle_reset(guild_id)
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

