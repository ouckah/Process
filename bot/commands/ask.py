"""Ask command handler - creates questions on user profiles."""
import discord
from discord import app_commands
from discord.ext import commands
import httpx
import os
import urllib.parse

from utils.auth import get_api_url, get_frontend_url, get_user_token, api_request
from utils.embeds import create_success_embed, create_error_embed, create_usage_embed
from utils.errors import handle_command_error
from utils.logging import log_command

PREFIX = os.getenv("PREFIX", "p!")


async def get_username_from_discord_id(target_discord_id: str) -> str:
    """Get username from Discord ID."""
    api_url = get_api_url()
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            response = await client.get(f"{api_url}/api/profiles/discord/{target_discord_id}/username")
            response.raise_for_status()
            data = response.json()
            return data.get("username")
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                raise Exception("USER_NOT_REGISTERED")
            raise
        except httpx.RequestError as e:
            raise Exception(f"CONNECTION_ERROR: {str(e)}")


async def handle_ask_command(discord_id: str, username: str, target_discord_id: str, question: str) -> discord.Embed:
    """Handle ask command - create a question on a user's profile."""
    try:
        # Get auth token
        token = await get_user_token(discord_id, username)
        
        # Get target username from Discord ID
        try:
            target_username = await get_username_from_discord_id(target_discord_id)
        except Exception as e:
            error_str = str(e)
            if error_str == "USER_NOT_REGISTERED":
                return create_error_embed(
                    "User Not Registered",
                    f"This user has not registered yet. They need to use a bot command (like `{PREFIX}add`) OR register on the website to create an account first."
                )
            elif error_str.startswith("CONNECTION_ERROR"):
                return handle_command_error(e, "checking user")
            raise
        
        # Validate question
        question = question.strip()
        if not question:
            return create_usage_embed(
                f"Question cannot be empty.\n\n**Usage:** `{PREFIX}ask @user <question>`\n**Slash:** `/ask user:<user> question:<question>`",
                examples=f"{PREFIX}ask @john How did you prepare for technical interviews?\n{PREFIX}ask @jane What was your interview process like at Google?"
            )
        
        if len(question) > 2000:
            return create_error_embed(
                "Question Too Long",
                "Questions must be 2000 characters or less."
            )
        
        # Create question on profile
        api_url = get_api_url()
        encoded_username = urllib.parse.quote(target_username, safe='')
        
        try:
            response_data = await api_request(
                "POST",
                f"/api/profiles/{encoded_username}/comments",
                token,
                json={
                    "content": question,
                    "is_question": True
                }
            )
        except Exception as e:
            if isinstance(e, httpx.HTTPStatusError):
                if e.response.status_code == 404:
                    return create_error_embed(
                        "Profile Not Found",
                        f"Profile for `{target_username}` not found or not publicly accessible."
                    )
                elif e.response.status_code == 400:
                    error_detail = "Unknown error"
                    try:
                        error_data = e.response.json()
                        error_detail = error_data.get("detail", "Unknown error")
                    except:
                        pass
                    
                    if "comments are disabled" in str(error_detail).lower():
                        return create_error_embed(
                            "Comments Disabled",
                            f"Comments are disabled for `{target_username}`'s profile."
                        )
                    return create_error_embed(
                        "Failed to Create Question",
                        error_detail
                    )
            raise
        
        # Success - build response
        frontend_url = get_frontend_url()
        profile_url = f"{frontend_url}/profile/{encoded_username}"
        
        return create_success_embed(
            "Question Posted",
            f"Your question has been posted to `{target_username}`'s profile.\n\n"
            f"[View Profile]({profile_url})"
        )
    except Exception as e:
        return handle_command_error(e, "posting question")


def setup_ask_command(bot: commands.Bot):
    """Setup ask command (both slash and prefix)."""
    # Slash command
    @bot.tree.command(name="ask", description="Ask a question on someone's profile")
    @app_commands.describe(user="User to ask a question to", question="Your question")
    async def ask_command(interaction: discord.Interaction, user: discord.User, question: str):
        """Ask question: /ask user:<user> question:<question>"""
        discord_id = str(interaction.user.id)
        username = interaction.user.name
        target_discord_id = str(user.id)
        
        # Log the command
        log_command(
            command_type="slash",
            command_name="ask",
            user_id=discord_id,
            username=username,
            parsed_args={
                "target_discord_id": target_discord_id,
                "question_length": len(question)
            }
        )
        
        embed = await handle_ask_command(discord_id, username, target_discord_id, question)
        await interaction.response.send_message(embed=embed)
    
    # Prefix command
    @bot.command(name="ask")
    async def ask_command_prefix(ctx: commands.Context, *, args: str = None):
        """Ask question: p!ask @user <question>"""
        discord_id = str(ctx.author.id)
        username = ctx.author.name
        
        if not args:
            embed = create_usage_embed(
                f"**Usage:** `{PREFIX}ask @user <question>`\n**Slash:** `/ask user:<user> question:<question>`",
                examples=f"{PREFIX}ask @john How did you prepare for technical interviews?\n{PREFIX}ask @jane What was your interview process like at Google?"
            )
            await ctx.send(embed=embed)
            return
        
        # Parse arguments - expect @mention followed by question
        args = args.strip()
        target_discord_id = None
        
        # Check for mentions
        if ctx.message.mentions:
            mentioned_user = ctx.message.mentions[0]
            target_discord_id = str(mentioned_user.id)
            # Remove mention from question text
            question = args.replace(f"<@{mentioned_user.id}>", "").replace(f"<@!{mentioned_user.id}>", "").strip()
        else:
            # Check for mention format
            import re
            mention_pattern = r'<@!?(\d+)>'
            match = re.match(mention_pattern, args)
            if match:
                target_discord_id = match.group(1)
                question = args[match.end():].strip()
            else:
                embed = create_usage_embed(
                    f"You must mention a user.\n\n**Usage:** `{PREFIX}ask @user <question>`\n**Slash:** `/ask user:<user> question:<question>`",
                    examples=f"{PREFIX}ask @john How did you prepare for technical interviews?\n{PREFIX}ask @jane What was your interview process like at Google?"
                )
                await ctx.send(embed=embed)
                return
        
        if not target_discord_id:
            embed = create_usage_embed(
                f"You must mention a user.\n\n**Usage:** `{PREFIX}ask @user <question>`\n**Slash:** `/ask user:<user> question:<question>`",
                examples=f"{PREFIX}ask @john How did you prepare for technical interviews?\n{PREFIX}ask @jane What was your interview process like at Google?"
            )
            await ctx.send(embed=embed)
            return
        
        # Log the command
        log_command(
            command_type="prefix",
            command_name="ask",
            user_id=discord_id,
            username=username,
            raw_args=args,
            parsed_args={
                "target_discord_id": target_discord_id,
                "question_length": len(question) if question else 0
            }
        )
        
        embed = await handle_ask_command(discord_id, username, target_discord_id, question)
        await ctx.send(embed=embed)
