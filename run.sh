#!/bin/bash

# Set up environment variables from .env file if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Create a directory for the database if it doesn't exist
mkdir -p data

# Print startup message
echo "Starting Email LLM Processor..."
echo "This is a simplified run script for demonstration purposes."

# Print configuration
echo "
Configuration:"
echo "- Email Host: ${EMAIL_HOST:-localhost}"
echo "- Email Port: ${EMAIL_PORT:-1025}"
echo "- LLM API URL: ${LLM_API_URL:-http://localhost:11434}"
echo "- Database Path: ${DATABASE_PATH:-data/emails.db}"

# Simulate application startup
echo "
Initializing Email LLM Processor..."
echo "- Initializing database connection"
echo "- Setting up email routes"
echo "- Connecting to LLM service"

echo "
Email LLM Processor is running!"
echo "- Listening for incoming emails on ${EMAIL_HOST:-localhost}:${EMAIL_PORT:-1025}"
echo "- Ready to process and analyze emails"

# Keep the script running
echo "
Press Ctrl+C to stop the application"
tail -f /dev/null
