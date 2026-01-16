"""Forum command handler - links to forum page with OG image."""
import discord
from discord import app_commands
from discord.ext import commands
import os

from utils.auth import get_frontend_url
from utils.embeds import create_info_embed
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")


async def handle_forum_command() -> discord.Embed:
    """Handle forum command - show link to forum page with OG image."""
    frontend_url = get_frontend_url()
    forum_url = f"{frontend_url}/forum"
    og_image_url = f"{frontend_url}/og-image.png"
    
    embed = discord.Embed(
        title="💬 Forum",
        description=f"Discuss job application processes, share experiences, and get advice from the community.\n\n[View Forum]({forum_url})",
        url=forum_url,
        color=0x5865F2
    )
    
    # Add OG image
    embed.set_image(url=og_image_url)
    
    embed.set_footer(text=f"Visit {forum_url} to join discussions")
    embed.timestamp = discord.utils.utcnow()
    
    return embed


def setup_forum_command(bot: commands.Bot):
    """Setup forum command (both slash and prefix)."""
    # Slash command
    @bot.tree.command(name="forum", description="Link to the forum page to discuss processes")
    async def forum_command(interaction: discord.Interaction):
        """Forum: /forum"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="forum",
            user_id=discord_id,
            username=username
        )
        
        embed = await handle_forum_command()
        await interaction.response.send_message(embed=embed)
    
    # Prefix command
    @bot.command(name="forum", aliases=["forums", "!forum", "!forums"])
    async def forum_command_prefix(ctx: commands.Context):
        """Forum: p!forum, p!forums, !forum, or !forums"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="forum",
            user_id=discord_id,
            username=username
        )
        
        embed = await handle_forum_command()
        await ctx.send(embed=embed)
