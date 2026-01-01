"""Help command handler."""
import discord
from discord import app_commands
from discord.ext import commands
import os
from dotenv import load_dotenv

from utils.embeds import create_info_embed
from utils.logging import log_command

load_dotenv()
PREFIX = os.getenv("PREFIX", "p!")


async def handle_help_command() -> discord.Embed:
    """Handle help command. Returns embed with command information."""
    prefix = PREFIX
    
    return create_info_embed(
        "📚 Bot Commands",
        "Here are all available commands for the Process Tracker bot:",
        fields=[
            {
                "name": f"`{prefix}add` or `/add`",
                "value": "Add a stage to an existing process or create a new process.\n"
                         f"**Usage:** `{prefix}add <company_name> <stage_name> [position]`\n"
                         f"**Examples:**\n"
                         f"• `{prefix}add Google OA`\n"
                         f"• `{prefix}add Microsoft \"Technical Interview\" \"Software Engineer\"`\n"
                         f"• `{prefix}add Amazon Phone Screen`",
                "inline": False
            },
            {
                "name": f"`{prefix}delete` or `/delete`",
                "value": "Delete a process by company name and optional position.\n"
                         f"**Usage:** `{prefix}delete <company_name> [position]`\n"
                         f"**Examples:**\n"
                         f"• `{prefix}delete Google`\n"
                         f"• `{prefix}delete Microsoft \"Software Engineer\"`",
                "inline": False
            },
            {
                "name": f"`{prefix}list` or `/list`",
                "value": "List all your job application processes.\n"
                         f"**Usage:** `{prefix}list`\n"
                         "Shows all processes with their stages and current status.",
                "inline": False
            },
            {
                "name": f"`{prefix}dashboard` or `/dashboard`",
                "value": "Get a link to your web dashboard or sign up instructions.\n"
                         f"**Usage:** `{prefix}dashboard`\n"
                         "If you have a web account, you'll get a direct link. Otherwise, you'll get instructions to sign up and connect your Discord account.",
                "inline": False
            },
            {
                "name": f"`!process` (Legacy)",
                "value": f"Legacy command that translates to `{prefix}add`.\n"
                         f"**Usage:** `!process <company_name> <stage_name> [position]`\n"
                         f"**Example:** `!process Google OA`",
                "inline": False
            },
            {
                "name": "💡 Tips",
                "value": "• Stage names are case-insensitive\n"
                         "• Company names can be multiple words (no quotes needed)\n"
                         "• Position titles should be in quotes if they contain spaces\n"
                         "• Use `/` commands for autocomplete suggestions",
                "inline": False
            }
        ]
    )


def setup_help_command(bot: commands.Bot):
    """Setup help command (both slash and prefix)."""
    
    # Slash command
    @bot.tree.command(name="help", description="Show all available bot commands")
    async def help_slash(interaction: discord.Interaction):
        """Help command: /help"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="help",
            user_id=discord_id,
            username=username
        )
        
        embed = await handle_help_command()
        await interaction.response.send_message(embed=embed)
    
    # Prefix command
    @bot.command(name="help")
    async def help_prefix(ctx: commands.Context):
        """Help command: p!help"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="help",
            user_id=discord_id,
            username=username
        )
        
        embed = await handle_help_command()
        await ctx.send(embed=embed)

