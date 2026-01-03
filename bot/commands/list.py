"""List processes command handler."""
import discord
from discord import app_commands
from discord.ext import commands
from discord.ui import View, Button
import httpx

from utils.auth import get_user_token, api_request
from utils.embeds import create_info_embed, create_error_embed
from utils.errors import handle_command_error
from utils.logging import log_command
import os

PREFIX = os.getenv("PREFIX", "p!")


class ProcessListView(View):
    """View for paginating through process lists."""
    def __init__(self, embeds: list[discord.Embed], total_pages: int):
        super().__init__(timeout=300)  # 5 minute timeout
        self.embeds = embeds
        self.total_pages = total_pages
        self.current_page = 0
        
        # Update button states
        self.update_buttons()
    
    def update_buttons(self):
        """Update button states based on current page."""
        # Clear existing buttons
        self.clear_items()
        
        # Previous button
        prev_button = Button(
            label="◀ Previous",
            style=discord.ButtonStyle.primary,
            disabled=self.current_page == 0
        )
        prev_button.callback = self.previous_page
        self.add_item(prev_button)
        
        # Page indicator
        page_button = Button(
            label=f"Page {self.current_page + 1}/{self.total_pages}",
            style=discord.ButtonStyle.secondary,
            disabled=True
        )
        self.add_item(page_button)
        
        # Next button
        next_button = Button(
            label="Next ▶",
            style=discord.ButtonStyle.primary,
            disabled=self.current_page >= self.total_pages - 1
        )
        next_button.callback = self.next_page
        self.add_item(next_button)
    
    async def previous_page(self, interaction: discord.Interaction):
        """Go to previous page."""
        if self.current_page > 0:
            self.current_page -= 1
            self.update_buttons()
            await interaction.response.edit_message(embed=self.embeds[self.current_page], view=self)
        else:
            await interaction.response.defer()
    
    async def next_page(self, interaction: discord.Interaction):
        """Go to next page."""
        if self.current_page < self.total_pages - 1:
            self.current_page += 1
            self.update_buttons()
            await interaction.response.edit_message(embed=self.embeds[self.current_page], view=self)
        else:
            await interaction.response.defer()


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


