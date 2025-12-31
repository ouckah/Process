"""Delete process command handler."""
import discord
from discord import app_commands
from discord.ext import commands
import httpx
import os
from dotenv import load_dotenv

from utils.auth import get_user_token, api_request
from utils.embeds import create_success_embed, create_error_embed, create_usage_embed

load_dotenv()
PREFIX = os.getenv("PREFIX", "p!")


async def handle_delete_process(discord_id: str, username: str, company_name: str, position: str = None) -> discord.Embed:
    """Handle deleting a process. Returns success/error embed."""
    try:
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
            # If none exist, take the first match
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
                    "value": f"Please specify position: `{PREFIX}delete <company_name> <position>` or `/delete <company_name> <position>`",
                    "inline": False
                }]
            )
        
        process = matching[0]
        # Delete process
        await api_request("DELETE", f"/api/processes/{process['id']}", token)
        
        pos_text = f" ({position})" if position else ""
        return create_success_embed(
            "Process Deleted",
            f"Deleted process for **{company_name}**{pos_text}"
        )
    except httpx.HTTPStatusError as e:
        error_msg = e.response.json().get("detail", str(e)) if e.response.content else str(e)
        return create_error_embed("Error", error_msg)
    except Exception as e:
        print(f"Error deleting process: {e}")
        return create_error_embed("Error", f"Error deleting process: {str(e)}")


def setup_delete_command(bot: commands.Bot):
    """Setup delete command (both slash and prefix)."""
    
    # Slash command
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
    
    # Prefix command
    @bot.command(name="delete")
    async def delete_process_prefix(ctx: commands.Context, *, args: str = None):
        """Delete a process: p!delete <company_name> [position]"""
        if not args:
            embed = create_usage_embed(
                f"Usage: `{PREFIX}delete <company_name> [position]`",
                examples=f"• `{PREFIX}delete Google`\n• `{PREFIX}delete Google Software Engineer`"
            )
            await ctx.send(embed=embed)
            return
        
        # Parse: split by spaces
        parts = args.split()
        if len(parts) < 1:
            embed = create_usage_embed(f"Usage: `{PREFIX}delete <company_name> [position]`")
            await ctx.send(embed=embed)
            return
        
        company_name = parts[0]
        position = ' '.join(parts[1:]) if len(parts) > 1 else None
        position = position if position else None  # Convert empty string to None
        
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        embed = await handle_delete_process(discord_id, username, company_name, position)
        await ctx.send(embed=embed)

