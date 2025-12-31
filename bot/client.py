import discord
import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Add parent directory to path for api module imports
# When root is 'bot', files are in /app/, api is at /app/../api/
parent_dir = Path(__file__).parent.parent
if str(parent_dir) not in sys.path:
    sys.path.insert(0, str(parent_dir))

from database import get_db, get_or_create_discord_user

load_dotenv()


class Client(discord.Client):
    async def on_ready(self):
        print(f'Logged in as {self.user}')

    async def on_message(self, message):
        if message.author == self.user:
            return

        # Get or create user account for Discord user
        # This ensures every Discord user has an account (ghost account if first time)
        db = next(get_db())
        try:
            discord_id = str(message.author.id)
            username = message.author.name
            user = get_or_create_discord_user(db, discord_id, username)
            print(f"User account: {user.id} (discord_id: {discord_id}, email: {user.email})")
        except Exception as e:
            print(f"Error getting/creating user: {e}")
        finally:
            db.close()

        if message.content.startswith('!hello'):
            await message.channel.send('Hello!')


intents = discord.Intents.default()
intents.message_content = True

client = Client(intents=intents)
client.run(os.getenv('DISCORD_TOKEN'))