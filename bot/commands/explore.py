"""Explore command handler - browse public processes with filtering and pagination."""
import discord
from discord import app_commands
from discord.ext import commands
from discord.ui import Button, View
import os
from typing import Optional
from datetime import datetime

from utils.auth import get_api_url, get_frontend_url
from utils.embeds import create_info_embed, create_error_embed, create_usage_embed
from utils.errors import handle_command_error
from utils.logging import log_command
import httpx

PREFIX = os.getenv("PREFIX", "p!")


async def fetch_explore_processes(
    search: Optional[str] = None,
    company: Optional[str] = None,
    stage: Optional[str] = None,
    position: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 10
) -> dict:
    """Fetch explore processes from API."""
    api_url = get_api_url()
    params = {
        "page": page,
        "limit": limit
    }
    if search:
        params["search"] = search
    if company:
        params["company"] = company
    if stage:
        params["stage"] = stage
    if position:
        params["position"] = position
    if status:
        params["status"] = status
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(f"{api_url}/api/explore/processes", params=params)
        response.raise_for_status()
        return response.json()


def format_process_for_embed(process: dict, index: int, total: int) -> str:
    """Format a single process for display in embed."""
    company = process.get("company_name", "Unknown")
    position = process.get("position")
    status = process.get("status", "active")
    stages = process.get("stages", [])
    user_display = process.get("user_display_name") or process.get("user_username") or "Anonymous"
    
    # Status emoji
    status_emoji = {
        "active": "🟢",
        "completed": "✅",
        "rejected": "❌"
    }.get(status, "⚪")
    
    # Build process line
    line = f"**{index + 1}. {status_emoji} {company}**"
    if position:
        line += f" - {position}"
    line += f"\n   👤 {user_display}"
    
    # Add stage count
    if stages:
        stage_names = [s.get("stage_name") for s in stages[:3]]
        stage_text = ", ".join(stage_names)
        if len(stages) > 3:
            stage_text += f" (+{len(stages) - 3} more)"
        line += f" | 📋 {stage_text}"
    
    return line


def create_explore_embed(
    processes: list,
    page: int,
    total_pages: int,
    total: int,
    filters: dict,
    frontend_url: str
) -> discord.Embed:
    """Create embed for explore results."""
    # Build title with filters
    title_parts = ["🔍 Explore Processes"]
    if filters.get("search"):
        title_parts.append(f"Search: {filters['search']}")
    if filters.get("company"):
        title_parts.append(f"Company: {filters['company']}")
    if filters.get("stage"):
        title_parts.append(f"Stage: {filters['stage']}")
    if filters.get("position"):
        title_parts.append(f"Position: {filters['position']}")
    if filters.get("status"):
        title_parts.append(f"Status: {filters['status']}")
    
    embed = discord.Embed(
        title=" | ".join(title_parts) if len(title_parts) > 1 else title_parts[0],
        color=0x4f46e5,
        timestamp=discord.utils.utcnow()
    )
    
    if not processes:
        embed.description = "No processes found matching your filters."
        embed.add_field(
            name="💡 Tip",
            value=f"Try adjusting your filters or [view all processes on the web]({frontend_url}/explore)",
            inline=False
        )
    else:
        # Format processes
        process_lines = []
        for i, process in enumerate(processes):
            process_lines.append(format_process_for_embed(process, i, len(processes)))
        
        embed.description = "\n\n".join(process_lines)
        
        # Add pagination info
        embed.set_footer(
            text=f"Page {page}/{total_pages} • {total} total processes • Use buttons to navigate"
        )
    
    # Add web link
    explore_url = f"{frontend_url}/explore"
    embed.add_field(
        name="🌐 View on Web",
        value=f"[Open Explore Page]({explore_url})",
        inline=False
    )
    
    return embed


