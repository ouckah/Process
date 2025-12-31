#!/bin/bash

# Script to start the FastAPI server
# Usage: ./scripts/start_api.sh [--host HOST] [--port PORT]

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/.." && pwd )"

# Change to project root
cd "$PROJECT_ROOT"

# Activate virtual environment
if [ -d "venv" ]; then
    source venv/bin/activate
else
    echo "Error: venv not found. Please create a virtual environment first."
    exit 1
fi

# Default values
HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --host)
            HOST="$2"
            shift 2
            ;;
        --port)
            PORT="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--host HOST] [--port PORT]"
            exit 1
            ;;
    esac
done

echo "Starting FastAPI server..."
echo "Host: $HOST"
echo "Port: $PORT"
echo "API Docs: http://localhost:$PORT/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

# Start the server
uvicorn api.server:app --host "$HOST" --port "$PORT" --reload

