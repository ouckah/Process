"""Welcome DM utilities for new Discord users."""
import discord
import logging
import os

logger = logging.getLogger(__name__)

FRONTEND_URL = os.getenv("FRONTEND_URL", "https://processes.cc")


async def send_welcome_dm(user: discord.User) -> bool:
    """
    Send a welcome DM to a new Discord user.
    Similar content to welcome email but adapted for Discord.
    Returns True if DM was sent successfully, False otherwise.
    """
    try:
        dashboard_url = f"{FRONTEND_URL}/dashboard"
        
        embed = discord.Embed(
            title="🎉 WELCOME TO PROCESS!",
            description="Track your job applications, manage stages, and visualize your progress all in one place.",
            color=0x6366F1,  # Indigo color matching the website
            timestamp=discord.utils.utcnow()
        )
        
        # Quick Start Guide
        embed.add_field(
            name="📋 QUICK START GUIDE",
            value=(
                "**1.** CREATE A PROCESS FOR EACH JOB APPLICATION YOU'RE TRACKING\n"
                "**2.** ADD STAGES AS YOU PROGRESS THROUGH THE INTERVIEW PROCESS\n"
                "**3.** UPDATE STAGES WITH DATES AND NOTES TO KEEP TRACK OF YOUR PROGRESS\n"
                "**4.** USE THE DASHBOARD TO SEE AN OVERVIEW OF ALL YOUR APPLICATIONS"
            ),
            inline=False
        )
        
        # Commands
        embed.add_field(
            name="🤖 GETTING STARTED",
            value=(
                f"**`p!add <company> <stage>`** - Add a stage to a process\n"
                f"**`p!list`** - View all your processes\n"
                f"**`p!dashboard`** - Get your web dashboard link\n"
                f"**`p!help`** - See all available commands"
            ),
            inline=False
        )
        
        # Web Dashboard
        embed.add_field(
            name="🌐 WEB DASHBOARD",
            value=f"[Visit your dashboard]({dashboard_url}) to see detailed analytics, create processes, and manage your applications.",
            inline=False
        )
        
        embed.set_footer(text="Process - Job Application Tracker")
        
        await user.send(embed=embed)
        logger.info(f"Welcome DM sent to Discord user {user.id} ({user.name})")
        return True
        
    except discord.Forbidden:
        # User has DMs disabled
        logger.warning(f"Cannot send welcome DM to user {user.id}: DMs are disabled")
        return False
    except discord.HTTPException as e:
        logger.error(f"Failed to send welcome DM to user {user.id}: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending welcome DM to user {user.id}: {e}")
        return False


