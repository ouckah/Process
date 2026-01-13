"""Add process command handler."""
import discord
from discord import app_commands
from discord.ext import commands
import httpx
import os

from utils.auth import get_user_token, api_request
from utils.embeds import create_success_embed, create_error_embed
from utils.constants import VALID_STAGE_NAMES, match_stage_name
from utils.errors import handle_command_error
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")


async def handle_add_process(discord_id: str, username: str, company_name: str, stage_name: str, position: str = None) -> discord.Embed:
    """Handle adding a stage to a process (or create process if it doesn't exist). Returns success/error embed."""
    try:
        # Strip quotes from position if present (user might have quoted it for parsing)
        if position:
            position = position.strip('"\'')
            if not position:  # If position becomes empty after stripping, set to None
                position = None
        
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
    except Exception as e:
        return handle_command_error(e, "creating process")


async def handle_legacy_process_command(ctx: commands.Context):
    """Handle legacy !process command: !process <company_name> <stage_name> [\"position\"]"""
    from utils.embeds import create_usage_embed, create_error_embed
    
    # Extract args (everything after "!process ")
    content = ctx.message.content
    if not content.startswith("!process"):
        return
    
    args = content[9:].strip()  # Remove "!process " prefix
    
    # Reuse the same parsing logic as the add command
    if not args:
        valid_names = ', '.join([f"`{name}`" for name in VALID_STAGE_NAMES if name != 'Other'])
        embed = create_usage_embed(
            f"Usage: `!process <company_name> <stage_name>`",
            examples=f"• `!process Google OA`\n• `!process Capital One OA`\n• `!process Google Phone Screen`",
            fields=[{"name": "Valid Stage Names", "value": valid_names, "inline": False}]
        )
        await ctx.send(embed=embed)
        return
    
    # Parse arguments - extract quoted position first, then match stage name from end
    # Format: !process <company> <stage> ["position"]
    # This allows: !process capital one oa "software engineer"
    
    # First, check if there's a quoted string at the end (position)
    position = None
    args_for_stage_match = args.strip()
    
    # Check if the last character is a quote and extract quoted position
    if args_for_stage_match and (args_for_stage_match[-1] == '"' or args_for_stage_match[-1] == "'"):
        # Find the matching opening quote
        quote_char = args_for_stage_match[-1]
        last_quote_pos = len(args_for_stage_match) - 1
        # Search backwards for the matching opening quote
        for i in range(last_quote_pos - 1, -1, -1):
            if args_for_stage_match[i] == quote_char and (i == 0 or args_for_stage_match[i-1].isspace()):
                # Found the opening quote, extract position
                position = args_for_stage_match[i+1:last_quote_pos].strip()
                # Remove the quoted position from args
                args_for_stage_match = args_for_stage_match[:i].strip()
                break
    
    # Now parse the remaining args to find company and stage
    parts = args_for_stage_match.split()
    
    if len(parts) < 2:
        valid_names = ', '.join([f"`{name}`" for name in VALID_STAGE_NAMES if name != 'Other'])
        embed = create_usage_embed(
            f"Usage: `!process <company_name> <stage_name> [\"position\"]`",
            examples=f"• `!process Google OA`\n• `!process Capital One OA`\n• `!process Google Phone Screen`\n• `!process Google OA \"Software Engineer\"`",
            fields=[{"name": "Valid Stage Names", "value": valid_names, "inline": False}]
        )
        await ctx.send(embed=embed)
        return
    
    # Try to match stage name from the end of the args (reverse order)
    # This allows multi-word company names to work without quotes
    # Supports partial matching (e.g., "Phone" -> "Phone Screen")
    stage_name = None
    stage_start_idx = None
    
    # Check from longest to shortest stage name combinations, starting from the end
    for length in range(len(parts), 0, -1):
        # Try matching the last N words as a stage name
        potential_stage_parts = parts[-length:]
        potential_stage = ' '.join(potential_stage_parts)
        
        # Try to match (supports partial matching)
        matched = match_stage_name(potential_stage)
        if matched:
            # Found a match! Use the matched full stage name
            stage_name = matched
            stage_start_idx = len(parts) - length
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
    
    # Everything before the stage name is the company name (can be multi-word)
    company_name = ' '.join(parts[:stage_start_idx])
    
    discord_id = str(ctx.author.id)
    username = ctx.author.name
    
    # Log the command (as legacy/process but note it's translated to add)
    log_command(
        command_type="prefix",
        command_name="process",
        user_id=discord_id,
        username=username,
        raw_args=args,
        parsed_args={
            "company_name": company_name,
            "stage_name": stage_name,
            "position": position
        }
    )
    
    embed = await handle_add_process(discord_id, username, company_name, stage_name, position)
    await ctx.send(embed=embed)


