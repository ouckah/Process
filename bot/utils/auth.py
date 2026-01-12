"""Authentication utilities for Discord bot."""
import os
import httpx
import logging

# WARNING: Do NOT import API_URL from this module in command files!
# It causes import-time issues. Use get_api_url() function instead, or os.getenv("API_URL") directly.
# Note: load_dotenv() is called ONCE in client.py. Do NOT call it here or in any command files.
# DO NOT access os.getenv() at module level - always use get_api_url() function.

TIMEOUT = 10.0  # 10 second timeout for API requests

logger = logging.getLogger(__name__)


def get_api_url() -> str:
    """
    Get API URL from environment variable.
    Use this function instead of importing API_URL constant to avoid import-time issues.
    
    Handles Railway internal URLs by converting them to public URLs when needed.
    """
    api_url = os.getenv("API_URL", "http://localhost:8000")
    
    # If Railway internal URL, try to convert to public URL
    # Railway internal URLs use .railway.internal domain which is only accessible within Railway's private network
    if ".railway.internal" in api_url:
        # Try to get the public URL from RAILWAY_PUBLIC_DOMAIN or construct from service name
        public_domain = os.getenv("RAILWAY_PUBLIC_DOMAIN")
        if public_domain:
            # Replace internal domain with public domain
            api_url = api_url.replace(".railway.internal", public_domain)
            # Ensure HTTPS for public URLs
            if not api_url.startswith("https://"):
                api_url = api_url.replace("http://", "https://")
            logger.info(f"Converted Railway internal URL to public URL: {api_url}")
        else:
            # If no public domain set, try to extract from service name
            # Railway internal URLs are like: http://service-name.railway.internal:port
            # Try using RAILWAY_STATIC_URL or construct from service
            railway_static_url = os.getenv("RAILWAY_STATIC_URL")
            if railway_static_url:
                # Use the static URL if available
                api_url = railway_static_url
                logger.info(f"Using Railway static URL: {api_url}")
            else:
                logger.warning(f"Using Railway internal URL {api_url} - this may not be accessible. Set RAILWAY_PUBLIC_DOMAIN or use public API_URL.")
    
    return api_url


def get_frontend_url() -> str:
    """
    Get frontend URL from environment variable.
    Use this function instead of directly accessing os.getenv() to avoid import-time issues.
    """
    return os.getenv("FRONTEND_URL", "http://localhost:3000")


async def get_user_token(discord_id: str, username: str) -> str:
    """Get authentication token for Discord user via API."""
    api_url = get_api_url()  # Get URL at function call time, not import time
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            response = await client.post(
                f"{api_url}/auth/discord/bot-token",
                json={"discord_id": discord_id, "username": username}
            )
            response.raise_for_status()
            return response.json()["access_token"]
        except httpx.RequestError as e:
            logger.error(f"Failed to get user token from {api_url}: {type(e).__name__}")
            raise


async def api_request(method: str, endpoint: str, token: str, **kwargs):
    """Make authenticated API request."""
    api_url = get_api_url()  # Get URL at function call time, not import time
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        headers = {"Authorization": f"Bearer {token}"}
        try:
            response = await client.request(method, f"{api_url}{endpoint}", headers=headers, **kwargs)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            logger.error(f"API request failed: {method} {api_url}{endpoint} - {type(e).__name__}")
            raise

