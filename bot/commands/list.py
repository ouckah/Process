"""List processes command handler."""
import discord
from discord import app_commands
from discord.ext import commands
from discord.ui import View, Button
import httpx

from utils.auth import get_user_token, api_request, API_URL
from utils.embeds import create_info_embed, create_error_embed
from utils.errors import handle_command_error
from utils.logging import log_command
import os
from dotenv import load_dotenv

load_dotenv()
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


async def get_public_profile(username: str):
    """Get public profile for a user (unauthenticated request)."""
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            # URL encode the username in case it has special characters
            import urllib.parse
            encoded_username = urllib.parse.quote(username, safe='')
            response = await client.get(f"{API_URL}/api/profiles/{encoded_username}")
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise Exception(f"User '{username}' not found")
            raise
        except httpx.RequestError as e:
            raise Exception(f"Failed to fetch profile: {str(e)}")


async def handle_list_processes(discord_id: str, username: str, target_username: str = None) -> tuple[list[discord.Embed], int]:
    """Handle listing processes. Returns list of embeds and total page count.
    
    Args:
        discord_id: Discord ID of the user making the request
        username: Discord username of the user making the request
        target_username: Optional username to view public processes of another user
    """
    try:
        # If viewing another user's profile
        if target_username:
            # Get public profile (no authentication required)
            profile = await get_public_profile(target_username)
            
            # Check if user is anonymous
            if profile.get("is_anonymous", False):
                embed = create_error_embed(
                    "User is Anonymous",
                    f"The user '{target_username}' has anonymous mode enabled and their processes are not publicly visible."
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
                        async with httpx.AsyncClient(timeout=10.0) as client:
                            detail_response = await client.get(f"{API_URL}/api/processes/share/{p['share_id']}")
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
        else:
            # Viewing own processes
            token = await get_user_token(discord_id, username)
            
            # Get all processes
            processes = await api_request("GET", "/api/processes/", token)
            
            if not processes:
                embed = create_info_embed(
                    "📋 Your Processes",
                    f"You don't have any processes yet. Use `{PREFIX}add <company> <stage>` or `/add <company> <stage>` to create one!"
                )
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
            
            if total_pages > 1:
                embed.set_footer(text=f"Page {page + 1} of {total_pages}")
            
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
    @app_commands.describe(username="Optional: Username to view public processes of another user")
    async def list_processes(interaction: discord.Interaction, username: str = None):
        """List all processes: /list [username]"""
        discord_id = str(interaction.user.id)
        user_username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="list",
            user_id=discord_id,
            username=user_username,
            parsed_args={"target_username": username} if username else None
        )
        
        await interaction.response.defer()
        embeds, total_pages = await handle_list_processes(discord_id, user_username, target_username=username)
        
        if total_pages > 1:
            # Send first page and add pagination buttons
            view = ProcessListView(embeds, total_pages)
            await interaction.followup.send(embed=embeds[0], view=view)
        else:
            await interaction.followup.send(embed=embeds[0])
    
    # Prefix command
    @bot.command(name="list")
    async def list_processes_prefix(ctx: commands.Context, *, target_username: str = None):
        """List all processes: p!list [username]"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="list",
            user_id=discord_id,
            username=username,
            raw_args=target_username if target_username else None,
            parsed_args={"target_username": target_username} if target_username else None
        )
        
        embeds, total_pages = await handle_list_processes(discord_id, username, target_username=target_username)
        
        if total_pages > 1:
            # Send first page and add pagination buttons
            view = ProcessListView(embeds, total_pages)
            await ctx.send(embed=embeds[0], view=view)
        else:
            await ctx.send(embed=embeds[0])