class ExplorePaginationView(View):
    """View with pagination buttons for explore command."""
    def __init__(
        self,
        search: Optional[str],
        company: Optional[str],
        stage: Optional[str],
        position: Optional[str],
        status: Optional[str],
        current_page: int,
        total_pages: int,
        frontend_url: str,
        timeout: float = 300.0
    ):
        super().__init__(timeout=timeout)
        self.search = search
        self.company = company
        self.stage = stage
        self.position = position
        self.status = status
        self.current_page = current_page
        self.total_pages = total_pages
        self.frontend_url = frontend_url
        
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
            disabled=self.current_page <= 1
        )
        prev_button.callback = self.previous_page
        self.add_item(prev_button)
        
        # Page info button (non-clickable, shows current page)
        page_button = Button(
            label=f"Page {self.current_page}/{self.total_pages}",
            style=discord.ButtonStyle.secondary,
            disabled=True
        )
        self.add_item(page_button)
        
        # Next button
        next_button = Button(
            label="Next ▶",
            style=discord.ButtonStyle.primary,
            disabled=self.current_page >= self.total_pages
        )
        next_button.callback = self.next_page
        self.add_item(next_button)
        
        # Web link button
        web_button = Button(
            label="🌐 View on Web",
            style=discord.ButtonStyle.link,
            url=f"{self.frontend_url}/explore"
        )
        self.add_item(web_button)
    
    async def previous_page(self, interaction: discord.Interaction):
        """Handle previous page button click."""
        if self.current_page > 1:
            self.current_page -= 1
            await self.refresh_page(interaction)
    
    async def next_page(self, interaction: discord.Interaction):
        """Handle next page button click."""
        if self.current_page < self.total_pages:
            self.current_page += 1
            await self.refresh_page(interaction)
    
    async def refresh_page(self, interaction: discord.Interaction):
        """Refresh the embed with new page data."""
        try:
            data = await fetch_explore_processes(
                search=self.search,
                company=self.company,
                stage=self.stage,
                position=self.position,
                status=self.status,
                page=self.current_page,
                limit=10
            )
            
            processes = data.get("processes", [])
            total_pages = data.get("total_pages", 1)
            total = data.get("total", 0)
            
            # Update total pages if it changed
            self.total_pages = total_pages
            self.update_buttons()
            
            filters = {
                "search": self.search,
                "company": self.company,
                "stage": self.stage,
                "position": self.position,
                "status": self.status
            }
            
            embed = create_explore_embed(
                processes, self.current_page, total_pages, total, filters, self.frontend_url
            )
            
            await interaction.response.edit_message(embed=embed, view=self)
        except Exception as e:
            error_embed = handle_command_error(e, "fetching explore results")
            await interaction.response.edit_message(embed=error_embed, view=None)


async def handle_explore_command(
    search: Optional[str] = None,
    company: Optional[str] = None,
    stage: Optional[str] = None,
    position: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1
) -> tuple[discord.Embed, View]:
    """Handle explore command with filters and pagination."""
    try:
        data = await fetch_explore_processes(
            search=search,
            company=company,
            stage=stage,
            position=position,
            status=status,
            page=page,
            limit=10
        )
        
        processes = data.get("processes", [])
        total_pages = data.get("total_pages", 1)
        total = data.get("total", 0)
        
        frontend_url = get_frontend_url()
        filters = {
            "search": search,
            "company": company,
            "stage": stage,
            "position": position,
            "status": status
        }
        
        embed = create_explore_embed(
            processes, page, total_pages, total, filters, frontend_url
        )
        
        view = ExplorePaginationView(
            search=search,
            company=company,
            stage=stage,
            position=position,
            status=status,
            current_page=page,
            total_pages=total_pages,
            frontend_url=frontend_url
        )
        
        return embed, view
    except Exception as e:
        error_embed = handle_command_error(e, "fetching explore results")
        return error_embed, None


