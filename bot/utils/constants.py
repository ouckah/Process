"""Constants for the Discord bot."""

# Valid stage names matching the web app dropdown
VALID_STAGE_NAMES = [
    'Applied',
    'OA',
    'Phone Screen',
    'Technical Interview',
    'HM Interview',
    'Final Interview',
    'On-site Interview',
    'Take-home Assignment',
    'System Design',
    'Behavioral Interview',
    'Coding Challenge',
    'Reject',
    'Offer',
    'Other',  # Custom stages are allowed but should be handled differently
]

# Default prefix (can be overridden by environment variable in client.py)
DEFAULT_PREFIX = "p!"


def match_stage_name(input_stage: str) -> str | None:
    """
    Match a stage name input to a valid stage name.
    Supports partial matching (e.g., "Phone" -> "Phone Screen", "Technical" -> "Technical Interview").
    
    Args:
        input_stage: The stage name input from the user (case-insensitive)
    
    Returns:
        The matched full stage name, or None if no match found
    """
    input_lower = input_stage.lower().strip()
    
    # Create lookup dictionary for exact matches
    exact_lookup = {name.lower(): name for name in VALID_STAGE_NAMES}
    
    # First, try exact match
    if input_lower in exact_lookup:
        return exact_lookup[input_lower]
    
    # Try word-by-word prefix matching (e.g., "Phone" matches "Phone Screen")
    # This allows users to type "Phone" instead of "Phone Screen"
    input_words = input_lower.split()
    matches = []
    
    for stage_name in VALID_STAGE_NAMES:
        if stage_name == 'Other':
            continue  # Skip "Other" as it's not supported via bot commands
        
        stage_lower = stage_name.lower()
        stage_words = stage_lower.split()
        
        # Check if all input words match the beginning of stage words
        if len(input_words) <= len(stage_words):
            if all(input_words[i] == stage_words[i] for i in range(len(input_words))):
                matches.append((len(stage_name), stage_name))
    
    if matches:
        # Sort by length (longest first) to prefer more specific matches
        # If multiple matches, prefer the longest one
        matches.sort(reverse=True)
        return matches[0][1]
    
    return None

