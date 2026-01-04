"""Channel restriction commands for moderators."""
import discord
from discord import app_commands
from discord.ext import commands
import os

from utils.config import guild_config
from utils.permissions import require_mod_permission
from utils.embeds import create_success_embed, create_error_embed, create_info_embed, create_usage_embed
from utils.errors import handle_command_error
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")

# Discord embed field value limit
MAX_FIELD_VALUE_LENGTH = 1024


def truncate_field_value(text: str, max_length: int = MAX_FIELD_VALUE_LENGTH, item_count: int = None) -> str:
    """Truncate text to fit Discord embed field value limit, ensuring we don't cut off mid-mention."""
    if len(text) <= max_length:
        return text
    # Calculate suffix length
    if item_count:
        suffix = f"\n... ({item_count} total items)"
    else:
        suffix = "..."
    suffix_len = len(suffix)
    
    # Find the truncation point
    truncate_at = max_length - suffix_len
    
    # If we're in the middle of a channel mention (<#...>), find the last complete mention
    # Look backwards from truncate_at to find the last comma or start of string
    if truncate_at < len(text) and text[truncate_at] != ',':
        # Check if we're inside a mention
        last_comma = text.rfind(',', 0, truncate_at)
        if last_comma != -1:
            # Truncate after the last complete item (after the comma)
            truncate_at = last_comma + 1
        else:
            # No comma found, check if we're in a mention at the start
            if truncate_at > 0 and text[truncate_at - 1] == '>':
                # We're at the end of a mention, that's fine
                pass
            else:
                # We're in the middle of the first/only item, truncate at start
                truncate_at = 0
    
    truncated = text[:truncate_at].rstrip(', ') + suffix
    return truncated


async def handle_channel_allow(guild_id: str, channel_id: int = None, all_channels: list = None) -> discord.Embed:
    """Add a channel (or all channels) to the allowed list."""
    config = await guild_config.get_config(guild_id)
    
    if all_channels is not None:
        # Handle "all" case
        if not all_channels:
            return create_error_embed(
                "Invalid Arguments",
                "No channels provided in all_channels list."
            )
        # Handle "all" case
        added_count = 0
        already_count = 0
        
        for channel in all_channels:
            if channel.id not in config["allowed_channels"]:
                # Remove from denied list if present
                if channel.id in config["denied_channels"]:
                    config["denied_channels"].remove(channel.id)
                config["allowed_channels"].append(channel.id)
                added_count += 1
            else:
                already_count += 1
        
        await guild_config.save_config(guild_id, config)
        
        if added_count == 0:
            return create_error_embed(
                "Channels Already Allowed",
                "All text channels are already in the allowed list."
            )
        
        message = f"Added {added_count} channel{'s' if added_count != 1 else ''} to the allowed list."
        if already_count > 0:
            message += f" {already_count} channel{'s were' if already_count != 1 else 'was'} already allowed."
        
        return create_success_embed("Channels Allowed", message)
    
    # Single channel case - validate channel_id is provided
    if channel_id is None:
        return create_error_embed(
            "Invalid Arguments",
            "Either channel_id or all_channels must be provided."
        )
    
    if channel_id in config["allowed_channels"]:
        return create_error_embed(
            "Channel Already Allowed",
            f"Channel <#{channel_id}> is already in the allowed list."
        )
    
    # Remove from denied list if present
    if channel_id in config["denied_channels"]:
        config["denied_channels"].remove(channel_id)
    
    config["allowed_channels"].append(channel_id)
    await guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Channel Allowed",
        f"Channel <#{channel_id}> has been added to the allowed list."
    )


