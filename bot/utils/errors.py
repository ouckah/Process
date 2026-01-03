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
    # Check for import/module errors first (these are often misidentified as connection errors)
    if isinstance(e, (ImportError, ModuleNotFoundError, AttributeError)):
        error_msg = str(e) if str(e) else f"{type(e).__name__}"
        logger.error(f"Import/Module error {command_name}: {type(e).__name__} - {error_msg}", exc_info=True)
        return create_error_embed(
            "Configuration Error",
            f"Bot configuration error: {error_msg}\n\nThis is likely an import or environment variable issue. Please contact the bot administrator."
        )
    
    # Check for environment variable issues
    error_str = str(e).lower()
    if "api_url" in error_str or "environment" in error_str or "dotenv" in error_str or "load_dotenv" in error_str:
        logger.error(f"Environment/Config error {command_name}: {type(e).__name__} - {str(e)}", exc_info=True)
        return create_error_embed(
            "Configuration Error",
            f"Bot configuration error: {str(e)}\n\nThis appears to be an environment variable or import configuration issue. Please contact the bot administrator."
        )
    
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
        logger.error(f"Connection timeout {command_name}: {type(e).__name__} - {str(e)}")
        return create_error_embed(
            "Connection Timeout",
            "The API server did not respond in time. The service may be temporarily unavailable. Please try again later."
        )
    elif isinstance(e, httpx.ConnectError):
        # Handle general connection errors
        error_str_lower = str(e).lower()
        # Check if it's actually an import/config issue masquerading as connection error
        if "api_url" in error_str_lower or "name resolution" in error_str_lower or "nodename" in error_str_lower:
            logger.error(f"Configuration error (ConnectError) {command_name}: {type(e).__name__} - {str(e)}", exc_info=True)
            return create_error_embed(
                "Configuration Error",
                f"Bot configuration error: Unable to resolve API URL. This is likely an environment variable configuration issue. Please contact the bot administrator.\n\nError: {str(e)}"
            )
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
        # Handle general exceptions - check for import/config issues in the error message
        error_str_lower = str(e).lower()
        if any(keyword in error_str_lower for keyword in ["import", "module", "api_url", "dotenv", "environment", "attribute"]):
            logger.error(f"Configuration/Import error {command_name}: {type(e).__name__} - {str(e)}", exc_info=True)
            return create_error_embed(
                "Configuration Error",
                f"Bot configuration error: {str(e)}\n\nThis appears to be an import or environment variable configuration issue. Please contact the bot administrator."
            )
        logger.error(f"Error {command_name}: {type(e).__name__} - {str(e)}", exc_info=True)
        error_msg = str(e) if str(e) else f"Unknown error: {type(e).__name__}"
        return create_error_embed("Error", f"Error {command_name}: {error_msg}")

