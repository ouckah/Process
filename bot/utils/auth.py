"""Authentication utilities for Discord bot."""
import os
import httpx
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:8000")


async def get_user_token(discord_id: str, username: str) -> str:
    """Get authentication token for Discord user via API."""
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{API_URL}/auth/discord/bot-token",
            json={"discord_id": discord_id, "username": username}
        )
        response.raise_for_status()
        return response.json()["access_token"]


async def api_request(method: str, endpoint: str, token: str, **kwargs):
    """Make authenticated API request."""
    async with httpx.AsyncClient() as client:
        headers = {"Authorization": f"Bearer {token}"}
        response = await client.request(method, f"{API_URL}{endpoint}", headers=headers, **kwargs)
        response.raise_for_status()
        return response.json()

