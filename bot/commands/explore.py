"""Explore command handler - links to explore page with OG image."""
import discord
from discord import app_commands
from discord.ext import commands
import os

from utils.auth import get_frontend_url
from utils.embeds import create_info_embed
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")


async def handle_explore_command() -> discord.Embed:
    """Handle explore command - show link to explore page with OG image."""
    frontend_url = get_frontend_url()
    explore_url = f"{frontend_url}/explore"
    og_image_url = f"{frontend_url}/og-image.png"
    
    embed = discord.Embed(
        title="🔍 Explore Processes",
        description=f"Discover and learn from public job application processes shared by the community.\n\n[View Explore Page]({explore_url})",
        url=explore_url,
        color=0x4f46e5
    )
    
    # Add OG image
    embed.set_image(url=og_image_url)
    
    embed.set_footer(text=f"Visit {explore_url} to explore processes")
    embed.timestamp = discord.utils.utcnow()
    
    return embed


def setup_explore_command(bot: commands.Bot):
    """Setup explore command (both slash and prefix)."""
    # Slash command
    @bot.tree.command(name="explore", description="Link to the explore page to discover public processes")
    async def explore_command(interaction: discord.Interaction):
        """Explore: /explore"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="explore",
            user_id=discord_id,
            username=username
        )
        
        embed = await handle_explore_command()
        await interaction.response.send_message(embed=embed)
    
    # Prefix command
    @bot.command(name="explore", aliases=["!explore"])
    async def explore_command_prefix(ctx: commands.Context):
        """Explore: p!explore or !explore"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="explore",
            user_id=discord_id,
            username=username
        )
        
        embed = await handle_explore_command()
        await ctx.send(embed=embed)
