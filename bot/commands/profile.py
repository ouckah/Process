"""Profile command handler."""
import discord
from discord import app_commands
from discord.ext import commands
import httpx
import os
import urllib.parse

from utils.auth import get_api_url, get_frontend_url
from utils.embeds import create_info_embed, create_error_embed
from utils.errors import handle_command_error
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")


async def get_username_from_discord_id(target_discord_id: str) -> str:
    """Get username from Discord ID by checking if user exists (doesn't create account)."""
    api_url = get_api_url()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(f"{api_url}/api/profiles/discord/{target_discord_id}/username")
            response.raise_for_status()
            data = response.json()
            return data.get("username")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise Exception("USER_NOT_REGISTERED")
            raise
        except httpx.RequestError as e:
            raise Exception(f"CONNECTION_ERROR: {str(e)}")


async def get_public_profile(username: str):
    """Get public profile for a user (unauthenticated request)."""
    api_url = get_api_url()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            encoded_username = urllib.parse.quote(username, safe='')
            response = await client.get(f"{api_url}/api/profiles/{encoded_username}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise Exception("USER_NOT_FOUND")
            raise
        except httpx.RequestError as e:
            raise Exception(f"Failed to fetch profile: {str(e)}")


async def handle_profile_command(discord_id: str, username: str, target_username: str = None, target_discord_id: str = None) -> discord.Embed:
    """Handle profile command. Returns embed with profile information."""
    try:
        frontend_url = get_frontend_url()
        
        # If viewing another user's profile
        if target_username or target_discord_id:
            # If we have a Discord ID (from mention), check if they exist and get their username
            if target_discord_id:
                try:
                    target_username = await get_username_from_discord_id(target_discord_id)
                except Exception as e:
                    error_str = str(e)
                    if error_str == "USER_NOT_REGISTERED":
                        return create_error_embed(
                            "User Not Registered",
                            f"This user has not registered yet. They need to use a bot command (like `{PREFIX}add`) OR register on the website to create an account."
                        )
                    elif error_str.startswith("CONNECTION_ERROR"):
                        return handle_command_error(e, "checking user")
                    raise
            
            # Get public profile
            try:
                profile = await get_public_profile(target_username)
            except Exception as e:
                if str(e) == "USER_NOT_FOUND":
                    return create_error_embed(
                        "User Not Found",
                        f"This user either has not registered or has not submitted any processes yet."
                    )
                raise
            
            # Check if user is anonymous
            if profile.get("is_anonymous", False):
                return create_error_embed(
                    "User is Anonymous",
                    "This user has anonymous mode enabled and their profile is not publicly visible."
                )
            
            display_name = profile.get("display_name") or target_username
            stats = profile.get("stats", {})
            
            # Build profile URL
            encoded_username = urllib.parse.quote(target_username, safe='')
            profile_url = f"{frontend_url}/profile/{encoded_username}"
            og_image_url = f"{frontend_url}/api/og-image/profile/{encoded_username}"
            
            # Create embed with OG image
            embed = discord.Embed(
                title=f"👤 {display_name}'s Profile",
                url=profile_url,
                color=0x4f46e5
            )
            
            # Add OG image
            embed.set_image(url=og_image_url)
            
            # Add stats
            process_count = stats.get("total_public_processes", 0)
            offers = stats.get("offers_received", 0)
            active = stats.get("active_applications", 0)
            rejected = stats.get("rejected", 0)
            success_rate = stats.get("success_rate", 0)
            
            stats_text = f"**Processes:** {process_count}"
            if offers > 0:
                stats_text += f"\n**Offers:** {offers}"
            if active > 0:
                stats_text += f"\n**Active:** {active}"
            if rejected > 0:
                stats_text += f"\n**Rejected:** {rejected}"
            if success_rate > 0:
                stats_text += f"\n**Success Rate:** {success_rate}%"
            
            embed.add_field(name="Stats", value=stats_text, inline=False)
            
            embed.set_footer(text=f"View full profile: {profile_url}")
            embed.timestamp = discord.utils.utcnow()
            
            return embed
        else:
            # Viewing own profile - need authentication
            from utils.auth import get_user_token, api_request
            token = await get_user_token(discord_id, username)
            
            # Get user info
            user_info = await api_request("GET", "/auth/me", token)
            profile_username = user_info.get("username")
            
            if not profile_username:
                return create_error_embed(
                    "Profile Not Available",
                    "Your profile is not available. Please make sure you have a username set."
                )
            
            # Get public profile for own user (to get stats)
            try:
                profile = await get_public_profile(profile_username)
                display_name = profile.get("display_name") or profile_username
                stats = profile.get("stats", {})
            except Exception:
                # If profile doesn't exist yet, still show basic info
                display_name = user_info.get("display_name") or profile_username
                stats = {}
            
            # Build profile URL
            encoded_username = urllib.parse.quote(profile_username, safe='')
            profile_url = f"{frontend_url}/profile/{encoded_username}"
            og_image_url = f"{frontend_url}/api/og-image/profile/{encoded_username}"
            
            # Create embed with OG image
            embed = discord.Embed(
                title=f"👤 {display_name}'s Profile",
                url=profile_url,
                color=0x4f46e5
            )
            
            # Add OG image
            embed.set_image(url=og_image_url)
            
            # Add stats
            process_count = stats.get("total_public_processes", 0)
            offers = stats.get("offers_received", 0)
            active = stats.get("active_applications", 0)
            rejected = stats.get("rejected", 0)
            success_rate = stats.get("success_rate", 0)
            
            stats_text = f"**Processes:** {process_count}"
            if offers > 0:
                stats_text += f"\n**Offers:** {offers}"
            if active > 0:
                stats_text += f"\n**Active:** {active}"
            if rejected > 0:
                stats_text += f"\n**Rejected:** {rejected}"
            if success_rate > 0:
                stats_text += f"\n**Success Rate:** {success_rate}%"
            
            embed.add_field(name="Stats", value=stats_text, inline=False)
            
            embed.set_footer(text=f"View full profile: {profile_url}")
            embed.timestamp = discord.utils.utcnow()
            
            return embed
    except Exception as e:
        return handle_command_error(e, "fetching profile")


def setup_profile_command(bot: commands.Bot):
    """Setup profile command (both slash and prefix)."""
    # Slash command
    @bot.tree.command(name="profile", description="View your profile or someone else's public profile")
    @app_commands.describe(user="Optional: User to view profile of")
    async def profile_command(interaction: discord.Interaction, user: discord.User = None):
        """View profile: /profile [user]"""
        discord_id = str(interaction.user.id)
        user_username = interaction.user.name
        
        target_username = None
        target_discord_id = None
        
        # Handle user mention
        if user:
            target_discord_id = str(user.id)
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="profile",
            user_id=discord_id,
            username=user_username,
            parsed_args={
                "target_username": target_username,
                "target_discord_id": target_discord_id
            } if (target_username or target_discord_id) else None
        )
        
        embed = await handle_profile_command(discord_id, user_username, target_username, target_discord_id)
        await interaction.response.send_message(embed=embed)
    
    # Prefix command
    @bot.command(name="profile")
    async def profile_command_prefix(ctx: commands.Context, *, args: str = None):
        """View profile: p!profile [@mention or username]"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        target_username = None
        target_discord_id = None
        
        # Parse arguments
        if args:
            args = args.strip()
            
            # Check for mentions
            if ctx.message.mentions:
                mentioned_user = ctx.message.mentions[0]
                target_discord_id = str(mentioned_user.id)
            else:
                # Check for mention format
                import re
                mention_pattern = r'<@!?(\d+)>'
                match = re.match(mention_pattern, args)
                if match:
                    target_discord_id = match.group(1)
                else:
                    # Treat as username
                    target_username = args
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="profile",
            user_id=discord_id,
            username=username,
            raw_args=args,
            parsed_args={
                "target_username": target_username,
                "target_discord_id": target_discord_id
            } if (target_username or target_discord_id) else None
        )
        
        embed = await handle_profile_command(discord_id, username, target_username, target_discord_id)
        await ctx.send(embed=embed)
