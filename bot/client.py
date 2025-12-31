import discord
from discord import app_commands
from discord.ext import commands
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
async def handle_add_process(discord_id: str, username: str, company_name: str, stage_name: str, position: str = None) -> str:
    """Handle adding a process. Returns success/error message."""
    try:
        token = await get_user_token(discord_id, username)
        
        # Check if process already exists (same company name and position)
        processes = await api_request("GET", "/api/processes/", token)
        existing = next((p for p in processes 
                        if p["company_name"].lower() == company_name.lower() 
                        and (p.get("position") or None) == (position or None)), None)
        
        if existing:
            pos_text = f" for {position}" if position else ""
            return f"❌ Process for **{company_name}**{pos_text} already exists. Use `{PREFIX}list` or `/list` to see all processes."
        
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
        return f"✅ Created process for **{company_name}**{pos_text} with stage **{stage_name}**"
    except httpx.HTTPStatusError as e:
        error_msg = e.response.json().get("detail", str(e)) if e.response.content else str(e)
        return f"❌ Error: {error_msg}"
    except Exception as e:
        print(f"Error adding process: {e}")
        return f"❌ Error creating process: {str(e)}"


async def handle_delete_process(discord_id: str, username: str, company_name: str, position: str = None) -> str:
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
            return f"❌ Process for **{company_name}**{pos_text} not found. Use `{PREFIX}list` or `/list` to see all processes."
        
        # If multiple matches and no position specified, return error
        if len(matching) > 1 and not position:
            return f"❌ Multiple processes found for **{company_name}**. Please specify position: `{PREFIX}delete <company_name> <position>` or `/delete <company_name> <position>`"
        
        process = matching[0]
        # Delete process
        await api_request("DELETE", f"/api/processes/{process['id']}", token)
        
        pos_text = f" ({position})" if position else ""
        return f"✅ Deleted process for **{company_name}**{pos_text}"
    except httpx.HTTPStatusError as e:
        error_msg = e.response.json().get("detail", str(e)) if e.response.content else str(e)
        return f"❌ Error: {error_msg}"
    except Exception as e:
        print(f"Error deleting process: {e}")
        return f"❌ Error deleting process: {str(e)}"


async def handle_list_processes(discord_id: str, username: str) -> str:
    """Handle listing processes. Returns formatted message."""
    try:
        token = await get_user_token(discord_id, username)
        
        # Get all processes
        processes = await api_request("GET", "/api/processes/", token)
        
        if not processes:
            return f"📋 You don't have any processes yet. Use `{PREFIX}add <company> <stage>` or `/add <company> <stage>` to create one!"
        
        # Format response
        lines = [f"📋 **Your Processes ({len(processes)}):**\n"]
        for p in processes:
            # Get process detail to see stages
            try:
                detail = await api_request("GET", f"/api/processes/{p['id']}/detail", token)
                stages = detail.get("stages", [])
                latest_stage = sorted(stages, key=lambda s: s["order"])[-1]["stage_name"] if stages else "No stages"
            except:
                latest_stage = "No stages"
            
            status = p["status"]
            status_emoji = "🟢" if status == "active" else "🔴" if status == "rejected" else "✅"
            
            position_text = f" ({p.get('position')})" if p.get("position") else ""
            lines.append(f"{status_emoji} **{p['company_name']}**{position_text} - {latest_stage} ({status})")
        
        message = "\n".join(lines)
        # Discord message limit is 2000 characters
        if len(message) > 2000:
            message = message[:1950] + "\n... (truncated)"
        
        return message
    except httpx.HTTPStatusError as e:
        error_msg = e.response.json().get("detail", str(e)) if e.response.content else str(e)
        return f"❌ Error: {error_msg}"
    except Exception as e:
        print(f"Error listing processes: {e}")
        return f"❌ Error listing processes: {str(e)}"


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
    message = await handle_add_process(discord_id, username, company_name, stage_name, position)
    await interaction.followup.send(message)


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
    message = await handle_delete_process(discord_id, username, company_name, position)
    await interaction.followup.send(message)


