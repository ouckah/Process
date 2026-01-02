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

