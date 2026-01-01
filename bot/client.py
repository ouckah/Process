"""Main Discord bot client."""
import discord
from discord.ext import commands
import os
import logging
from dotenv import load_dotenv

from utils.constants import DEFAULT_PREFIX
from utils.autocomplete import stage_name_autocomplete
from commands import add, delete
from commands import list as list_command
# Don't import dashboard at module level - it breaks network connectivity for unknown reasons
# from commands import dashboard
from utils.auth import API_URL

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
logger.info(f"Bot configured to use API URL: {API_URL}")

intents = discord.Intents.default()
intents.message_content = True

# Allow PREFIX to be overridden by environment variable
bot_prefix = os.getenv("PREFIX", DEFAULT_PREFIX)

bot = commands.Bot(command_prefix=bot_prefix, intents=intents)


@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}')
    
    # Lazy load dashboard command - importing at module level breaks network connectivity
    # This is a workaround for an unknown issue where importing dashboard module
    # prevents the bot from connecting to the API via private networking
    try:
        from commands import dashboard
        dashboard.setup_dashboard_command(bot)
        logger.info("Dashboard command loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load dashboard command: {e}")
    
    try:
        synced = await bot.tree.sync()
        print(f'Synced {len(synced)} command(s)')
    except Exception as e:
        print(f'Failed to sync commands: {e}')


@bot.event
async def on_message(message):
    """Handle legacy !process command specifically."""
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


# Setup commands
add.setup_add_command(bot, stage_name_autocomplete)
delete.setup_delete_command(bot)
list_command.setup_list_command(bot)
# Dashboard command setup moved to on_ready() to avoid import-time issues


if __name__ == "__main__":
    bot.run(DISCORD_TOKEN)
