"""Fuzzy matching utilities for command and stage name suggestions."""
from difflib import get_close_matches
from typing import List, Tuple, Optional


def fuzzy_match_command(input_command: str, valid_commands: List[str], n: int = 3, cutoff: float = 0.6) -> List[str]:
    """
    Find fuzzy matches for a command name.
    
    Args:
        input_command: The command name the user typed
        valid_commands: List of valid command names
        n: Maximum number of suggestions to return
        cutoff: Minimum similarity ratio (0.0 to 1.0)
    
    Returns:
        List of suggested command names, sorted by similarity
    """
    if not input_command or not valid_commands:
        return []
    
    # Use difflib's get_close_matches for fuzzy matching
    matches = get_close_matches(
        input_command.lower(),
        [cmd.lower() for cmd in valid_commands],
        n=n,
        cutoff=cutoff
    )
    
    # Map back to original case
    command_lookup = {cmd.lower(): cmd for cmd in valid_commands}
    return [command_lookup[match] for match in matches if match in command_lookup]


def fuzzy_match_stage(input_stage: str, valid_stages: List[str], n: int = 3, cutoff: float = 0.5) -> List[str]:
    """
    Find fuzzy matches for a stage name.
    
    Args:
        input_stage: The stage name the user typed
        valid_stages: List of valid stage names
        n: Maximum number of suggestions to return
        cutoff: Minimum similarity ratio (0.0 to 1.0)
    
    Returns:
        List of suggested stage names, sorted by similarity
    """
    if not input_stage or not valid_stages:
        return []
    
    # Use difflib's get_close_matches for fuzzy matching
    matches = get_close_matches(
        input_stage.lower(),
        [stage.lower() for stage in valid_stages],
        n=n,
        cutoff=cutoff
    )
    
    # Map back to original case
    stage_lookup = {stage.lower(): stage for stage in valid_stages}
    return [stage_lookup[match] for match in matches if match in stage_lookup]


def format_suggestions(suggestions: List[str], item_type: str = "command") -> str:
    """
    Format a list of suggestions into a user-friendly string.
    
    Args:
        suggestions: List of suggested names
        item_type: Type of item being suggested ("command" or "stage")
    
    Returns:
        Formatted string with suggestions, or empty string if no suggestions
    """
    if not suggestions:
        return ""
    
    if len(suggestions) == 1:
        return f"Did you mean `{suggestions[0]}`?"
    else:
        suggestions_str = ", ".join([f"`{s}`" for s in suggestions])
        return f"Did you mean: {suggestions_str}?"
