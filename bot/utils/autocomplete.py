"""Autocomplete functions for Discord bot."""
from discord import app_commands

from utils.constants import VALID_STAGE_NAMES


async def stage_name_autocomplete(interaction, current: str):
    """Autocomplete for stage names with fuzzy matching."""
    if not current:
        # If no input, show all valid names (except Other)
        choices = [
            app_commands.Choice(name=name, value=name)
            for name in VALID_STAGE_NAMES
            if name != 'Other'
        ]
        return choices[:25]
    
    current_lower = current.lower()
    valid_stages = [name for name in VALID_STAGE_NAMES if name != 'Other']
    
    # First, try substring matches (exact or contains)
    substring_matches = [
        name for name in valid_stages
        if current_lower in name.lower()
    ]
    
    # If we have substring matches, use those (prioritize exact/prefix matches)
    if substring_matches:
        # Sort by: exact match first, then prefix matches, then contains
        def sort_key(name):
            name_lower = name.lower()
            if name_lower == current_lower:
                return (0, len(name))  # Exact match, prefer shorter
            elif name_lower.startswith(current_lower):
                return (1, len(name))  # Prefix match, prefer shorter
            else:
                return (2, name_lower.find(current_lower), len(name))  # Contains, prefer earlier position
        
        substring_matches.sort(key=sort_key)
        choices = [
            app_commands.Choice(name=name, value=name)
            for name in substring_matches
        ]
    else:
        # No substring matches - use fuzzy matching
        from utils.fuzzy import fuzzy_match_stage
        fuzzy_matches = fuzzy_match_stage(current, valid_stages, n=25, cutoff=0.4)
        choices = [
            app_commands.Choice(name=name, value=name)
            for name in fuzzy_matches
        ]
    
    # Limit to 25 choices (Discord limit)
    return choices[:25]