@bot.tree.command(name="list", description="List all your processes")
async def list_processes(interaction: discord.Interaction):
    """List all processes: /list"""
    await interaction.response.defer()
    
    discord_id = str(interaction.user.id)
    username = interaction.user.name
    message = await handle_list_processes(discord_id, username)
    await interaction.followup.send(message)


# Prefix commands
@bot.command(name="add")
async def add_process_prefix(ctx: commands.Context, *, args: str = None):
    """Add a new process: p!add <company_name> <stage_name> ["position"]"""
    if not args:
        await ctx.send(f"❌ Usage: `{PREFIX}add <company_name> <stage_name> [\"position\"]`\nExamples:\n- `{PREFIX}add Google OA`\n- `{PREFIX}add Google \"Phone Screen\"`\n- `{PREFIX}add Google OA \"Software Engineer\"`\n- `{PREFIX}add Google \"Phone Screen\" \"Software Engineer\"`")
        return
    
    # Parse arguments using shlex to handle quoted strings properly
    import shlex
    try:
        parts = shlex.split(args)
    except ValueError as e:
        # If shlex fails (unmatched quotes), show helpful error
        await ctx.send(f"❌ Invalid quotes in command. Use quotes for multi-word values:\nExample: `{PREFIX}add Google \"Phone Screen\" \"Software Engineer\"`")
        return
    
    if len(parts) < 2:
        await ctx.send(f"❌ Usage: `{PREFIX}add <company_name> <stage_name> [\"position\"]`\nExamples:\n- `{PREFIX}add Google OA`\n- `{PREFIX}add Google \"Phone Screen\"`\n- `{PREFIX}add Google OA \"Software Engineer\"`\n- `{PREFIX}add Google \"Phone Screen\" \"Software Engineer\"`")
        return
    
    company_name = parts[0]
    stage_name = parts[1]
    position = parts[2] if len(parts) > 2 else None
    
    # If there are more than 3 parts, the user might have forgotten quotes
    if len(parts) > 3:
        await ctx.send(f"❌ Too many arguments. Use quotes for multi-word stage names or positions:\nExample: `{PREFIX}add Google \"Phone Screen\" \"Software Engineer\"`")
        return
    
    discord_id = str(ctx.author.id)
    username = ctx.author.name
    message = await handle_add_process(discord_id, username, company_name, stage_name, position)
    await ctx.send(message)


@bot.command(name="delete")
async def delete_process_prefix(ctx: commands.Context, *, args: str = None):
    """Delete a process: p!delete <company_name> ["position"]"""
    if not args:
        await ctx.send(f"❌ Usage: `{PREFIX}delete <company_name> [\"position\"]`\nExamples:\n- `{PREFIX}delete Google`\n- `{PREFIX}delete Google \"Software Engineer\"`")
        return
    
    # Parse arguments using shlex to handle quoted strings properly
    import shlex
    try:
        parts = shlex.split(args)
    except ValueError:
        # If shlex fails (unmatched quotes), show helpful error
        await ctx.send(f"❌ Invalid quotes in command. Use quotes for multi-word positions:\nExample: `{PREFIX}delete Google \"Software Engineer\"`")
        return
    
    if len(parts) < 1:
        await ctx.send(f"❌ Usage: `{PREFIX}delete <company_name> [\"position\"]`\nExamples:\n- `{PREFIX}delete Google`\n- `{PREFIX}delete Google \"Software Engineer\"`")
        return
    
    company_name = parts[0]
    position = parts[1] if len(parts) > 1 else None
    
    # If there are more than 2 parts, the user might have forgotten quotes
    if len(parts) > 2:
        await ctx.send(f"❌ Too many arguments. Use quotes for multi-word positions:\nExample: `{PREFIX}delete Google \"Software Engineer\"`")
        return
    
    discord_id = str(ctx.author.id)
    username = ctx.author.name
    message = await handle_delete_process(discord_id, username, company_name, position)
    await ctx.send(message)


@bot.command(name="list")
async def list_processes_prefix(ctx: commands.Context):
    """List all processes: p!list"""
    discord_id = str(ctx.author.id)
    username = ctx.author.name
    message = await handle_list_processes(discord_id, username)
    await ctx.send(message)


bot.run(DISCORD_TOKEN)