def setup_explore_command(bot: commands.Bot):
    """Setup explore command (both slash and prefix)."""
    PREFIX = os.getenv("PREFIX", "p!")
    
    # Slash command
    @bot.tree.command(name="explore", description="Browse public job application processes with filtering and pagination")
    @app_commands.describe(
        search="Search across company, position, or stage names",
        company="Filter by company name",
        stage="Filter by stage name",
        position="Filter by position/title",
        status="Filter by status (active, completed, rejected)",
        page="Page number (default: 1)"
    )
    async def explore_command(
        interaction: discord.Interaction,
        search: Optional[str] = None,
        company: Optional[str] = None,
        stage: Optional[str] = None,
        position: Optional[str] = None,
        status: Optional[str] = None,
        page: int = 1
    ):
        """Explore: /explore [filters]"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="explore",
            user_id=discord_id,
            username=username,
            parsed_args={
                "search": search,
                "company": company,
                "stage": stage,
                "position": position,
                "status": status,
                "page": page
            }
        )
        
        # Check command restrictions
        from utils.restrictions import check_command_restrictions, record_command_use
        guild_id = str(interaction.guild.id) if interaction.guild else None
        channel_id = interaction.channel.id if interaction.channel else 0
        
        is_allowed, error_embed = await check_command_restrictions(
            guild_id, discord_id, channel_id, "explore", interaction=interaction
        )
        
        if not is_allowed:
            if error_embed:
                await interaction.response.send_message(embed=error_embed, ephemeral=True)
            else:
                await interaction.response.send_message("Command not available in this channel.", ephemeral=True)
            return
        
        await interaction.response.defer()
        
        embed, view = await handle_explore_command(
            search=search,
            company=company,
            stage=stage,
            position=position,
            status=status,
            page=page
        )
        
        await interaction.followup.send(embed=embed, view=view)
        
        # Record command use for cooldown
        record_command_use(guild_id, discord_id, "explore")
    
    # Prefix command
    @bot.command(name="explore")
    async def explore_command_prefix(ctx: commands.Context, *, args: str = None):
        """Explore: p!explore [filters]"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        # Check command restrictions
        from utils.restrictions import check_command_restrictions, record_command_use
        guild_id = str(ctx.guild.id) if ctx.guild else None
        channel_id = ctx.channel.id if ctx.channel else 0
        
        is_allowed, error_embed = await check_command_restrictions(
            guild_id, discord_id, channel_id, "explore", ctx=ctx
        )
        
        if not is_allowed:
            if error_embed:
                await ctx.send(embed=error_embed)
            return
        
        # Parse arguments
        search = None
        company = None
        stage = None
        position = None
        status = None
        page = 1
        
        if not args:
            # Show usage if no args
            usage_examples = (
                f"• `{PREFIX}explore` - Show all processes\n"
                f"• `{PREFIX}explore search:Google` - Search for Google\n"
                f"• `{PREFIX}explore company:Google stage:OA` - Filter by company and stage\n"
                f"• `{PREFIX}explore status:active page:2` - Filter by status, page 2\n"
                f"• `{PREFIX}explore position:SWE` - Filter by position"
            )
            embed = create_usage_embed(
                f"Usage: `{PREFIX}explore [filters]`",
                examples=usage_examples,
                fields=[{
                    "name": "Available Filters",
                    "value": "`search:`, `company:`, `stage:`, `position:`, `status:`, `page:`",
                    "inline": False
                }]
            )
            await ctx.send(embed=embed)
            return
        
        # Parse filters from args
        # Format: p!explore search:google company:Google stage:OA page:2
        # Or: p!explore Google (treats as search)
        parts = args.split()
        for part in parts:
            if ':' in part:
                key, value = part.split(':', 1)
                key_lower = key.lower()
                if key_lower == 'search':
                    search = value
                elif key_lower == 'company':
                    company = value
                elif key_lower == 'stage':
                    stage = value
                elif key_lower == 'position':
                    position = value
                elif key_lower == 'status':
                    status = value.lower()  # Normalize status
                elif key_lower == 'page':
                    try:
                        page = int(value)
                        if page < 1:
                            page = 1
                    except ValueError:
                        pass
            else:
                # If no colon, treat as search term (only if no search already set)
                if not search:
                    search = part
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="explore",
            user_id=discord_id,
            username=username,
            raw_args=args,
            parsed_args={
                "search": search,
                "company": company,
                "stage": stage,
                "position": position,
                "status": status,
                "page": page
            }
        )
        
        embed, view = await handle_explore_command(
            search=search,
            company=company,
            stage=stage,
            position=position,
            status=status,
            page=page
        )
        
        await ctx.send(embed=embed, view=view)
        
        # Record command use for cooldown
        record_command_use(guild_id, discord_id, "explore")
