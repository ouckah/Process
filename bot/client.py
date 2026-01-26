"""
Main Discord bot client.

Command Registration Pattern:
-----------------------------
All command modules are imported and registered in the on_ready() event handler,
not at module level. This ensures:
1. Bot and network stack are fully initialized before command setup
2. Prevents import-time issues that could affect network connectivity
3. Consistent pattern for all commands

To add a new command:
1. Create your command module in bot/commands/your_command.py
2. Implement a setup_your_command(bot) function
3. In on_ready(), add: from commands import your_command
4. In on_ready(), add: your_command.setup_your_command(bot)
"""
import discord
from discord.ext import commands
import os
import logging
from dotenv import load_dotenv

from utils.constants import DEFAULT_PREFIX
from utils.autocomplete import stage_name_autocomplete

# Configure root logger to ensure all logs are visible
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] [%(levelname)-8s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S'
)

# Suppress verbose httpx HTTP request logging (only show warnings/errors)
logging.getLogger("httpx").setLevel(logging.WARNING)

load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
if not DISCORD_TOKEN:
    raise ValueError("DISCORD_TOKEN environment variable is not set")

# Log API URL on startup (for debugging connection issues)
logger = logging.getLogger(__name__)
api_url = os.getenv("API_URL", "http://localhost:8000")
logger.info(f"Bot configured to use API URL: {api_url}")

intents = discord.Intents.default()
intents.message_content = True

# Allow PREFIX to be overridden by environment variable
bot_prefix = os.getenv("PREFIX", DEFAULT_PREFIX)

# Disable default help command so we can use our custom one
bot = commands.Bot(command_prefix=bot_prefix, intents=intents, help_command=None)


@bot.event
async def on_ready():
    """Initialize bot and register all commands after bot is ready."""
    print(f'Logged in as {bot.user}')
    
    # Set global bot instance for welcome DM functionality
    from utils.auth import set_bot_instance
    set_bot_instance(bot)
    
    # Load and setup all commands after bot is ready
    # This ensures network stack and bot are fully initialized before command registration
    # 
    # PATTERN: When adding a new command:
    #   1. Import: from commands import your_command
    #   2. Setup: your_command.setup_your_command(bot)
    try:
        from commands import add, delete
        from commands import list as list_command
        from commands import dashboard
        from commands import help as help_command
        from commands import privacy, anon
        from commands import edit
        from commands import sankey
        from commands import profile, ask, comment, explore, forum
        from commands.mod import setup_mod_command
        
        # Setup all commands (add new commands here following the pattern above)
        add.setup_add_command(bot, stage_name_autocomplete)
        delete.setup_delete_command(bot)
        list_command.setup_list_command(bot)
        dashboard.setup_dashboard_command(bot)
        help_command.setup_help_command(bot)
        privacy.setup_privacy_command(bot)
        anon.setup_anon_command(bot)
        edit.setup_edit_command(bot)
        sankey.setup_sankey_command(bot)
        profile.setup_profile_command(bot)
        ask.setup_ask_command(bot)
        comment.setup_comment_command(bot)
        explore.setup_explore_command(bot)
        forum.setup_forum_command(bot)
        setup_mod_command(bot)
        
        logger.info("All commands loaded successfully")
    except (ImportError, ModuleNotFoundError, AttributeError) as e:
        logger.error(f"CRITICAL: Failed to import/load commands due to import error: {e}", exc_info=True)
        logger.error("This is likely caused by:")
        logger.error("1. Importing API_URL from utils.auth in a command file")
        logger.error("2. Calling load_dotenv() in a command file or utils/auth.py")
        logger.error("3. Accessing environment variables at module level in command files")
        raise  # Re-raise to prevent bot from starting with broken commands
    except Exception as e:
        logger.error(f"Failed to load commands: {e}", exc_info=True)
    
    # Sync slash commands with Discord
    try:
        synced = await bot.tree.sync()
        print(f'Synced {len(synced)} command(s)')
    except Exception as e:
        print(f'Failed to sync commands: {e}')


@bot.event
async def on_message(message):
    """Handle legacy !process command specifically."""
    # Ignore bot messages
    if message.author.bot:
        return
    
    # Handle legacy ! commands (!process, !explore, !forum, !forums)
    if message.content.startswith("!process"):
        # Create context and call the legacy process handler
        # Channel restrictions are checked inside the command handler via check_command_restrictions
        ctx = await bot.get_context(message)
        # Import here to avoid circular imports
        from commands.add import handle_legacy_process_command
        await handle_legacy_process_command(ctx)
        return
    elif message.content.startswith("!explore"):
        # Handle !explore command
        ctx = await bot.get_context(message)
        from commands.explore import handle_explore_command
        embed = await handle_explore_command()
        await ctx.send(embed=embed)
        return
    elif message.content.startswith("!forum") or message.content.startswith("!forums"):
        # Handle !forum or !forums command
        ctx = await bot.get_context(message)
        from commands.forum import handle_forum_command
        embed = await handle_forum_command()
        await ctx.send(embed=embed)
        return
    
    # Process other commands normally
    # Channel restrictions are checked inside each command handler via check_command_restrictions
    await bot.process_commands(message)


@bot.event
async def on_command_error(ctx: commands.Context, error: commands.CommandError):
    """Handle command errors, including command not found with fuzzy suggestions."""
    # Ignore errors for commands that have their own error handling
    if hasattr(ctx.command, 'on_error'):
        return
    
    # Handle command not found with fuzzy suggestions
    if isinstance(error, commands.CommandNotFound):
        # Get all available command names
        command_names = [cmd.name for cmd in bot.commands]
        
        # Extract the attempted command name from the message
        message_content = ctx.message.content
        if message_content.startswith(bot_prefix):
            attempted_command = message_content[len(bot_prefix):].split()[0] if message_content[len(bot_prefix):].split() else ""
        else:
            attempted_command = ""
        
        # Get fuzzy suggestions
        from utils.fuzzy import fuzzy_match_command, format_suggestions
        from utils.embeds import create_error_embed
        
        suggestions = fuzzy_match_command(attempted_command, command_names, n=3, cutoff=0.5)
        
        # Build error message
        error_message = f"Command `{attempted_command}` not found."
        fields = []
        
        if suggestions:
            suggestion_text = format_suggestions(suggestions, "command")
            fields.append({"name": "💡 Suggestion", "value": suggestion_text, "inline": False})
        
        # Add list of all commands
        all_commands = ', '.join([f"`{cmd}`" for cmd in sorted(command_names)])
        fields.append({"name": "Available Commands", "value": all_commands, "inline": False})
        
        embed = create_error_embed(
            "Command Not Found",
            error_message,
            fields=fields
        )
        await ctx.send(embed=embed)
        return
    
    # For other errors, log them
    logger.error(f"Command error: {type(error).__name__} - {str(error)}", exc_info=error)


# Commands are now loaded and registered in on_ready() to ensure proper initialization
# See on_ready() function above for command registration


if __name__ == "__main__":
    bot.run(DISCORD_TOKEN)
