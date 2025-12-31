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


@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}')
    try:
        synced = await bot.tree.sync()
        print(f'Synced {len(synced)} command(s)')
    except Exception as e:
        print(f'Failed to sync commands: {e}')


@bot.tree.command(name="add", description="Add a new process with an initial stage")
@app_commands.describe(
    company_name="The company name (e.g., Google, Microsoft)",
    stage_name="The initial stage name (e.g., OA, Phone Screen, Reject)"
)
async def add_process(interaction: discord.Interaction, company_name: str, stage_name: str):
    """Add a new process: /add <company_name> <stage_name>"""
    await interaction.response.defer()
    
    try:
        # Get authentication token
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        token = await get_user_token(discord_id, username)
        
        # Check if process already exists
        processes = await api_request("GET", "/api/processes/", token)
        existing = next((p for p in processes if p["company_name"].lower() == company_name.lower()), None)
        
        if existing:
            await interaction.followup.send(
                f"❌ Process for **{company_name}** already exists. Use `/list` to see all processes."
            )
            return
        
        # Create process
        process = await api_request("POST", "/api/processes/", token, json={
            "company_name": company_name,
            "position": None
        })
        
        # Add initial stage
        from datetime import date
        await api_request("POST", "/api/stages/", token, json={
            "process_id": process["id"],
            "stage_name": stage_name,
            "stage_date": date.today().isoformat(),
            "order": 1
        })
        
        await interaction.followup.send(
            f"✅ Created process for **{company_name}** with stage **{stage_name}**"
        )
    except httpx.HTTPStatusError as e:
        error_msg = e.response.json().get("detail", str(e)) if e.response.content else str(e)
        await interaction.followup.send(f"❌ Error: {error_msg}")
    except Exception as e:
        print(f"Error adding process: {e}")
        await interaction.followup.send(f"❌ Error creating process: {str(e)}")


@bot.tree.command(name="delete", description="Delete a process by company name")
@app_commands.describe(company_name="The company name to delete")
async def delete_process_cmd(interaction: discord.Interaction, company_name: str):
    """Delete a process: /delete <company_name>"""
    await interaction.response.defer()
    
    try:
        # Get authentication token
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        token = await get_user_token(discord_id, username)
        
        # Find process by company name
        processes = await api_request("GET", "/api/processes/", token)
        process = next((p for p in processes if p["company_name"].lower() == company_name.lower()), None)
        
        if not process:
            await interaction.followup.send(
                f"❌ Process for **{company_name}** not found. Use `/list` to see all processes."
            )
            return
        
        # Delete process
        await api_request("DELETE", f"/api/processes/{process['id']}", token)
        
        await interaction.followup.send(f"✅ Deleted process for **{company_name}**")
    except httpx.HTTPStatusError as e:
        error_msg = e.response.json().get("detail", str(e)) if e.response.content else str(e)
        await interaction.followup.send(f"❌ Error: {error_msg}")
    except Exception as e:
        print(f"Error deleting process: {e}")
        await interaction.followup.send(f"❌ Error deleting process: {str(e)}")


@bot.tree.command(name="list", description="List all your processes")
async def list_processes(interaction: discord.Interaction):
    """List all processes: /list"""
    await interaction.response.defer()
    
    try:
        # Get authentication token
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        token = await get_user_token(discord_id, username)
        
        # Get all processes
        processes = await api_request("GET", "/api/processes/", token)
        
        if not processes:
            await interaction.followup.send(
                "📋 You don't have any processes yet. Use `/add <company> <stage>` to create one!"
            )
            return
        
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
            
            lines.append(f"{status_emoji} **{p['company_name']}** - {latest_stage} ({status})")
        
        message = "\n".join(lines)
        # Discord message limit is 2000 characters
        if len(message) > 2000:
            message = message[:1950] + "\n... (truncated)"
        
        await interaction.followup.send(message)
    except httpx.HTTPStatusError as e:
        error_msg = e.response.json().get("detail", str(e)) if e.response.content else str(e)
        await interaction.followup.send(f"❌ Error: {error_msg}")
    except Exception as e:
        print(f"Error listing processes: {e}")
        await interaction.followup.send(f"❌ Error listing processes: {str(e)}")


bot.run(DISCORD_TOKEN)