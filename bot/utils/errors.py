"""Error handling utilities for Discord bot commands."""
import httpx
import traceback
from discord import Embed
from utils.embeds import create_error_embed


def handle_command_error(e: Exception, command_name: str) -> Embed:
    """
    Handle errors from command execution and return an appropriate error embed.
    
    Args:
        e: The exception that occurred
        command_name: Name of the command (e.g., "adding process", "deleting process")
    
    Returns:
        A Discord embed with the error message
    """
    if isinstance(e, httpx.HTTPStatusError):
        # Handle HTTP errors (API responses)
        try:
            if e.response.content:
                error_data = e.response.json()
                if isinstance(error_data, dict):
                    error_msg = error_data.get("detail", str(error_data))
                else:
                    error_msg = str(error_data)
            else:
                error_msg = f"HTTP {e.response.status_code}: {e.response.reason_phrase}"
        except Exception:
            error_msg = f"HTTP {e.response.status_code}: {e.response.reason_phrase}"
        
        return create_error_embed("Error", error_msg)
    else:
        # Handle general exceptions
        error_trace = traceback.format_exc()
        print(f"Error {command_name}: {error_trace}")
        error_msg = str(e) if str(e) else f"Unknown error: {type(e).__name__}"
        return create_error_embed("Error", f"Error {command_name}: {error_msg}")

