"""Main Discord bot client."""
import discord
from discord.ext import commands
import os
from dotenv import load_dotenv

from utils.constants import DEFAULT_PREFIX
from utils.autocomplete import stage_name_autocomplete
from commands import add, delete
from commands import list as list_command

load_dotenv()

DISCORD_TOKEN = os.getenv("DISCORD_TOKEN")
if not DISCORD_TOKEN:
    raise ValueError("DISCORD_TOKEN environment variable is not set")

intents = discord.Intents.default()
intents.message_content = True

# Allow PREFIX to be overridden by environment variable
bot_prefix = os.getenv("PREFIX", DEFAULT_PREFIX)
bot = commands.Bot(command_prefix=bot_prefix, intents=intents)


@bot.event
async def on_ready():
    print(f'Logged in as {bot.user}')
    try:
        synced = await bot.tree.sync()
        print(f'Synced {len(synced)} command(s)')
    except Exception as e:
        print(f'Failed to sync commands: {e}')


# Setup commands
add.setup_add_command(bot, stage_name_autocomplete)
delete.setup_delete_command(bot)
list_command.setup_list_command(bot)


if __name__ == "__main__":
    bot.run(DISCORD_TOKEN)
