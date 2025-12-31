"""Autocomplete functions for Discord bot."""
from discord import app_commands

from utils.constants import VALID_STAGE_NAMES


async def stage_name_autocomplete(interaction, current: str):
    """Autocomplete for stage names."""
    choices = [
        app_commands.Choice(name=name, value=name)
        for name in VALID_STAGE_NAMES
        if name != 'Other' and current.lower() in name.lower()
    ]
    # If no matches, show all valid names (except Other)
    if not choices:
        choices = [
            app_commands.Choice(name=name, value=name)
            for name in VALID_STAGE_NAMES
            if name != 'Other'
        ]
    # Limit to 25 choices (Discord limit)
    return choices[:25]

