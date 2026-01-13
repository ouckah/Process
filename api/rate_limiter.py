"""
Shared rate limiter instance for the API.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

# Create a global limiter instance
limiter = Limiter(key_func=get_remote_address, default_limits=["200/hour"])
