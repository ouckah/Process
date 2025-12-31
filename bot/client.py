import discord
from discord import app_commands
from discord.ext import commands
from discord.ui import View, Button
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
if not DISCORD_TOKEN:
    raise ValueError("DISCORD_TOKEN environment variable is not set")

# API URL - use Railway private networking to avoid egress fees
API_URL = os.getenv("API_URL", "http://localhost:8000")

intents = discord.Intents.default()
intents.message_content = True

PREFIX = os.getenv("PREFIX", "p!")
bot = commands.Bot(command_prefix=PREFIX, intents=intents)

# Valid stage names matching the web app dropdown
VALID_STAGE_NAMES = [
    'OA',
    'Phone Screen',
    'Technical Interview',
    'HM Interview',
    'Final Interview',
    'On-site Interview',
    'Take-home Assignment',
    'System Design',
    'Behavioral Interview',
    'Coding Challenge',
    'Reject',
    'Offer',
    'Other',  # Custom stages are allowed but should be handled differently
]


async def get_user_token(discord_id: str, username: str) -> str:
    """Get authentication token for Discord user via API."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_URL}/auth/discord/bot-token",
            json={"discord_id": discord_id, "username": username}
        )
        response.raise_for_status()
        return response.json()["access_token"]


async def api_request(method: str, endpoint: str, token: str, **kwargs):
    """Make authenticated API request."""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.request(method, f"{API_URL}{endpoint}", headers=headers, **kwargs)
        response.raise_for_status()
        return response.json()


# Helper functions for command logic (shared by slash and prefix commands)
async def handle_add_process(discord_id: str, username: str, company_name: str, stage_name: str, position: str = None) -> discord.Embed:
    """Handle adding a process. Returns success/error message."""
    try:
        token = await get_user_token(discord_id, username)
        
        # Check if process already exists (same company name and position)
        processes = await api_request("GET", "/api/processes/", token)
        existing = next((p for p in processes 
                        if p["company_name"].lower() == company_name.lower() 
                        and (p.get("position") or None) == (position or None)), None)
        
        if existing:
            pos_text = f" ({position})" if position else ""
            embed = discord.Embed(
                title="❌ Process Already Exists",
                description=f"Process for **{company_name}**{pos_text} already exists.",
                color=0xFF0000  # Red
            )
            embed.add_field(name="Next Steps", value=f"Use `{PREFIX}list` or `/list` to see all processes.", inline=False)
            return embed
        
        # Create process
        process = await api_request("POST", "/api/processes/", token, json={
            "company_name": company_name,
            "position": position if position else None
        })
        
        # Add initial stage
        from datetime import date
        await api_request("POST", "/api/stages/", token, json={
            "process_id": process["id"],
            "stage_name": stage_name,
            "stage_date": date.today().isoformat(),
            "order": 1
        })
        
        pos_text = f" ({position})" if position else ""
        embed = discord.Embed(
            title="✅ Process Created",
            description=f"Created process for **{company_name}**{pos_text} with stage **{stage_name}**",
            color=0x00FF00  # Green
        )
        embed.timestamp = discord.utils.utcnow()
        return embed
    except httpx.HTTPStatusError as e:
        error_msg = e.response.json().get("detail", str(e)) if e.response.content else str(e)
        embed = discord.Embed(
            title="❌ Error",
            description=error_msg,
            color=0xFF0000  # Red
        )
        return embed
    except Exception as e:
        print(f"Error adding process: {e}")
        embed = discord.Embed(
            title="❌ Error",
            description=f"Error creating process: {str(e)}",
            color=0xFF0000  # Red
        )
        return embed


async def handle_delete_process(discord_id: str, username: str, company_name: str, position: str = None) -> discord.Embed:
    """Handle deleting a process. Returns success/error message."""
    try:
        token = await get_user_token(discord_id, username)
        
        # Find process by company name and position
        processes = await api_request("GET", "/api/processes/", token)
        matching = [p for p in processes 
                   if p["company_name"].lower() == company_name.lower()]
        
        # Filter by position if provided
        if position:
            matching = [p for p in matching if (p.get("position") or None) == position]
        else:
            # If no position specified, prefer processes with no position
            # If none exist, take the first match
            no_position = [p for p in matching if not p.get("position")]
            matching = no_position if no_position else matching
        
        if not matching:
            pos_text = f" ({position})" if position else ""
            embed = discord.Embed(
                title="❌ Process Not Found",
                description=f"Process for **{company_name}**{pos_text} not found.",
                color=0xFF0000  # Red
            )
            embed.add_field(name="Next Steps", value=f"Use `{PREFIX}list` or `/list` to see all processes.", inline=False)
            return embed
        
        # If multiple matches and no position specified, return error
        if len(matching) > 1 and not position:
            embed = discord.Embed(
                title="❌ Multiple Processes Found",
                description=f"Multiple processes found for **{company_name}**.",
                color=0xFF0000  # Red
            )
            embed.add_field(
                name="Solution",
                value=f"Please specify position: `{PREFIX}delete <company_name> <position>` or `/delete <company_name> <position>`",
                inline=False
            )
            return embed
        
        process = matching[0]
        # Delete process
        await api_request("DELETE", f"/api/processes/{process['id']}", token)
        
        pos_text = f" ({position})" if position else ""
        embed = discord.Embed(
            title="✅ Process Deleted",
            description=f"Deleted process for **{company_name}**{pos_text}",
            color=0x00FF00  # Green
        )
        embed.timestamp = discord.utils.utcnow()
        return embed
    except httpx.HTTPStatusError as e:
        error_msg = e.response.json().get("detail", str(e)) if e.response.content else str(e)
        embed = discord.Embed(
            title="❌ Error",
            description=error_msg,
            color=0xFF0000  # Red
        )
        return embed
    except Exception as e:
        print(f"Error deleting process: {e}")
        embed = discord.Embed(
            title="❌ Error",
            description=f"Error deleting process: {str(e)}",
            color=0xFF0000  # Red
        )
        return embed


async def handle_list_processes(discord_id: str, username: str) -> tuple[list[discord.Embed], int]:
    """Handle listing processes. Returns list of embeds and total page count."""
    try:
        token = await get_user_token(discord_id, username)
        
        # Get all processes
        processes = await api_request("GET", "/api/processes/", token)
        
        if not processes:
            embed = discord.Embed(
                title="📋 Your Processes",
                description=f"You don't have any processes yet. Use `{PREFIX}add <company> <stage>` or `/add <company> <stage>` to create one!",
                color=0x808080  # Gray
            )
            return [embed], 1
        
        # Get details for all processes
        process_details = []
        for p in processes:
            try:
                detail = await api_request("GET", f"/api/processes/{p['id']}/detail", token)
                process_details.append(detail)
            except:
                process_details.append(p)
        
        # Create embeds with pagination (max 25 fields per embed, Discord limit)
        embeds = []
        items_per_page = 10  # Reasonable number per page
        total_pages = (len(process_details) + items_per_page - 1) // items_per_page
        
        for page in range(total_pages):
            start_idx = page * items_per_page
            end_idx = min(start_idx + items_per_page, len(process_details))
            page_processes = process_details[start_idx:end_idx]
            
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
                title=f"📋 Your Processes ({len(process_details)})",
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
    except httpx.HTTPStatusError as e:
        error_msg = e.response.json().get("detail", str(e)) if e.response.content else str(e)
        error_embed = discord.Embed(
            title="❌ Error",
            description=error_msg,
            color=0xFF0000  # Red
        )
        return [error_embed], 1
    except Exception as e:
        print(f"Error listing processes: {e}")
        error_embed = discord.Embed(
            title="❌ Error",
            description=f"Error listing processes: {str(e)}",
            color=0xFF0000  # Red
        )
        return [error_embed], 1


@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}')
    try:
        synced = await bot.tree.sync()
        print(f'Synced {len(synced)} command(s)')
    except Exception as e:
        print(f'Failed to sync commands: {e}')


# Autocomplete function must be defined before the command that uses it
async def stage_name_autocomplete(interaction: discord.Interaction, current: str):
    """Autocomplete for stage names."""
    choices = [
        app_commands.Choice(name=name, value=name)
        for name in VALID_STAGE_NAMES
        if name != 'Other' and current.lower() in name.lower()
    ]
    # If no matches, show all valid names (except Other)
    if not choices:
        choices = [
            app_commands.Choice(name=name, value=name)
            for name in VALID_STAGE_NAMES
            if name != 'Other'
        ]
    # Limit to 25 choices (Discord limit)
    return choices[:25]


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


@bot.tree.command(name="add", description="Add a new process with an initial stage")
@app_commands.describe(
    company_name="The company name (e.g., Google, Microsoft)",
    stage_name="The initial stage name (e.g., OA, Phone Screen, Reject)",
    position="The job position/title (optional, e.g., Software Engineer)"
)
@app_commands.autocomplete(stage_name=stage_name_autocomplete)
async def add_process(interaction: discord.Interaction, company_name: str, stage_name: str, position: str = None):
    """Add a new process: /add <company_name> <stage_name> [position]"""
    await interaction.response.defer()
    
    discord_id = str(interaction.user.id)
    username = interaction.user.name
    embed = await handle_add_process(discord_id, username, company_name, stage_name, position)
    await interaction.followup.send(embed=embed)


@bot.tree.command(name="delete", description="Delete a process by company name")
@app_commands.describe(
    company_name="The company name to delete",
    position="The job position/title (optional, required if multiple processes exist)"
)
async def delete_process_cmd(interaction: discord.Interaction, company_name: str, position: str = None):
    """Delete a process: /delete <company_name> [position]"""
    await interaction.response.defer()
    
    discord_id = str(interaction.user.id)
    username = interaction.user.name
    embed = await handle_delete_process(discord_id, username, company_name, position)
    await interaction.followup.send(embed=embed)


@bot.tree.command(name="list", description="List all your processes")
async def list_processes(interaction: discord.Interaction):
    """List all processes: /list"""
    await interaction.response.defer()
    
    discord_id = str(interaction.user.id)
    username = interaction.user.name
    embeds, total_pages = await handle_list_processes(discord_id, username)
    
    if total_pages > 1:
        # Send first page and add pagination buttons
        view = ProcessListView(embeds, total_pages)
        await interaction.followup.send(embed=embeds[0], view=view)
    else:
        await interaction.followup.send(embed=embeds[0])


# Prefix commands
@bot.command(name="add")
async def add_process_prefix(ctx: commands.Context, *, args: str = None):
    """Add a new process: p!add <company_name> <stage_name> [position]"""
    if not args:
        valid_names = ', '.join([f"`{name}`" for name in VALID_STAGE_NAMES if name != 'Other'])
        await ctx.send(f"❌ Usage: `{PREFIX}add <company_name> <stage_name> [position]`\nExamples:\n- `{PREFIX}add Google OA`\n- `{PREFIX}add Google Technical Interview`\n- `{PREFIX}add Google OA Software Engineer`\n\nValid stage names: {valid_names}")
        return
    
    # Parse: split by spaces, then match stage name from VALID_STAGE_NAMES
    parts = args.split()
    if len(parts) < 2:
        valid_names = ', '.join([f"`{name}`" for name in VALID_STAGE_NAMES if name != 'Other'])
        await ctx.send(f"❌ Usage: `{PREFIX}add <company_name> <stage_name> [position]`\nValid stage names: {valid_names}")
        return
    
    company_name = parts[0]
    remaining = parts[1:]
    
    # Try to match stage name from VALID_STAGE_NAMES (check progressively longer combinations)
    stage_name = None
    stage_end_idx = None
    
    # Check from longest to shortest to match multi-word stage names first
    for length in range(len(remaining), 0, -1):
        potential_stage = ' '.join(remaining[:length])
        if potential_stage in VALID_STAGE_NAMES:
            stage_name = potential_stage
            stage_end_idx = length
            break
    
    if not stage_name:
        valid_names = ', '.join([f"`{name}`" for name in VALID_STAGE_NAMES if name != 'Other'])
        embed = discord.Embed(
            title="❌ Invalid Stage Name",
            description="The stage name you provided doesn't match any valid stage names.",
            color=0xFF0000  # Red
        )
        embed.add_field(name="Valid Stage Names", value=valid_names, inline=False)
        embed.add_field(name="Note", value="Custom stages (Other) are not supported via bot commands.", inline=False)
        await ctx.send(embed=embed)
        return
    
    # Everything after the matched stage name becomes position
    position = ' '.join(remaining[stage_end_idx:]) if stage_end_idx < len(remaining) else None
    position = position if position else None  # Convert empty string to None
    
    discord_id = str(ctx.author.id)
    username = ctx.author.name
    embed = await handle_add_process(discord_id, username, company_name, stage_name, position)
    await ctx.send(embed=embed)


@bot.command(name="delete")
async def delete_process_prefix(ctx: commands.Context, *, args: str = None):
    """Delete a process: p!delete <company_name> ["position"]"""
    if not args:
        embed = discord.Embed(
            title="❌ Usage Error",
            description=f"Usage: `{PREFIX}delete <company_name> [position]`",
            color=0xFF9900  # Orange
        )
        embed.add_field(name="Examples", value=f"• `{PREFIX}delete Google`\n• `{PREFIX}delete Google Software Engineer`", inline=False)
        await ctx.send(embed=embed)
        return
    
    # Parse: split by spaces
    parts = args.split()
    if len(parts) < 1:
        embed = discord.Embed(
            title="❌ Usage Error",
            description=f"Usage: `{PREFIX}delete <company_name> [position]`",
            color=0xFF9900  # Orange
        )
        await ctx.send(embed=embed)
        return
    
    company_name = parts[0]
    position = ' '.join(parts[1:]) if len(parts) > 1 else None
    position = position if position else None  # Convert empty string to None
    
    discord_id = str(ctx.author.id)
    username = ctx.author.name
    embed = await handle_delete_process(discord_id, username, company_name, position)
    await ctx.send(embed=embed)


@bot.command(name="list")
async def list_processes_prefix(ctx: commands.Context):
    """List all processes: p!list"""
    discord_id = str(ctx.author.id)
    username = ctx.author.name
    embeds, total_pages = await handle_list_processes(discord_id, username)
    
    if total_pages > 1:
        # Send first page and add pagination buttons
        view = ProcessListView(embeds, total_pages)
        await ctx.send(embed=embeds[0], view=view)
    else:
        await ctx.send(embed=embeds[0])


bot.run(DISCORD_TOKEN)