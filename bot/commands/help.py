"""Help command handler."""
import discord
from discord import app_commands
from discord.ext import commands
import os
from dotenv import load_dotenv

from utils.logging import log_command

load_dotenv()
PREFIX = os.getenv("PREFIX", "p!")

# Command categories and descriptions
COMMAND_INFO = {
    "add": {
        "category": "processes",
        "description": "Add a stage to an existing process or create a new process",
        "usage": f"{PREFIX}add <company> <stage> [position]",
        "examples": [
            f"{PREFIX}add Google OA",
            f'{PREFIX}add Microsoft "Technical Interview" "SWE"',
            f"{PREFIX}add Amazon Phone Screen"
        ],
        "slash": "/add"
    },
    "delete": {
        "category": "processes",
        "description": "Delete a process by company name and optional position",
        "usage": f"{PREFIX}delete <company> [position]",
        "examples": [
            f"{PREFIX}delete Google",
            f'{PREFIX}delete Microsoft "Software Engineer"'
        ],
        "slash": "/delete"
    },
    "list": {
        "category": "processes",
        "description": "List all your job application processes with stages and status",
        "usage": f"{PREFIX}list",
        "examples": [f"{PREFIX}list"],
        "slash": "/list",
        "notes": "Shows paginated results with interactive navigation"
    },
    "dashboard": {
        "category": "account",
        "description": "Get your web dashboard link or signup instructions",
        "usage": f"{PREFIX}dashboard",
        "examples": [f"{PREFIX}dashboard"],
        "slash": "/dashboard",
        "notes": "Has account: Direct link | No account: Signup instructions"
    },
    "help": {
        "category": "misc",
        "description": "Show command help (general overview or specific command details)",
        "usage": f"{PREFIX}help [command_name]",
        "examples": [
            f"{PREFIX}help",
            f"{PREFIX}help add"
        ],
        "slash": "/help"
    }
}


async def handle_help_command(command_name: str = None) -> discord.Embed:
    """Handle help command. Returns embed with command information."""
    prefix = PREFIX
    
    # If specific command requested, show detailed help
    if command_name:
        command_name = command_name.lower().strip()
        if command_name in COMMAND_INFO:
            info = COMMAND_INFO[command_name]
            
            # Map command names to emojis and display names
            command_display = {
                "add": ("➕", "Add Process/Stage"),
                "delete": ("🗑️", "Delete Process"),
                "list": ("📋", "List Processes"),
                "dashboard": ("🌐", "Dashboard"),
                "help": ("❓", "Help")
            }
            
            emoji, display_name = command_display.get(command_name, ("📚", command_name.title()))
            
            embed = discord.Embed(
                title=f"{emoji} {display_name}",
                description="",
                color=0x5865F2
            )
            
            # Usage section
            usage_text = f"```\n{info['usage']}\n{info.get('slash', '')}\n```"
            embed.add_field(
                name="Usage",
                value=usage_text,
                inline=False
            )
            
            # Description
            embed.add_field(
                name="Description",
                value=info["description"],
                inline=False
            )
            
            # Examples
            if info.get("examples"):
                examples_text = "\n".join(info["examples"])
                embed.add_field(
                    name="Examples",
                    value=f"```\n{examples_text}\n```",
                    inline=False
                )
            
            # Notes if available
            if info.get("notes"):
                embed.add_field(
                    name="Note",
                    value=info["notes"],
                    inline=False
                )
            
            embed.set_footer(text=f"Category: {info['category']} | Use {prefix}help for all commands")
            embed.timestamp = discord.utils.utcnow()
            return embed
        else:
            # Command not found
            embed = discord.Embed(
                title="❌ Command Not Found",
                description=f"Command `{command_name}` not found.\n\n"
                           f"Use `{prefix}help` to see all available commands.",
                color=0xFF0000
            )
            return embed
    
    # General overview - quick rundown
    embed = discord.Embed(
        title="📚 Process",
        description=f"All commands\n"
                   f"Get information about a specific command with `{prefix}help COMMAND_NAME`\n"
                   f"Use slash commands (`/`) for autocomplete suggestions!",
        color=0x5865F2
    )
    
    # Group commands by category
    categories = {
        "processes": ["add", "delete", "list"],
        "account": ["dashboard"],
        "misc": ["help"]
    }
    
    for category, commands in categories.items():
        command_list = ", ".join([f"`{cmd}`" for cmd in commands])
        embed.add_field(
            name=category.title(),
            value=command_list,
            inline=False
        )
    
    # Legacy command
    embed.add_field(
        name="legacy",
        value="`!process` (translates to add)",
        inline=False
    )
    
    embed.set_footer(text=f"Prefix: {prefix} | Use {prefix}help <command> for details")
    embed.timestamp = discord.utils.utcnow()
    
    return embed


def setup_help_command(bot: commands.Bot):
    """Setup help command (both slash and prefix)."""
    
    # Slash command
    @bot.tree.command(name="help", description="Show all available bot commands or get help for a specific command")
    @app_commands.describe(command="Name of the command to get detailed help for")
    async def help_slash(interaction: discord.Interaction, command: str = None):
        """Help command: /help [command]"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="help",
            user_id=discord_id,
            username=username,
            raw_args=command if command else None
        )
        
        embed = await handle_help_command(command)
        await interaction.response.send_message(embed=embed)
    
    # Prefix command
    @bot.command(name="help", aliases=["h"])
    async def help_prefix(ctx: commands.Context, command_name: str = None):
        """Help command: p!help [command_name]"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="help",
            user_id=discord_id,
            username=username,
            raw_args=command_name if command_name else None
        )
        
        embed = await handle_help_command(command_name)
        await ctx.send(embed=embed)

