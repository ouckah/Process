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


async def get_username_from_discord_id(target_discord_id: str) -> str:
    """Get username from Discord ID by checking if user exists (doesn't create account)."""
    api_url = os.getenv("API_URL", "http://localhost:8000")
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(f"{api_url}/api/profiles/discord/{target_discord_id}/username")
            response.raise_for_status()
            data = response.json()
            return data.get("username")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                # User doesn't exist
                raise Exception("USER_NOT_REGISTERED")
            raise
        except (httpx.ConnectTimeout, httpx.ReadTimeout) as e:
            # Connection timeout - use the error handler utility
            raise Exception("CONNECTION_TIMEOUT")
        except httpx.RequestError as e:
            # Other connection errors
            error_msg = str(e) if str(e) else "Connection error"
            raise Exception(f"CONNECTION_ERROR: {error_msg}")


async def get_public_profile(username: str):
    """Get public profile for a user (unauthenticated request)."""
    api_url = os.getenv("API_URL", "http://localhost:8000")
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # URL encode the username in case it has special characters
            import urllib.parse
            encoded_username = urllib.parse.quote(username, safe='')
            response = await client.get(f"{api_url}/api/profiles/{encoded_username}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                # Better error message
                raise Exception("USER_NOT_FOUND")
            raise
        except httpx.RequestError as e:
            raise Exception(f"Failed to fetch profile: {str(e)}")


async def handle_sankey_command(discord_id: str, username: str, target_username: str = None, target_discord_id: str = None) -> discord.Embed:
    """Handle sankey command. Returns embed with link to public analytics page.
    
    Args:
        discord_id: Discord ID of the user making the request
        username: Discord username of the user making the request
        target_username: Optional username to view Sankey diagram of another user
        target_discord_id: Optional Discord ID if target is a mention
    """
    try:
        # If viewing another user's Sankey
        if target_username or target_discord_id:
            # If we have a Discord ID (from mention), check if they exist and get their username
            if target_discord_id:
                try:
                    target_username = await get_username_from_discord_id(target_discord_id)
                except Exception as e:
                    error_str = str(e)
                    if error_str == "USER_NOT_REGISTERED":
                        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
                        register_url = f"{frontend_url}/register"
                        return create_error_embed(
                            "User Not Registered",
                            f"This user has not registered yet. They need to use a bot command (like `p!add`) OR [register on the website]({register_url}) to create an account and submit a process first."
                        )
                    elif error_str.startswith("CONNECTION_TIMEOUT") or error_str.startswith("CONNECTION_ERROR"):
                        return handle_command_error(e, "checking user")
                    raise
            
            # Get public profile to check if user is anonymous
            try:
                profile = await get_public_profile(target_username)
            except Exception as e:
                if str(e) == "USER_NOT_FOUND":
                    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
                    register_url = f"{frontend_url}/register"
                    return create_error_embed(
                        "User Not Found",
                        f"This user either has not registered or has not submitted any processes yet. They need to use a bot command (like `p!add`) OR [register on the website]({register_url}) to create an account and add processes."
                    )
                raise
            
            # Check if user is anonymous
            if profile.get("is_anonymous", False):
                return create_error_embed(
                    "User is Anonymous",
                    "This user has anonymous mode enabled and their Sankey diagram is not publicly visible."
                )
            
            # Use target username for analytics
            user_username = target_username
            display_name = profile.get("display_name") or target_username
        else:
            # Viewing own Sankey
            token = await get_user_token(discord_id, username)
            
            # Get user info to get their username
            user_info = await api_request("GET", "/auth/me", token)
            user_username = user_info.get("username")
            display_name = user_info.get("display_name") or user_username or username
            
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
                    if target_username or target_discord_id:
                        return create_error_embed(
                            "No Public Processes",
                            f"{display_name} doesn't have any public processes yet."
                        )
                    else:
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
                    if target_username or target_discord_id:
                        return create_error_embed(
                            "No Public Processes",
                            f"{display_name} doesn't have any public processes yet."
                        )
                    else:
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
                title = f"📊 Sankey Diagram - {display_name}" if target_username or target_discord_id else "📊 Sankey Diagram"
                embed = discord.Embed(
                    title=title,
                    description=f"Stage flow visualization for {len(analytics_data['processes'])} public process{'es' if len(analytics_data['processes']) != 1 else ''}\n\n[View Sankey Diagram]({sankey_url})",
                    color=0x5865F2,
                    url=sankey_url
                )
                embed.set_image(url=image_url)
                embed.timestamp = discord.utils.utcnow()
                
                return embed
                
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                if target_username or target_discord_id:
                    return create_error_embed(
                        "No Public Processes",
                        f"{display_name} doesn't have any public processes yet."
                    )
                else:
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
    @bot.tree.command(name="sankey", description="Generate a Sankey diagram of your public processes or another user's")
    @app_commands.describe(user="Optional: User to view Sankey diagram of")
    async def sankey_slash(interaction: discord.Interaction, user: discord.User = None):
        """Sankey command: /sankey [user]"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        target_username = None
        target_discord_id = None
        
        # Handle user mention
        if user:
            target_discord_id = str(user.id)
            # Don't use user.name as username - we'll get it from the API
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="sankey",
            user_id=discord_id,
            username=username,
        )
        
        await interaction.response.defer()
        embed = await handle_sankey_command(discord_id, username, target_username, target_discord_id)
        await interaction.followup.send(embed=embed)
    
    # Prefix command
    @bot.command(name="sankey")
    async def sankey_prefix(ctx: commands.Context, *, args: str = ""):
        """Sankey command: p!sankey [@user or username]"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        target_username = None
        target_discord_id = None
        
        # Parse arguments
        if args.strip():
            # Check if it's a mention
            if ctx.message.mentions:
                # Use the first mention
                target_discord_id = str(ctx.message.mentions[0].id)
            else:
                # Treat as username
                target_username = args.strip()
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="sankey",
            user_id=discord_id,
            username=username,
        )
        
        embed = await handle_sankey_command(discord_id, username, target_username, target_discord_id)
        await ctx.send(embed=embed)

