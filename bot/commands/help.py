"""Help command handler."""
import discord
from discord import app_commands
from discord.ext import commands
import os
from dotenv import load_dotenv

from utils.logging import log_command

load_dotenv()
PREFIX = os.getenv("PREFIX", "p!")


async def handle_help_command() -> discord.Embed:
    """Handle help command. Returns embed with command information."""
    prefix = PREFIX
    
    # Create a fancy embed with custom color
    embed = discord.Embed(
        title="📚 Process Tracker Bot Commands",
        description="Track your job application processes directly from Discord!\n"
                   "Use slash commands (`/`) for autocomplete or prefix commands (`p!`) for quick access.",
        color=0x5865F2  # Discord blurple color
    )
    
    # Add author info
    embed.set_author(
        name="Process Tracker Bot"
    )
    
    # Commands section with fancy formatting
    embed.add_field(
        name="➕ Add Process/Stage",
        value=f"```\n{prefix}add <company> <stage> [position]\n/add\n```"
              f"**Description:** Add a stage to an existing process or create a new one\n\n"
              f"**Examples:**\n"
              f"```\n{prefix}add Google OA\n"
              f"{prefix}add Microsoft \"Technical Interview\" \"SWE\"\n"
              f"{prefix}add Amazon Phone Screen\n```",
        inline=False
    )
    
    embed.add_field(
        name="🗑️ Delete Process",
        value=f"```\n{prefix}delete <company> [position]\n/delete\n```"
              f"**Description:** Remove a process by company name\n\n"
              f"**Examples:**\n"
              f"```\n{prefix}delete Google\n"
              f"{prefix}delete Microsoft \"Software Engineer\"\n```",
        inline=False
    )
    
    embed.add_field(
        name="📋 List Processes",
        value=f"```\n{prefix}list\n/list\n```"
              f"**Description:** View all your processes with stages and status\n\n"
              f"Shows paginated results with interactive navigation",
        inline=False
    )
    
    embed.add_field(
        name="🌐 Dashboard",
        value=f"```\n{prefix}dashboard\n/dashboard\n```"
              f"**Description:** Get your web dashboard link or signup instructions\n\n"
              f"• **Has account:** Direct link to dashboard\n"
              f"• **No account:** Instructions to sign up and connect",
        inline=False
    )
    
    embed.add_field(
        name="❓ Help",
        value=f"```\n{prefix}help\n/help\n```"
              f"**Description:** Show this help message",
        inline=False
    )
    
    embed.add_field(
        name="⚡ Legacy Command",
        value=f"```\n!process <company> <stage> [position]\n```"
              f"**Description:** Old command format (translates to `{prefix}add`)\n\n"
              f"**Example:** `!process Google OA`",
        inline=False
    )
    
    # Tips section with better formatting
    embed.add_field(
        name="💡 Pro Tips",
        value="```diff\n"
              "+ Stage names are case-insensitive\n"
              "+ Company names can be multiple words (no quotes needed)\n"
              "+ Position titles use quotes if they contain spaces\n"
              "+ Use / commands for autocomplete suggestions\n"
              "+ List command supports pagination for many processes\n```",
        inline=False
    )
    
    # Footer with additional info
    embed.set_footer(
        text=f"Prefix: {prefix} | Use /help or {prefix}help anytime"
    )
    embed.timestamp = discord.utils.utcnow()
    
    return embed


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