async def handle_channel_deny(guild_id: str, channel_id: int = None, all_channels: list = None) -> discord.Embed:
    """Add a channel (or all channels) to the denied list."""
    config = await guild_config.get_config(guild_id)
    
    if all_channels is not None:
        # Handle "all" case
        if not all_channels:
            return create_error_embed(
                "Invalid Arguments",
                "No channels provided in all_channels list."
            )
        # Handle "all" case
        added_count = 0
        already_count = 0
        
        for channel in all_channels:
            if channel.id not in config["denied_channels"]:
                # Remove from allowed list if present
                if channel.id in config["allowed_channels"]:
                    config["allowed_channels"].remove(channel.id)
                config["denied_channels"].append(channel.id)
                added_count += 1
            else:
                already_count += 1
        
        await guild_config.save_config(guild_id, config)
        
        if added_count == 0:
            return create_error_embed(
                "Channels Already Denied",
                "All text channels are already in the denied list."
            )
        
        message = f"Added {added_count} channel{'s' if added_count != 1 else ''} to the denied list."
        if already_count > 0:
            message += f" {already_count} channel{'s were' if already_count != 1 else 'was'} already denied."
        
        return create_success_embed("Channels Denied", message)
    
    # Single channel case
    if channel_id is None:
        return create_error_embed(
            "Invalid Arguments",
            "Either channel_id or all_channels must be provided."
        )
    
    if channel_id in config["denied_channels"]:
        return create_error_embed(
            "Channel Already Denied",
            f"Channel <#{channel_id}> is already in the denied list."
        )
    
    # Remove from allowed list if present
    if channel_id in config["allowed_channels"]:
        config["allowed_channels"].remove(channel_id)
    
    config["denied_channels"].append(channel_id)
    await guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Channel Denied",
        f"Channel <#{channel_id}> has been added to the denied list."
    )


async def handle_channel_remove(guild_id: str, channel_id: int) -> discord.Embed:
    """Remove a channel from allow/deny lists."""
    config = await guild_config.get_config(guild_id)
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
    
    await guild_config.save_config(guild_id, config)
    
    return create_success_embed(
        "Channel Removed",
        f"Channel <#{channel_id}> has been removed from the {' and '.join(removed_from)} list(s)."
    )


async def handle_channel_list(guild_id: str) -> discord.Embed:
    """List current channel restrictions."""
    try:
        config = await guild_config.get_config(guild_id)
    except Exception as e:
        error_msg = str(e)
        if "CONFIG_CONNECTION_TIMEOUT" in error_msg:
            return create_error_embed(
                "Connection Timeout",
                "Unable to load server settings. The API server did not respond in time.\n\nYour settings are still saved, but cannot be displayed right now. Please try again later."
            )
        elif "CONFIG_CONNECTION_ERROR" in error_msg:
            return create_error_embed(
                "Connection Error",
                "Unable to connect to the API server to load settings.\n\nYour settings are still saved, but cannot be displayed right now. Please try again later."
            )
        else:
            return create_error_embed(
                "Error Loading Settings",
                "Unable to load server settings. Please try again later."
            )
    
    allowed = config.get("allowed_channels", [])
    denied = config.get("denied_channels", [])
    
    # Format as comma-separated (like settings command)
    allowed_text = ", ".join([f"<#{ch}>" for ch in allowed]) if allowed else "None"
    denied_text = ", ".join([f"<#{ch}>" for ch in denied]) if denied else "None"
    
    embed = create_info_embed(
        "Channel Restrictions",
        "Current channel restrictions for this server:"
    )
    
    embed.add_field(
        name="Allowed Channels", 
        value=truncate_field_value(allowed_text, item_count=len(allowed) if allowed else 0), 
        inline=False
    )
    embed.add_field(
        name="Denied Channels", 
        value=truncate_field_value(denied_text, item_count=len(denied) if denied else 0), 
        inline=False
    )
    
    if not allowed and not denied:
        embed.add_field(
            name="Note",
            value="No restrictions set. Bot works in all channels.",
            inline=False
        )
    
    return embed


