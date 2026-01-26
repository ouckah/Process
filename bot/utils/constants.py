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


def match_stage_name(input_stage: str) -> tuple:
    """
    Match a stage name input to a valid stage name.
    Supports partial matching (e.g., "Phone" -> "Phone Screen", "Technical" -> "Technical Interview").
    Also supports aliases (e.g., "apply" -> "Applied").
    Uses fuzzy matching as a fallback to suggest similar stage names.
    
    Args:
        input_stage: The stage name input from the user (case-insensitive)
    
    Returns:
        Tuple of (matched_stage_name, suggestions)
        - matched_stage_name: The matched full stage name, or None if no match found
        - suggestions: List of suggested stage names if no exact match (fuzzy matching)
    """
    input_lower = input_stage.lower().strip()
    
    # Stage name aliases (common variations)
    aliases = {
        'apply': 'Applied',
    }
    
    # Check aliases first
    if input_lower in aliases:
        return aliases[input_lower], []
    
    # Create lookup dictionary for exact matches
    exact_lookup = {name.lower(): name for name in VALID_STAGE_NAMES}
    
    # First, try exact match
    if input_lower in exact_lookup:
        return exact_lookup[input_lower], []
    
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
        return matches[0][1], []
    
    # No exact or prefix match found - try fuzzy matching for suggestions
    from utils.fuzzy import fuzzy_match_stage
    valid_stages = [name for name in VALID_STAGE_NAMES if name != 'Other']
    suggestions = fuzzy_match_stage(input_stage, valid_stages, n=3, cutoff=0.5)
    
    return None, suggestions

