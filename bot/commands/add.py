"""Add process command handler."""
import discord
from discord import app_commands
from discord.ext import commands
import httpx
import os
from dotenv import load_dotenv

from utils.auth import get_user_token, api_request
from utils.embeds import create_success_embed, create_error_embed
from utils.constants import VALID_STAGE_NAMES

load_dotenv()
PREFIX = os.getenv("PREFIX", "p!")


async def handle_add_process(discord_id: str, username: str, company_name: str, stage_name: str, position: str = None) -> discord.Embed:
    """Handle adding a stage to a process (or create process if it doesn't exist). Returns success/error embed."""
    try:
        token = await get_user_token(discord_id, username)
        
        # Check if process already exists (same company name and position) - case-insensitive
        processes = await api_request("GET", "/api/processes/", token)
        existing_process = next((p for p in processes 
                        if p["company_name"].lower() == company_name.lower() 
                        and (p.get("position") or "").lower() == (position or "").lower()), None)
        
        from datetime import date
        today = date.today()
        
        if existing_process:
            # Process exists, add stage to it
            # API will check for duplicate (same name and date) and reject if found
            await api_request("POST", "/api/stages/", token, json={
                "process_id": existing_process["id"],
                "stage_name": stage_name,
                "stage_date": today.isoformat(),
                "order": None  # Let API set the order automatically
            })
            
            pos_text = f" ({position})" if position else ""
            return create_success_embed(
                "Stage Added",
                f"Added stage **{stage_name}** to **{company_name}**{pos_text}"
            )
        else:
            # Process doesn't exist, create it and add initial stage
            process = await api_request("POST", "/api/processes/", token, json={
                "company_name": company_name,
                "position": position if position else None
            })
            
            # Add initial stage
            await api_request("POST", "/api/stages/", token, json={
                "process_id": process["id"],
                "stage_name": stage_name,
                "stage_date": today.isoformat(),
                "order": 1
            })
            
            pos_text = f" ({position})" if position else ""
            return create_success_embed(
                "Process Created",
                f"Created process for **{company_name}**{pos_text} with stage **{stage_name}**"
            )
    except httpx.HTTPStatusError as e:
        try:
            if e.response.content:
                error_data = e.response.json()
                if isinstance(error_data, dict):
                    error_msg = error_data.get("detail", str(error_data))
                else:
                    error_msg = str(error_data)
            else:
                error_msg = f"HTTP {e.response.status_code}: {e.response.reason_phrase}"
        except Exception:
            error_msg = f"HTTP {e.response.status_code}: {e.response.reason_phrase}"
        return create_error_embed("Error", error_msg)
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error adding process: {error_trace}")
        error_msg = str(e) if str(e) else f"Unknown error: {type(e).__name__}"
        return create_error_embed("Error", f"Error creating process: {error_msg}")


def setup_add_command(bot: commands.Bot, stage_name_autocomplete):
    """Setup add command (both slash and prefix)."""
    from utils.embeds import create_usage_embed, create_error_embed
    from utils.constants import VALID_STAGE_NAMES
    PREFIX = os.getenv("PREFIX", "p!")  # Get PREFIX from environment
    
    # Slash command
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
    
    # Prefix command
    @bot.command(name="add")
    async def add_process_prefix(ctx: commands.Context, *, args: str = None):
        """Add a new process: p!add <company_name> <stage_name> [position]"""
        if not args:
            valid_names = ', '.join([f"`{name}`" for name in VALID_STAGE_NAMES if name != 'Other'])
            embed = create_usage_embed(
                f"Usage: `{PREFIX}add <company_name> <stage_name> [position]`",
                examples=f"• `{PREFIX}add Google OA`\n• `{PREFIX}add Google Technical Interview`\n• `{PREFIX}add Google OA Software Engineer`",
                fields=[{"name": "Valid Stage Names", "value": valid_names, "inline": False}]
            )
            await ctx.send(embed=embed)
            return
        
        # Parse: split by spaces, then match stage name from VALID_STAGE_NAMES
        parts = args.split()
        if len(parts) < 2:
            valid_names = ', '.join([f"`{name}`" for name in VALID_STAGE_NAMES if name != 'Other'])
            embed = create_usage_embed(
                f"Usage: `{PREFIX}add <company_name> <stage_name> [position]`",
                fields=[{"name": "Valid Stage Names", "value": valid_names, "inline": False}]
            )
            await ctx.send(embed=embed)
            return
        
        company_name = parts[0]
        remaining = parts[1:]
        
        # Try to match stage name from VALID_STAGE_NAMES (check progressively longer combinations)
        stage_name = None
        stage_end_idx = None
        
        # Create a case-insensitive lookup dictionary
        stage_name_lookup = {name.lower(): name for name in VALID_STAGE_NAMES}
        
        # Check from longest to shortest to match multi-word stage names first
        for length in range(len(remaining), 0, -1):
            potential_stage = ' '.join(remaining[:length])
            potential_stage_lower = potential_stage.lower()
            if potential_stage_lower in stage_name_lookup:
                # Use the original capitalized version from VALID_STAGE_NAMES
                stage_name = stage_name_lookup[potential_stage_lower]
                stage_end_idx = length
                break
        
        if not stage_name:
            valid_names = ', '.join([f"`{name}`" for name in VALID_STAGE_NAMES if name != 'Other'])
            embed = create_error_embed(
                "Invalid Stage Name",
                "The stage name you provided doesn't match any valid stage names.",
                fields=[
                    {"name": "Valid Stage Names", "value": valid_names, "inline": False},
                    {"name": "Note", "value": "Custom stages (Other) are not supported via bot commands.", "inline": False}
                ]
            )
            await ctx.send(embed=embed)
            return
        
        # Everything after the matched stage name becomes position
        position = ' '.join(remaining[stage_end_idx:]) if stage_end_idx < len(remaining) else None
        position = position if position else None  # Convert empty string to None
        
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        embed = await handle_add_process(discord_id, username, company_name, stage_name, position)
        await ctx.send(embed=embed)

