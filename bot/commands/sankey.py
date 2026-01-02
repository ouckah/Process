"""Sankey diagram command handler."""
import discord
from discord import app_commands
from discord.ext import commands
import os
import httpx
from urllib.parse import quote

from utils.auth import get_user_token, api_request, API_URL
from utils.embeds import create_info_embed, create_error_embed
from utils.errors import handle_command_error
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


async def handle_sankey_command(discord_id: str, username: str) -> discord.Embed:
    """Handle sankey command. Returns embed with link to public analytics page."""
    try:
        token = await get_user_token(discord_id, username)
        
        # Get user info to get their username
        user_info = await api_request("GET", "/auth/me", token)
        user_username = user_info.get("username")
        
        if not user_username:
            return create_error_embed(
                "Error",
                "Unable to retrieve your username. Please try again."
            )
        
        # Check if user has public processes by calling the public analytics endpoint
        try:
            # Use unauthenticated request to check public analytics
            async with httpx.AsyncClient(timeout=10.0) as client:
                analytics_response = await client.get(
                    f"{API_URL}/api/analytics/{quote(user_username)}/public"
                )
                
                if analytics_response.status_code == 404:
                    return create_error_embed(
                        "No Public Processes",
                        "You don't have any public processes. Make some processes public to view your Sankey diagram.",
                        fields=[{
                            "name": "How to make processes public",
                            "value": "Use the website dashboard or `p!edit <company> privacy public`",
                            "inline": False
                        }]
                    )
                
                analytics_response.raise_for_status()
                analytics_data = analytics_response.json()
                
                if not analytics_data.get("processes") or len(analytics_data["processes"]) == 0:
                    return create_error_embed(
                        "No Public Processes",
                        "You don't have any public processes. Make some processes public to view your Sankey diagram.",
                        fields=[{
                            "name": "How to make processes public",
                            "value": "Use the website dashboard or `p!edit <company> privacy public`",
                            "inline": False
                        }]
                    )
                
                # Build URLs
                analytics_url = f"{FRONTEND_URL}/analytics/{quote(user_username)}"
                image_url = f"{FRONTEND_URL}/api/analytics/{quote(user_username)}/sankey-image"
                
                # Create embed with link and OG image
                embed = discord.Embed(
                    title="📊 Sankey Diagram",
                    description=f"Stage flow visualization for {len(analytics_data['processes'])} public process{'es' if len(analytics_data['processes']) != 1 else ''}\n\n[View Full Analytics]({analytics_url})",
                    color=0x5865F2,
                    url=analytics_url
                )
                embed.set_image(url=image_url)
                embed.timestamp = discord.utils.utcnow()
                
                return embed
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return create_error_embed(
                    "No Public Processes",
                    "You don't have any public processes. Make some processes public to view your Sankey diagram.",
                    fields=[{
                        "name": "How to make processes public",
                        "value": "Use the website dashboard or `p!edit <company> privacy public`",
                        "inline": False
                    }]
                )
            raise
        
    except Exception as e:
        return handle_command_error(e, "generating Sankey diagram")




def setup_sankey_command(bot: commands.Bot):
    """Setup sankey command (both slash and prefix)."""
    
    # Slash command
    @bot.tree.command(name="sankey", description="Generate a Sankey diagram of your public processes")
    async def sankey_slash(interaction: discord.Interaction):
        """Sankey command: /sankey"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="sankey",
            user_id=discord_id,
            username=username,
        )
        
        await interaction.response.defer()
        embed = await handle_sankey_command(discord_id, username)
        await interaction.followup.send(embed=embed)
    
    # Prefix command
    @bot.command(name="sankey")
    async def sankey_prefix(ctx: commands.Context):
        """Sankey command: p!sankey"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="sankey",
            user_id=discord_id,
            username=username,
        )
        
        embed = await handle_sankey_command(discord_id, username)
        await ctx.send(embed=embed)

