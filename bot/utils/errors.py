"""Error handling utilities for Discord bot commands."""
import httpx
import logging
from discord import Embed
from utils.embeds import create_error_embed

logger = logging.getLogger(__name__)


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
        
        logger.warning(f"API error {command_name}: {e.response.status_code} - {error_msg}")
        return create_error_embed("Error", error_msg)
    elif isinstance(e, (httpx.ConnectTimeout, httpx.ReadTimeout, httpx.TimeoutException)):
        # Handle connection/timeout errors with user-friendly messages
        logger.error(f"Connection timeout {command_name}: {type(e).__name__}")
        return create_error_embed(
            "Connection Error",
            "Unable to connect to the API server. The service may be temporarily unavailable. Please try again later."
        )
    elif isinstance(e, httpx.ConnectError):
        # Handle general connection errors
        logger.error(f"Connection error {command_name}: {type(e).__name__} - {str(e)}")
        return create_error_embed(
            "Connection Error",
            "Unable to connect to the API server. Please check your network connection and try again."
        )
    elif isinstance(e, httpx.RequestError):
        # Handle other HTTP request errors
        logger.error(f"Request error {command_name}: {type(e).__name__} - {str(e)}")
        error_msg = str(e) if str(e) else f"Request failed: {type(e).__name__}"
        return create_error_embed("Request Error", error_msg)
    else:
        # Handle general exceptions
        logger.error(f"Error {command_name}: {type(e).__name__} - {str(e)}", exc_info=True)
        error_msg = str(e) if str(e) else f"Unknown error: {type(e).__name__}"
        return create_error_embed("Error", f"Error {command_name}: {error_msg}")

