"""Authentication utilities for Discord bot."""
import os
import httpx
import logging
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:8000")
TIMEOUT = 10.0  # 10 second timeout for API requests

logger = logging.getLogger(__name__)


async def get_user_token(discord_id: str, username: str) -> str:
    """Get authentication token for Discord user via API."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        try:
            response = await client.post(
                f"{API_URL}/auth/discord/bot-token",
                json={"discord_id": discord_id, "username": username}
            )
            response.raise_for_status()
            return response.json()["access_token"]
        except httpx.RequestError as e:
            logger.error(f"Failed to get user token from {API_URL}: {type(e).__name__}")
            raise


async def api_request(method: str, endpoint: str, token: str, **kwargs):
    """Make authenticated API request."""
    async with httpx.AsyncClient(timeout=TIMEOUT) as client:
        headers = {"Authorization": f"Bearer {token}"}
        try:
            response = await client.request(method, f"{API_URL}{endpoint}", headers=headers, **kwargs)
            response.raise_for_status()
            return response.json()
        except httpx.RequestError as e:
            logger.error(f"API request failed: {method} {API_URL}{endpoint} - {type(e).__name__}")
            raise

