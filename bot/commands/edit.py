"""Edit process command handler."""
import discord
from discord import app_commands
from discord.ext import commands
import os
import shlex

from utils.auth import get_user_token, api_request
from utils.embeds import create_success_embed, create_error_embed, create_usage_embed
from utils.errors import handle_command_error
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")


async def handle_edit_process(
    discord_id: str, 
    username: str, 
    company_name: str, 
    position: str = None,
    field: str = None,
    new_value: str = None
) -> discord.Embed:
    """Handle editing a process. Returns success/error embed."""
    try:
        # Strip quotes from position if present
        if position:
            position = position.strip('"\'')
            if not position:
                position = None
        
        if not field or not new_value:
            return create_usage_embed(
                f"Usage: `{PREFIX}edit <company> [position] <field> <new_value>`",
                examples=[
                    f"{PREFIX}edit Google company name Alphabet",
                    f'{PREFIX}edit Google "SWE" position "Software Engineer"',
                    f"{PREFIX}edit Google privacy public",
                    f'{PREFIX}edit Google "SWE" privacy private'
                ],
                fields=[{
                    "name": "What can you edit?",
                    "value": "• **company name**: Change the company name\n• **position**: Change the job title/position\n• **privacy**: Set to public or private (values: public, private)",
                    "inline": False
                }]
            )
        
        # Normalize field name
        field_lower = field.lower().strip()
        
        # Map field names to what we'll update
        new_company_name = None
        new_position = None
        privacy = None
        
        if field_lower in ['company', 'company name', 'companyname']:
            new_company_name = new_value
        elif field_lower in ['position', 'job title', 'jobtitle', 'title']:
            new_position = new_value if new_value.strip() else None
        elif field_lower == 'privacy':
            privacy = new_value.lower().strip()
            if privacy not in ['public', 'private']:
                return create_error_embed(
                    "Invalid Privacy Value",
                    f"Privacy must be 'public' or 'private', got '{new_value}'"
                )
        else:
            return create_error_embed(
                "Invalid Field",
                f"Unknown field '{field}'. Valid fields are: company name, position, privacy",
                fields=[{
                    "name": "Valid Fields",
                    "value": "• **company name**: Change the company name\n• **position**: Change the job title/position\n• **privacy**: Set to public or private",
                    "inline": False
                }]
            )
        
        token = await get_user_token(discord_id, username)
        
        # Find process by company name and position - case-insensitive
        processes = await api_request("GET", "/api/processes/", token)
        matching = [p for p in processes 
                   if p["company_name"].lower() == company_name.lower()]
        
        # Filter by position if provided - case-insensitive
        if position:
            matching = [p for p in matching if (p.get("position") or "").lower() == position.lower()]
        else:
            # If no position specified, prefer processes with no position
            no_position = [p for p in matching if not p.get("position")]
            matching = no_position if no_position else matching
        
        if not matching:
            pos_text = f" ({position})" if position else ""
            return create_error_embed(
                "Process Not Found",
                f"Process for **{company_name}**{pos_text} not found.",
                fields=[{"name": "Next Steps", "value": f"Use `{PREFIX}list` or `/list` to see all processes.", "inline": False}]
            )
        
        # If multiple matches and no position specified, return error
        if len(matching) > 1 and not position:
            return create_error_embed(
                "Multiple Processes Found",
                f"Multiple processes found for **{company_name}**.",
                fields=[{
                    "name": "Solution",
                    "value": f"Please specify position: `{PREFIX}edit <company_name> <position> [options]`",
                    "inline": False
                }]
            )
        
        process = matching[0]
        process_id = process["id"]
        
        # Update company name and/or position if provided
        if new_company_name or new_position is not None:
            update_data = {}
            if new_company_name:
                update_data["company_name"] = new_company_name
            if new_position is not None:
                update_data["position"] = new_position if new_position else None
            
            try:
                updated_process = await api_request("PATCH", f"/api/processes/{process_id}", token, json=update_data)
            except Exception as e:
                error_msg = str(e)
                if "already exists" in error_msg.lower() or "duplicate" in error_msg.lower():
                    return create_error_embed(
                        "Duplicate Process",
                        "A process with this company name and position already exists. Please choose different values.",
                        fields=[{"name": "Note", "value": "The API prevents duplicate processes with the same company name and position.", "inline": False}]
                    )
                raise
        
        # Update privacy if provided
        if privacy:
            is_public = privacy == 'public'
            await api_request("PATCH", f"/api/processes/{process_id}/share", token, json={
                "is_public": is_public
            })
        
        # Build success message
        pos_text = f" ({position})" if position else ""
        if new_company_name:
            return create_success_embed(
                "Process Updated",
                f"Updated **{company_name}**{pos_text}: company name changed to **{new_company_name}**."
            )
        elif new_position is not None:
            if new_position:
                return create_success_embed(
                    "Process Updated",
                    f"Updated **{company_name}**{pos_text}: position changed to **{new_position}**."
                )
            else:
                return create_success_embed(
                    "Process Updated",
                    f"Updated **{company_name}**{pos_text}: position removed."
                )
        elif privacy:
            return create_success_embed(
                "Process Updated",
                f"Updated **{company_name}**{pos_text}: privacy set to **{privacy}**."
            )
    except Exception as e:
        return handle_command_error(e, "editing process")


