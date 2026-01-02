"""Privacy command handler."""
import discord
from discord import app_commands
from discord.ext import commands
import os
from dotenv import load_dotenv

from utils.auth import get_user_token, api_request
from utils.embeds import create_success_embed, create_error_embed, create_usage_embed
from utils.errors import handle_command_error
from utils.logging import log_command

load_dotenv()
PREFIX = os.getenv("PREFIX", "p!")


async def handle_privacy_command(discord_id: str, username: str, mode: str) -> discord.Embed:
    """Handle privacy command. Returns embed with success/error message."""
    try:
        mode_lower = mode.lower().strip()
        
        if mode_lower not in ['private', 'public']:
            return create_usage_embed(
                f"Usage: `{PREFIX}privacy <private | public>`",
                examples=[
                    f"{PREFIX}privacy private",
                    f"{PREFIX}privacy public"
                ],
                fields=[{
                    "name": "What does this do?",
                    "value": "Sets the default privacy mode for processes created via Discord bot commands.\n• **private**: New processes are private by default\n• **public**: New processes are public by default",
                    "inline": False
                }]
            )
        
        token = await get_user_token(discord_id, username)
        
        # Update user's discord_privacy_mode preference
        await api_request("PATCH", "/auth/me", token, json={
            "discord_privacy_mode": mode_lower
        })
        
        mode_display = "private" if mode_lower == 'private' else "public"
        return create_success_embed(
            "Privacy Mode Updated",
            f"Your default privacy mode is now set to **{mode_display}**.\n\nNew processes created via Discord bot commands will be {mode_display} by default."
        )
    except Exception as e:
        return handle_command_error(e, "updating privacy mode")


def setup_privacy_command(bot: commands.Bot):
    """Setup privacy command (both slash and prefix)."""
    
    # Slash command
    @bot.tree.command(name="privacy", description="Set default privacy mode for Discord bot processes")
    @app_commands.describe(mode="Privacy mode: private or public")
    @app_commands.choices(mode=[
        app_commands.Choice(name="private", value="private"),
        app_commands.Choice(name="public", value="public")
    ])
    async def privacy_slash(interaction: discord.Interaction, mode: str):
        """Privacy command: /privacy <private | public>"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="privacy",
            user_id=discord_id,
            username=username,
            parsed_args={"mode": mode}
        )
        
        await interaction.response.defer()
        embed = await handle_privacy_command(discord_id, username, mode)
        await interaction.followup.send(embed=embed)
    
    # Prefix command
    @bot.command(name="privacy")
    async def privacy_prefix(ctx: commands.Context, *, mode: str = None):
        """Privacy command: p!privacy <private | public>"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        if not mode:
            embed = create_usage_embed(
                f"Usage: `{PREFIX}privacy <private | public>`",
                examples=[
                    f"{PREFIX}privacy private",
                    f"{PREFIX}privacy public"
                ],
                fields=[{
                    "name": "What does this do?",
                    "value": "Sets the default privacy mode for processes created via Discord bot commands.\n• **private**: New processes are private by default\n• **public**: New processes are public by default",
                    "inline": False
                }]
            )
            await ctx.send(embed=embed)
            return
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="privacy",
            user_id=discord_id,
            username=username,
            raw_args=mode,
            parsed_args={"mode": mode}
        )
        
        embed = await handle_privacy_command(discord_id, username, mode)
        await ctx.send(embed=embed)

