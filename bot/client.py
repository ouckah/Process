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
        from commands import mod
        
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
        mod.setup_mod_command(bot)
        
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


def check_channel_restrictions(guild_id: str, channel_id: int, message: discord.Message = None) -> bool:
    """
    Check if a channel is allowed for bot commands.
    
    Args:
        guild_id: The guild ID
        channel_id: The channel ID
        message: Optional message object to check if it's a moderator command
    
    Returns:
        True if channel is allowed, False if denied/restricted
    """
    from utils.config import guild_config
    
    if not guild_id:
        # DMs are always allowed
        return True
    
    # Check if this is a moderator command - moderators can always use mod commands
    # even in denied channels (to fix misconfigurations)
    if message and message.guild:
        # Check if message starts with mod command
        bot_prefix = os.getenv("PREFIX", "p!")
        if message.content.startswith(bot_prefix + "mod") or message.content.startswith("/mod"):
            # Check if user has manage_guild permission
            if message.author.guild_permissions.manage_guild:
                return True
    
    config = guild_config.get_config(guild_id)
    allowed = config.get("allowed_channels", [])
    denied = config.get("denied_channels", [])
    
    # If channel is explicitly denied, block it
    if channel_id in denied:
        return False
    
    # If allowed list exists and is not empty, only allow those channels
    if allowed:
        return channel_id in allowed
    
    # If no restrictions set, allow all channels
    return True


@bot.event
async def on_message(message):
    """Handle legacy !process command specifically and check channel restrictions."""
    # Ignore bot messages
    if message.author.bot:
        return
    
    # Check channel restrictions (skip for DMs)
    if message.guild:
        guild_id = str(message.guild.id)
        channel_id = message.channel.id
        
        if not check_channel_restrictions(guild_id, channel_id, message):
            # Silently ignore commands in restricted channels
            return
    
    # Only handle !process, not other ! commands
    if message.content.startswith("!process"):
        # Create context and call the legacy process handler
        ctx = await bot.get_context(message)
        # Import here to avoid circular imports
        from commands.add import handle_legacy_process_command
        await handle_legacy_process_command(ctx)
        return
    
    # Process other commands normally
    await bot.process_commands(message)


# Commands are now loaded and registered in on_ready() to ensure proper initialization
# See on_ready() function above for command registration


if __name__ == "__main__":
    bot.run(DISCORD_TOKEN)
