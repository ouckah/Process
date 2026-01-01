"""Logging utilities for Discord bot commands."""
import logging
from typing import Optional, Dict, Any

# Get or create logger - use root logger to ensure logs are visible
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Ensure handler exists (may already be set up by basicConfig in client.py)
if not logger.handlers:
    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)
    
    # Create formatter
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)s | %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    handler.setFormatter(formatter)
    logger.addHandler(handler)


def log_command(
    command_type: str,  # 'prefix' or 'slash'
    command_name: str,
    user_id: str,
    username: str,
    raw_args: Optional[str] = None,
    parsed_args: Optional[Dict[str, Any]] = None
):
    """
    Log a command execution with all relevant information.
    
    Args:
        command_type: 'prefix' or 'slash'
        command_name: Name of the command (e.g., 'add', 'delete', 'list')
        user_id: Discord user ID
        username: Discord username
        raw_args: Raw command arguments (for prefix commands)
        parsed_args: Dictionary of parsed argument names and values
    """
    # Build single-line log message
    parts = [f"{command_type.upper()}/{command_name}", f"user={username}({user_id})"]
    
    if raw_args:
        parts.append(f"raw={raw_args}")
    
    if parsed_args:
        parsed_items = [f"{k}={repr(v)}" for k, v in parsed_args.items() if v is not None]
        if parsed_items:
            parts.append(f"parsed=[{', '.join(parsed_items)}]")
    
    log_message = " | ".join(parts)
    logger.info(log_message)