def setup_channel_commands(channel_group: app_commands.Group):
    """Register channel slash commands."""
    @channel_group.command(name="allow", description="Allow bot to work in a channel (or all channels)")
    @app_commands.describe(target="The channel to allow, or 'all' for all channels")
    async def channel_allow_slash(interaction: discord.Interaction, target: str):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod channel allow", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        
        if target.lower() == "all":
            # Get all text channels
            all_channels = [ch for ch in interaction.guild.channels if isinstance(ch, discord.TextChannel)]
            embed = await handle_channel_allow(str(interaction.guild.id), all_channels=all_channels)
        else:
            # Try to parse as channel mention or ID
            channel_id = None
            if target.startswith("<#") and target.endswith(">"):
                try:
                    channel_id = int(target[2:-1])
                except ValueError:
                    pass
            else:
                try:
                    channel_id = int(target)
                except ValueError:
                    # Try to find by name
                    channel = discord.utils.get(interaction.guild.channels, name=target)
                    if channel:
                        channel_id = channel.id
            
            if channel_id is None:
                embed = create_error_embed(
                    "Invalid Channel",
                    f"Could not find channel: {target}. Use a channel mention, channel ID, channel name, or 'all'."
                )
            else:
                embed = await handle_channel_allow(str(interaction.guild.id), channel_id)
        
        await interaction.followup.send(embed=embed)
    
    @channel_group.command(name="deny", description="Deny bot from working in a channel (or all channels)")
    @app_commands.describe(target="The channel to deny, or 'all' for all channels")
    async def channel_deny_slash(interaction: discord.Interaction, target: str):
        if not interaction.guild:
            await interaction.response.send_message("This command can only be used in a server.", ephemeral=True)
            return
        
        has_permission, error_embed = await require_mod_permission(interaction=interaction)
        if not has_permission:
            await interaction.response.send_message(embed=error_embed, ephemeral=True)
            return
        
        log_command("slash", "mod channel deny", str(interaction.user.id), interaction.user.name)
        
        await interaction.response.defer()
        
        if target.lower() == "all":
            # Get all text channels
            all_channels = [ch for ch in interaction.guild.channels if isinstance(ch, discord.TextChannel)]
            embed = await handle_channel_deny(str(interaction.guild.id), all_channels=all_channels)
        else:
            # Try to parse as channel mention or ID
            channel_id = None
            if target.startswith("<#") and target.endswith(">"):
                try:
                    channel_id = int(target[2:-1])
                except ValueError:
                    pass
            else:
                try:
                    channel_id = int(target)
                except ValueError:
                    # Try to find by name
                    channel = discord.utils.get(interaction.guild.channels, name=target)
                    if channel:
                        channel_id = channel.id
            
            if channel_id is None:
                embed = create_error_embed(
                    "Invalid Channel",
                    f"Could not find channel: {target}. Use a channel mention, channel ID, channel name, or 'all'."
                )
            else:
                embed = await handle_channel_deny(str(interaction.guild.id), channel_id)
        
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


async def handle_prefix_channel(ctx: commands.Context, args: list):
    """Handle prefix channel command routing."""
    guild_id = str(ctx.guild.id)
    
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
                f"Usage: `{PREFIX}mod channel {action} <#channel|all>`"
            )
            await ctx.send(embed=embed)
            return
        
        # Check if "all" was specified
        channel_arg = args[2].lower()
        if channel_arg == "all":
            if action == "remove":
                embed = create_error_embed(
                    "Invalid Usage",
                    "Cannot remove 'all' channels. Please specify a specific channel."
                )
                await ctx.send(embed=embed)
                return
            
            # Get all text channels
            all_channels = [ch for ch in ctx.guild.channels if isinstance(ch, discord.TextChannel)]
            
            if not all_channels:
                embed = create_error_embed(
                    "No Channels Found",
                    "No text channels found in this server."
                )
                await ctx.send(embed=embed)
                return
            
            try:
                if action == "allow":
                    embed = await handle_channel_allow(guild_id, channel_id=None, all_channels=all_channels)
                else:  # deny
                    embed = await handle_channel_deny(guild_id, channel_id=None, all_channels=all_channels)
                
                await ctx.send(embed=embed)
            except Exception as e:
                embed = handle_command_error(e, f"mod channel {action}")
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