async def handle_list_processes(discord_id: str, username: str, target_username: str = None, target_discord_id: str = None, is_prefix_command: bool = False) -> tuple[list[discord.Embed], int]:
    """Handle listing processes. Returns list of embeds and total page count.
    
    Args:
        discord_id: Discord ID of the user making the request
        username: Discord username of the user making the request
        target_username: Optional username to view public processes of another user
        target_discord_id: Optional Discord ID if target is a mention
    """
    try:
        # Initialize is_viewing_own flag and privacy mode
        is_viewing_own = False
        user_privacy_mode = None  # Will be set when viewing own processes
        
        # If viewing another user's profile
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
                        embed = create_error_embed(
                            "User Not Registered",
                            f"This user has not registered yet. They need to use a bot command (like `p!add`) OR [register on the website]({register_url}) to create an account and submit a process first."
                        )
                        return [embed], 1
                    elif error_str.startswith("CONNECTION_TIMEOUT") or error_str.startswith("CONNECTION_ERROR"):
                        # Let the error handler utility handle connection errors
                        error_embed = handle_command_error(e, "checking user")
                        return [error_embed], 1
                    raise
            
            # Get public profile (no authentication required)
            try:
                profile = await get_public_profile(target_username)
            except Exception as e:
                if str(e) == "USER_NOT_FOUND":
                    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
                    register_url = f"{frontend_url}/register"
                    embed = create_error_embed(
                        "User Not Found",
                        f"This user either has not registered or has not submitted any processes yet. They need to use a bot command (like `p!add`) OR [register on the website]({register_url}) to create an account and add processes."
                    )
                    return [embed], 1
                raise
            
            # Check if user is anonymous
            if profile.get("is_anonymous", False):
                embed = create_error_embed(
                    "User is Anonymous",
                    "This user has anonymous mode enabled and their processes are not publicly visible."
                )
                return [embed], 1
            
            # Get public processes from profile
            process_details = profile.get("processes", [])
            
            if not process_details:
                display_name = profile.get("display_name") or target_username
                embed = create_info_embed(
                    f"📋 {display_name}'s Public Processes",
                    f"{display_name} doesn't have any public processes yet."
                )
                return [embed], 1
            
            # Get full details for each process (need to fetch details to get stages)
            process_details_with_stages = []
            for p in process_details:
                try:
                    # Use unauthenticated request to get process detail via share_id
                    if p.get("share_id"):
                        api_url = os.getenv("API_URL", "http://localhost:8000")
                        async with httpx.AsyncClient(timeout=10.0) as client:
                            detail_response = await client.get(f"{api_url}/api/processes/share/{p['share_id']}")
                            if detail_response.status_code == 200:
                                process_details_with_stages.append(detail_response.json())
                            else:
                                # If share link doesn't work, use basic info
                                process_details_with_stages.append(p)
                    else:
                        process_details_with_stages.append(p)
                except Exception:
                    # If we can't get detail, use the basic process info
                    process_details_with_stages.append(p)
            
            display_name = profile.get("display_name") or target_username
            title_prefix = f"📋 {display_name}'s Public Processes"
            
            # Check if viewing own processes (for adding note about /list command)
            is_viewing_own = target_discord_id == discord_id if target_discord_id else False
        else:
            # Viewing own processes
            token = await get_user_token(discord_id, username)
            
            # Get user info to check privacy mode
            user_info = await api_request("GET", "/auth/me", token)
            privacy_mode = user_info.get("discord_privacy_mode", "private")
            
            # Get all processes
            processes = await api_request("GET", "/api/processes/", token)
            
            if not processes:
                embed = create_info_embed(
                    "📋 Your Processes",
                    f"You don't have any processes yet. Use `{PREFIX}add <company> <stage>` or `/add <company> <stage>` to create one!"
                )
                # Add privacy mode footer even for empty list
                privacy_display = "🔒 Private" if privacy_mode == "private" else "🌐 Public"
                embed.set_footer(text=f"Privacy Mode: {privacy_display} • Change with {PREFIX}privacy <private|public>")
                return [embed], 1
            
            # Get details for all processes
            process_details_with_stages = []
            for p in processes:
                try:
                    detail = await api_request("GET", f"/api/processes/{p['id']}/detail", token)
                    process_details_with_stages.append(detail)
                except Exception:
                    # If we can't get detail, use the basic process info
                    process_details_with_stages.append(p)
            
            title_prefix = "📋 Your Processes"
            # When viewing own processes directly (no target), it's not "viewing own via prefix"
            # Only when target_discord_id == discord_id (tagging themselves) is it "viewing own"
            is_viewing_own = False
            # Store privacy mode for footer (only set when viewing own processes)
            user_privacy_mode = privacy_mode
        
        # Create embeds with pagination (max 25 fields per embed, Discord limit)
        embeds = []
        items_per_page = 10  # Reasonable number per page
        total_pages = (len(process_details_with_stages) + items_per_page - 1) // items_per_page
        
        for page in range(total_pages):
            start_idx = page * items_per_page
            end_idx = min(start_idx + items_per_page, len(process_details_with_stages))
            page_processes = process_details_with_stages[start_idx:end_idx]
            
            # Determine embed color based on overall status
            has_active = any(p.get("status") == "active" for p in page_processes)
            has_rejected = any(p.get("status") == "rejected" for p in page_processes)
            has_completed = any(p.get("status") == "completed" for p in page_processes)
            
            if has_active:
                color = 0x00FF00  # Green
            elif has_completed:
                color = 0x00CED1  # Dark turquoise
            elif has_rejected:
                color = 0xFF0000  # Red
            else:
                color = 0x808080  # Gray
            
            embed = discord.Embed(
                title=f"{title_prefix} ({len(process_details_with_stages)})",
                color=color
            )
            
            for p in page_processes:
                # Get latest stage
                stages = p.get("stages", [])
                latest_stage = sorted(stages, key=lambda s: s.get("order", 0))[-1].get("stage_name", "No stages") if stages else "No stages"
                
                status = p.get("status", "active")
                status_emoji = "🟢" if status == "active" else "🔴" if status == "rejected" else "✅"
                
                position_text = f" ({p.get('position')})" if p.get("position") else ""
                company_text = f"**{p['company_name']}**{position_text}"
                
                # Format stage count
                stage_count = len(stages)
                stage_text = f"{latest_stage}" + (f" ({stage_count} stage{'s' if stage_count != 1 else ''})" if stage_count > 0 else "")
                
                embed.add_field(
                    name=f"{status_emoji} {company_text}",
                    value=f"{stage_text} • {status.title()}",
                    inline=False
                )
            
            # Add footer with privacy mode info (only for own processes)
            if not target_username and not target_discord_id:
                # Viewing own processes - show privacy mode
                privacy_display = "🔒 Private" if user_privacy_mode == "private" else "🌐 Public"
                if total_pages > 1:
                    footer_text = f"Page {page + 1} of {total_pages} • Privacy: {privacy_display} • Change: {PREFIX}privacy <private|public>"
                else:
                    footer_text = f"Privacy Mode: {privacy_display} • Change with {PREFIX}privacy <private|public>"
                embed.set_footer(text=footer_text)
            elif total_pages > 1:
                embed.set_footer(text=f"Page {page + 1} of {total_pages}")
            
            # Add note for prefix commands viewing own processes
            if is_prefix_command and is_viewing_own and page == 0:
                embed.add_field(
                    name="💡 Tip",
                    value="```diff\n+ To see your private processes too, use /list (slash command) instead!\n```",
                    inline=False
                )
            
            embed.timestamp = discord.utils.utcnow()
            embeds.append(embed)
        
        return embeds, total_pages
    except Exception as e:
        error_embed = handle_command_error(e, "listing processes")
        return [error_embed], 1


