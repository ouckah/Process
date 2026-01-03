"""Dashboard command handler."""
import discord
from discord import app_commands
from discord.ext import commands
import os

from utils.auth import get_user_token, api_request
from utils.embeds import create_info_embed, create_error_embed
from utils.errors import handle_command_error
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")


async def handle_dashboard_command(discord_id: str, username: str) -> discord.Embed:
    """Handle dashboard command. Returns embed with dashboard link or signup instructions."""
    try:
        # Get user token to check account status
        token = await get_user_token(discord_id, username)
        
        # Get user info to check if they have a web account (email)
        user_info = await api_request("GET", "/auth/me", token)
        
        has_web_account = user_info.get("email") is not None
        
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        
        if has_web_account:
            # User has web account - send dashboard link
            dashboard_url = f"{frontend_url}/dashboard"
            return create_info_embed(
                "📊 Dashboard",
                f"Access your dashboard at: [**Open Dashboard**]({dashboard_url})",
                fields=[{
                    "name": "What's on the dashboard?",
                    "value": "• View all your processes\n• Add and manage stages\n• Track your application progress\n• Share processes publicly",
                    "inline": False
                }]
            )
        else:
            # User doesn't have web account - send signup link and instructions
            signup_url = f"{frontend_url}/register"
            profile_url = f"{frontend_url}/profile"
            return create_info_embed(
                "🔗 Connect Your Account",
                f"To access the dashboard, you need to create a web account and link your Discord.",
                fields=[
                    {
                        "name": "Step 1: Sign Up",
                        "value": f"[**Create Account**]({signup_url})\nSign up with your email address",
                        "inline": False
                    },
                    {
                        "name": "Step 2: Link Discord",
                        "value": f"After signing up, go to your [**Profile**]({profile_url}) and click \"Connect Discord\" to link your accounts.",
                        "inline": False
                    },
                    {
                        "name": "Why link accounts?",
                        "value": "Linking your Discord account allows you to:\n• Use bot commands and web dashboard together\n• Keep all your processes in sync\n• Access your data from anywhere",
                        "inline": False
                    }
                ]
            )
    except Exception as e:
        return handle_command_error(e, "getting dashboard link")


def setup_dashboard_command(bot: commands.Bot):
    """Setup dashboard command (both slash and prefix)."""
    
    # Slash command
    @bot.tree.command(name="dashboard", description="Get a link to your dashboard or sign up instructions")
    async def dashboard_slash(interaction: discord.Interaction):
        """Dashboard command: /dashboard"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="dashboard",
            user_id=discord_id,
            username=username
        )
        
        await interaction.response.defer()
        embed = await handle_dashboard_command(discord_id, username)
        await interaction.followup.send(embed=embed)
    
    # Prefix command
    @bot.command(name="dashboard")
    async def dashboard_prefix(ctx: commands.Context):
        """Dashboard command: p!dashboard"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="dashboard",
            user_id=discord_id,
            username=username
        )
        
        embed = await handle_dashboard_command(discord_id, username)
        await ctx.send(embed=embed)