def parse_edit_args(args: str):
    """Parse edit command arguments.
    
    Format: <company> [position] <field> <new_value>
    Parses left to right:
    1. Company name (required)
    2. Position (optional, if quoted or if next word doesn't match a field name)
    3. Field name (company name, position, privacy)
    4. New value
    """
    try:
        parts = shlex.split(args)
    except ValueError:
        return None, None, None, None, "Invalid quotes in command arguments"
    
    if len(parts) < 3:
        return None, None, None, None, "Not enough arguments. Usage: `p!edit <company> [position] <field> <new_value>`"
    
    company_name = parts[0]
    position = None
    field = None
    new_value = None
    
    # Valid field names
    valid_fields = ['company', 'company name', 'companyname', 'position', 'job title', 'jobtitle', 'title', 'privacy']
    
    i = 1
    # Check if second argument is a position (quoted or if it doesn't match a field name)
    if i < len(parts):
        # Check if it's a quoted string (position) or if it doesn't match a field name
        potential_position = parts[i].lower()
        if potential_position not in [f.lower() for f in valid_fields]:
            position = parts[i]
            i += 1
    
    # Now we should have field and new_value
    if i < len(parts):
        # Field name might be multiple words (e.g., "company name")
        # Try to match the longest possible field name first
        field_candidates = []
        for j in range(i, min(i + 2, len(parts))):  # Field can be 1-2 words
            candidate = ' '.join(parts[i:j+1]).lower()
            if candidate in [f.lower() for f in valid_fields]:
                field_candidates.append((j + 1, candidate))
        
        if field_candidates:
            # Use the longest match
            field_candidates.sort(key=lambda x: len(x[1]), reverse=True)
            field_end_idx, field = field_candidates[0]
            i = field_end_idx
        else:
            # Single word field
            field = parts[i].lower()
            i += 1
    
    # Remaining parts are the new value
    if i < len(parts):
        new_value = ' '.join(parts[i:])
    else:
        return None, None, None, None, "Missing new value. Usage: `p!edit <company> [position] <field> <new_value>`"
    
    return company_name, position, field, new_value, None


def setup_edit_command(bot: commands.Bot):
    """Setup edit command (both slash and prefix)."""
    
    # Slash command
    @bot.tree.command(name="edit", description="Edit a process (company name, position, or privacy)")
    @app_commands.describe(
        company_name="The company name of the process to edit",
        position="The position/job title (optional, required if multiple processes exist)",
        field="What to edit: company name, position, or privacy",
        new_value="The new value"
    )
    async def edit_process(
        interaction: discord.Interaction,
        company_name: str,
        field: str,
        new_value: str,
        position: str = None
    ):
        """Edit process: /edit <company> [position] <field> <new_value>"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="edit",
            user_id=discord_id,
            username=username,
            parsed_args={
                "company_name": company_name,
                "position": position,
                "field": field,
                "new_value": new_value
            }
        )
        
        await interaction.response.defer()
        embed = await handle_edit_process(
            discord_id, 
            username, 
            company_name, 
            position,
            field,
            new_value
        )
        await interaction.followup.send(embed=embed)
    
    # Prefix command
    @bot.command(name="edit")
    async def edit_process_prefix(ctx: commands.Context, *, args: str = None):
        """Edit process: p!edit <company> [position] <field> <new_value>"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        if not args:
            embed = create_usage_embed(
                f"Usage: `{PREFIX}edit <company> [position] <field> <new_value>`",
                examples=[
                    f"{PREFIX}edit Google company name Alphabet",
                    f'{PREFIX}edit Google "SWE" position "Software Engineer"',
                    f"{PREFIX}edit Google privacy public",
                    f'{PREFIX}edit Google "SWE" privacy private'
                ],
                fields=[{
                    "name": "What can you edit?",
                    "value": "• **company name**: Change the company name\n• **position**: Change the job title/position\n• **privacy**: Set to public or private (values: public, private)",
                    "inline": False
                }]
            )
            await ctx.send(embed=embed)
            return
        
        # Parse arguments
        company_name, position, field, new_value, error = parse_edit_args(args)
        
        if error:
            embed = create_error_embed("Parse Error", error)
            await ctx.send(embed=embed)
            return
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="edit",
            user_id=discord_id,
            username=username,
            raw_args=args,
            parsed_args={
                "company_name": company_name,
                "position": position,
                "field": field,
                "new_value": new_value
            }
        )
        
        embed = await handle_edit_process(
            discord_id, 
            username, 
            company_name, 
            position,
            field,
            new_value
        )
        await ctx.send(embed=embed)