def setup_list_command(bot: commands.Bot):
    """Setup list command (both slash and prefix)."""
    # Slash command
    @bot.tree.command(name="list", description="List your processes or view someone else's public processes")
    @app_commands.describe(user="Optional: User to view public processes of")
    async def list_processes(interaction: discord.Interaction, user: discord.User = None):
        """List all processes: /list [user]"""
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
            command_name="list",
            user_id=discord_id,
            username=user_username,
            parsed_args={
                "target_username": target_username,
                "target_discord_id": target_discord_id
            } if (target_username or target_discord_id) else None
        )
        
        # Check if listing own processes (private) or someone else's (public)
        # Private if: no argument (viewing own processes)
        # Public if: has argument (viewing someone's public processes, even if it's themselves)
        is_own_processes = not (target_username or target_discord_id)
        
        await interaction.response.defer(ephemeral=is_own_processes)
        embeds, total_pages = await handle_list_processes(
            discord_id, 
            user_username, 
            target_username=target_username,
            target_discord_id=target_discord_id,
            is_prefix_command=False
        )
        
        if total_pages > 1:
            # Send first page and add pagination buttons
            view = ProcessListView(embeds, total_pages)
            await interaction.followup.send(embed=embeds[0], view=view, ephemeral=is_own_processes)
        else:
            await interaction.followup.send(embed=embeds[0], ephemeral=is_own_processes)
    
    # Prefix command
    @bot.command(name="list")
    async def list_processes_prefix(ctx: commands.Context, *, args: str = None):
        """List all processes: p!list [@mention or username]"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        target_username = None
        target_discord_id = None
        
        # Parse arguments - check for mentions first
        if args:
            args = args.strip()
            
            # Check if there are mentions in the message
            if ctx.message.mentions:
                # Use the first mention
                mentioned_user = ctx.message.mentions[0]
                target_discord_id = str(mentioned_user.id)
            else:
                # Check if it's a mention format like <@123456789> or <@!123456789>
                import re
                mention_pattern = r'<@!?(\d+)>'
                match = re.match(mention_pattern, args)
                if match:
                    target_discord_id = match.group(1)
                else:
                    # Treat as username
                    target_username = args
        else:
            # No argument - treat as if they tagged themselves (show their public processes)
            target_discord_id = discord_id
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="list",
            user_id=discord_id,
            username=username,
            raw_args=args,
            parsed_args={
                "target_username": target_username,
                "target_discord_id": target_discord_id
            } if (target_username or target_discord_id) else None
        )
        
        embeds, total_pages = await handle_list_processes(
            discord_id, 
            username, 
            target_username=target_username,
            target_discord_id=target_discord_id,
            is_prefix_command=True
        )
        
        # Check if listing own processes (private) or someone else's (public)
        # Private if: no argument (viewing own processes)
        # Public if: has argument (viewing someone's public processes, even if it's themselves)
        is_own_processes = not (target_username or target_discord_id)
        
        # For prefix commands, we can't use ephemeral messages, so we send in channel
        # The ephemeral behavior is only available for slash commands
        if total_pages > 1:
            view = ProcessListView(embeds, total_pages)
            await ctx.send(embed=embeds[0], view=view)
        else:
            await ctx.send(embed=embeds[0])

