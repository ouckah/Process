"""Sankey diagram command handler."""
import discord
from discord import app_commands
from discord.ext import commands
import os
import httpx
from urllib.parse import quote

from utils.auth import get_user_token, api_request
from utils.embeds import create_info_embed, create_error_embed
from utils.errors import handle_command_error
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")


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
            api_url = os.getenv("API_URL", "http://localhost:8000")
            async with httpx.AsyncClient(timeout=10.0) as client:
                analytics_response = await client.get(
                    f"{api_url}/api/analytics/{quote(user_username)}/public"
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
                
                # Calculate cache buster (same logic as layout.tsx)
                cache_buster = ""
                if analytics_data.get("processes") and len(analytics_data["processes"]) > 0:
                    # Create a hash from the actual data that changes when stages are added/updated
                    data_hash = 0
                    
                    # Hash process count
                    data_hash += len(analytics_data["processes"])
                    
                    # Hash all stage data (count, names, dates) to catch any changes
                    if analytics_data.get("process_details"):
                        for detail in analytics_data["process_details"]:
                            if detail.get("stages"):
                                # Add stage count to hash
                                data_hash += len(detail["stages"])
                                
                                # Add hash of stage names and dates
                                for stage in detail["stages"]:
                                    if stage.get("stage_name"):
                                        data_hash += len(stage["stage_name"])
                                    if stage.get("stage_date"):
                                        try:
                                            from datetime import datetime
                                            stage_date = datetime.fromisoformat(stage["stage_date"].replace('Z', '+00:00'))
                                            data_hash += int(stage_date.timestamp() * 1000) % 1000000
                                        except:
                                            pass
                                    # Also use updated_at if available
                                    if stage.get("updated_at"):
                                        try:
                                            from datetime import datetime
                                            stage_updated = datetime.fromisoformat(stage["updated_at"].replace('Z', '+00:00'))
                                            data_hash += int(stage_updated.timestamp() * 1000) % 1000000
                                        except:
                                            pass
                    
                    # Also check the most recent updated_at as a fallback
                    most_recent_update = None
                    for process in analytics_data["processes"]:
                        updated_at = process.get("updated_at")
                        if updated_at:
                            if not most_recent_update or updated_at > most_recent_update:
                                most_recent_update = updated_at
                    
                    if analytics_data.get("process_details"):
                        for detail in analytics_data["process_details"]:
                            if detail.get("stages"):
                                for stage in detail["stages"]:
                                    stage_updated_at = stage.get("updated_at")
                                    if stage_updated_at:
                                        if not most_recent_update or stage_updated_at > most_recent_update:
                                            most_recent_update = stage_updated_at
                    
                    # Combine data hash with timestamp for more reliable cache busting
                    process_count = len(analytics_data["processes"])
                    if most_recent_update:
                        try:
                            from datetime import datetime
                            update_timestamp = datetime.fromisoformat(most_recent_update.replace('Z', '+00:00'))
                            update_hash = int(update_timestamp.timestamp() * 1000)
                        except:
                            import time
                            update_hash = int(time.time() * 1000)
                    else:
                        import time
                        update_hash = int(time.time() * 1000)
                    
                    # Use data hash + timestamp to ensure changes are detected
                    cache_buster = f"?v={process_count}-{data_hash}-{update_hash}"
                else:
                    import time
                    cache_buster = f"?v=0-{int(time.time() * 1000)}"
                
                # Build URLs with cache buster
                frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
                sankey_url = f"{frontend_url}/sankey/{quote(user_username)}{cache_buster}"
                image_url = f"{frontend_url}/api/sankey/{quote(user_username)}/og-image{cache_buster}"
                
                # Create embed with link and OG image
                embed = discord.Embed(
                    title="📊 Sankey Diagram",
                    description=f"Stage flow visualization for {len(analytics_data['processes'])} public process{'es' if len(analytics_data['processes']) != 1 else ''}\n\n[View Sankey Diagram]({sankey_url})",
                    color=0x5865F2,
                    url=sankey_url
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

