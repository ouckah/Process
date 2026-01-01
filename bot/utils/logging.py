"""Logging utilities for Discord bot commands."""
import logging
import datetime
from typing import Optional, Dict, Any

# Configure logger
logger = logging.getLogger('bot.commands')
logger.setLevel(logging.INFO)

# Create handler if it doesn't exist
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
    timestamp = datetime.datetime.utcnow().isoformat()
    
    log_parts = [
        f"[{command_type.upper()}] {command_name}",
        f"User: {username} ({user_id})",
    ]
    
    if raw_args:
        log_parts.append(f"Raw Args: {raw_args}")
    
    if parsed_args:
        parsed_str = ", ".join([f"{k}={repr(v)}" for k, v in parsed_args.items() if v is not None])
        if parsed_str:
            log_parts.append(f"Parsed: {parsed_str}")
    
    log_message = " | ".join(log_parts)
    logger.info(log_message)

