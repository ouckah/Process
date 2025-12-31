#!/usr/bin/env python3
"""
Script to start the FastAPI server.
Usage: python scripts/start_api.py [--host HOST] [--port PORT]
"""

import sys
import os
import subprocess
import argparse
from pathlib import Path

# Get project root (parent of scripts directory)
SCRIPT_DIR = Path(__file__).parent
PROJECT_ROOT = SCRIPT_DIR.parent

# Change to project root
os.chdir(PROJECT_ROOT)

# Check if venv exists
venv_python = PROJECT_ROOT / "venv" / "bin" / "python"
if not venv_python.exists():
    print("Error: venv not found. Please create a virtual environment first.")
    sys.exit(1)

# Parse arguments
parser = argparse.ArgumentParser(description="Start the FastAPI server")
parser.add_argument("--host", default="0.0.0.0", help="Host to bind to (default: 0.0.0.0)")
parser.add_argument("--port", type=int, default=8000, help="Port to bind to (default: 8000)")
args = parser.parse_args()

print("Starting FastAPI server...")
print(f"Host: {args.host}")
print(f"Port: {args.port}")
print(f"API Docs: http://localhost:{args.port}/docs")
print()
print("Press Ctrl+C to stop the server")
print()

# Start uvicorn
try:
    subprocess.run([
        str(venv_python), "-m", "uvicorn",
        "api.server:app",
        "--host", args.host,
        "--port", str(args.port),
        "--reload"
    ])
except KeyboardInterrupt:
    print("\nServer stopped.")