def setup_add_command(bot: commands.Bot, stage_name_autocomplete):
    """Setup add command (both slash and prefix)."""
    from utils.embeds import create_usage_embed, create_error_embed
    from utils.constants import VALID_STAGE_NAMES, match_stage_name
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
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="add",
            user_id=discord_id,
            username=username,
            parsed_args={
                "company_name": company_name,
                "stage_name": stage_name,
                "position": position
            }
        )
        
        # Check command restrictions
        from utils.restrictions import check_command_restrictions, record_command_use
        guild_id = str(interaction.guild.id) if interaction.guild else None
        channel_id = interaction.channel.id if interaction.channel else 0
        
        is_allowed, error_embed = await check_command_restrictions(
            guild_id, discord_id, channel_id, "add", interaction=interaction
        )
        
        if not is_allowed:
            if error_embed:
                await interaction.response.send_message(embed=error_embed, ephemeral=True)
            else:
                await interaction.response.send_message("Command not available in this channel.", ephemeral=True)
            return
        
        await interaction.response.defer()
        embed = await handle_add_process(discord_id, username, company_name, stage_name, position)
        message = await interaction.followup.send(embed=embed)
        
        # Record command use for cooldown
        record_command_use(guild_id, discord_id, "add")
        
        # Auto-delete if configured
        if guild_id:
            from utils.config import guild_config
            config = await guild_config.get_config(guild_id)
            auto_delete = config.get("auto_delete_seconds")
            if auto_delete and auto_delete > 0:
                async def delete_after_delay():
                    try:
                        await asyncio.sleep(auto_delete)
                        await message.delete()
                    except:
                        pass
                asyncio.create_task(delete_after_delay())
    
    # Prefix command
    @bot.command(name="add")
    async def add_process_prefix(ctx: commands.Context, *, args: str = None):
        """Add a new process: p!add <company_name> <stage_name> [\"position\"]"""
        if not args:
            valid_names = ', '.join([f"`{name}`" for name in VALID_STAGE_NAMES if name != 'Other'])
            embed = create_usage_embed(
                f"Usage: `{PREFIX}add <company_name> <stage_name>`",
                examples=f"• `{PREFIX}add Google OA`\n• `{PREFIX}add Capital One OA`\n• `{PREFIX}add Google Phone Screen`",
                fields=[{"name": "Valid Stage Names", "value": valid_names, "inline": False}]
            )
            await ctx.send(embed=embed)
            return
        
        # Parse arguments - extract quoted position first, then match stage name from end
        # Format: p!add <company> <stage> ["position"]
        # This allows: p!add capital one oa "software engineer"
        
        # First, check if there's a quoted string at the end (position)
        position = None
        args_for_stage_match = args.strip()
        
        # Check if the last character is a quote and extract quoted position
        if args_for_stage_match and (args_for_stage_match[-1] == '"' or args_for_stage_match[-1] == "'"):
            # Find the matching opening quote
            quote_char = args_for_stage_match[-1]
            last_quote_pos = len(args_for_stage_match) - 1
            # Search backwards for the matching opening quote
            for i in range(last_quote_pos - 1, -1, -1):
                if args_for_stage_match[i] == quote_char and (i == 0 or args_for_stage_match[i-1].isspace()):
                    # Found the opening quote, extract position
                    position = args_for_stage_match[i+1:last_quote_pos].strip()
                    # Remove the quoted position from args
                    args_for_stage_match = args_for_stage_match[:i].strip()
                    break
        
        # Now parse the remaining args to find company and stage
        parts = args_for_stage_match.split()
        
        if len(parts) < 2:
            valid_names = ', '.join([f"`{name}`" for name in VALID_STAGE_NAMES if name != 'Other'])
            embed = create_usage_embed(
                f"Usage: `{PREFIX}add <company_name> <stage_name> [\"position\"]`",
                examples=f"• `{PREFIX}add Google OA`\n• `{PREFIX}add Capital One OA`\n• `{PREFIX}add Google Phone Screen`\n• `{PREFIX}add Google OA \"Software Engineer\"`",
                fields=[{"name": "Valid Stage Names", "value": valid_names, "inline": False}]
            )
            await ctx.send(embed=embed)
            return
        
        # Try to match stage name from the end of the args (reverse order)
        # This allows multi-word company names to work without quotes
        # Supports partial matching (e.g., "Phone" -> "Phone Screen")
        stage_name = None
        stage_start_idx = None
        
        # Check from longest to shortest stage name combinations, starting from the end
        for length in range(len(parts), 0, -1):
            # Try matching the last N words as a stage name
            potential_stage_parts = parts[-length:]
            potential_stage = ' '.join(potential_stage_parts)
            
            # Try to match (supports partial matching)
            matched = match_stage_name(potential_stage)
            if matched:
                # Found a match! Use the matched full stage name
                stage_name = matched
                stage_start_idx = len(parts) - length
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
        
        # Everything before the stage name is the company name (can be multi-word)
        company_name = ' '.join(parts[:stage_start_idx])
        
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        # Check command restrictions
        from utils.restrictions import check_command_restrictions, record_command_use
        guild_id = str(ctx.guild.id) if ctx.guild else None
        channel_id = ctx.channel.id if ctx.channel else 0
        
        is_allowed, error_embed = await check_command_restrictions(
            guild_id, discord_id, channel_id, "add", ctx=ctx
        )
        
        if not is_allowed:
            if error_embed:
                await ctx.send(embed=error_embed)
            # If no error embed, silently ignore (channel restriction)
            return
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="add",
            user_id=discord_id,
            username=username,
            raw_args=args,
            parsed_args={
                "company_name": company_name,
                "stage_name": stage_name,
                "position": position
            }
        )
        
        embed = await handle_add_process(discord_id, username, company_name, stage_name, position)
        message = await ctx.send(embed=embed)
        
        # Record command use for cooldown
        record_command_use(guild_id, discord_id, "add")
        
        # Auto-delete if configured
        if guild_id:
            from utils.config import guild_config
            import asyncio
            config = await guild_config.get_config(guild_id)
            auto_delete = config.get("auto_delete_seconds")
            if auto_delete and auto_delete > 0:
                async def delete_after_delay():
                    try:
                        await asyncio.sleep(auto_delete)
                        await message.delete()
                    except:
                        pass
                asyncio.create_task(delete_after_delay())

