"""Anonymous mode command handler."""
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


async def handle_anon_command(discord_id: str, username: str, action: str) -> discord.Embed:
    """Handle anon command. Returns embed with success/error message."""
    try:
        action_lower = action.lower().strip()
        
        if action_lower not in ['enable', 'disable']:
            return create_usage_embed(
                f"Usage: `{PREFIX}anon <enable | disable>`",
                examples=[
                    f"{PREFIX}anon enable",
                    f"{PREFIX}anon disable"
                ],
                fields=[{
                    "name": "What does this do?",
                    "value": "Controls whether your username is shown on your public profile.\n• **enable**: Hide your username on public profile (anonymous mode)\n• **disable**: Show your username on public profile",
                    "inline": False
                }]
            )
        
        token = await get_user_token(discord_id, username)
        
        # Update user's is_anonymous preference
        is_anonymous = action_lower == 'enable'
        await api_request("PATCH", "/auth/me", token, json={
            "is_anonymous": is_anonymous
        })
        
        status = "enabled" if is_anonymous else "disabled"
        return create_success_embed(
            "Anonymous Mode Updated",
            f"Anonymous mode is now **{status}**.\n\n" + 
            ("Your username will be hidden on your public profile." if is_anonymous else "Your username will be shown on your public profile.")
        )
    except Exception as e:
        return handle_command_error(e, "updating anonymous mode")


def setup_anon_command(bot: commands.Bot):
    """Setup anon command (both slash and prefix)."""
    
    # Slash command
    @bot.tree.command(name="anon", description="Enable or disable anonymous mode for your profile")
    @app_commands.describe(action="Enable or disable anonymous mode")
    @app_commands.choices(action=[
        app_commands.Choice(name="enable", value="enable"),
        app_commands.Choice(name="disable", value="disable")
    ])
    async def anon_slash(interaction: discord.Interaction, action: str):
        """Anon command: /anon <enable | disable>"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="anon",
            user_id=discord_id,
            username=username,
            parsed_args={"action": action}
        )
        
        await interaction.response.defer()
        embed = await handle_anon_command(discord_id, username, action)
        await interaction.followup.send(embed=embed)
    
    # Prefix command
    @bot.command(name="anon")
    async def anon_prefix(ctx: commands.Context, *, action: str = None):
        """Anon command: p!anon <enable | disable>"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        if not action:
            embed = create_usage_embed(
                f"Usage: `{PREFIX}anon <enable | disable>`",
                examples=[
                    f"{PREFIX}anon enable",
                    f"{PREFIX}anon disable"
                ],
                fields=[{
                    "name": "What does this do?",
                    "value": "Controls whether your username is shown on your public profile.\n• **enable**: Hide your username on public profile (anonymous mode)\n• **disable**: Show your username on public profile",
                    "inline": False
                }]
            )
            await ctx.send(embed=embed)
            return
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="anon",
            user_id=discord_id,
            username=username,
            raw_args=action,
            parsed_args={"action": action}
        )
        
        embed = await handle_anon_command(discord_id, username, action)
        await ctx.send(embed=embed)

