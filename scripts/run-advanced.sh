#!/bin/bash

# Set up environment variables from .env file if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Create required directories for data and logs if they don't exist
mkdir -p data/archive data/templates logs

# Print startup message
echo "Starting Email LLM Processor..."
echo "This script will set up and run the Email LLM Processor with advanced features."

# Print configuration
echo "
Configuration:"
echo "- Email Host: ${EMAIL_HOST:-localhost}"
echo "- Email Port: ${EMAIL_PORT:-1025}"
echo "- LLM API URL: ${LLM_API_URL:-http://localhost:11434}"
echo "- LLM Model: ${LLM_MODEL:-llama2}"
echo "- Database Path: ${DATABASE_PATH:-data/emails.db}"
echo "- Archive Path: data/archive"
echo "- Templates Path: data/templates"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "
WARNING: Docker is not running or not installed.
If you're using Docker, please start Docker first.
If you're running without Docker, make sure all dependencies are installed.
"
  sleep 2
fi

# Check if Docker Compose files exist
if [ -f docker-compose.yml ]; then
  echo "
Starting services with Docker Compose..."
  docker-compose up -d

  # Wait for services to be ready
  echo "Waiting for services to be ready..."
  sleep 5

  # Check if containers are running
  if docker-compose ps | grep -q "Up"; then
    echo "Docker containers are running!"
  else
    echo "WARNING: Some containers might not be running. Check with 'docker-compose ps'"
  fi
else
  echo "
No Docker Compose file found. Running in standalone mode..."

  # Initialize the application with setup script
  echo "Running setup script to initialize templates and database..."
  node scripts/setup.js

  # Start the application
  echo "Starting the application..."
  npm start
fi

# Provide instructions for testing
echo "
=========================================================================================
Email LLM Processor is running!
=========================================================================================

- Access the web interface: http://localhost:8080
- MailHog (test email server): http://localhost:8025
- Adminer (database management): http://localhost:8081

To test the application, you can:
1. Send an email to ${EMAIL_USER:-test@example.com} using MailHog
2. Use the test script: ./test-email.sh [positive|negative|urgent|neutral]
3. Use the API: curl -X POST http://localhost:8080/api/emails/process -H 'Content-Type: application/json' -d '{
   \"from\": \"test@example.com\",
   \"to\": \"${EMAIL_USER:-test@example.com}\",
   \"subject\": \"Test wiadomości\",
   \"content\": \"To jest testowa wiadomość do przetworzenia przez system.\"
}'

Available templates:
- default.template: Standard response
- frequent_sender.template: Response for frequent senders
- negative_repeated.template: Response for repeated negative feedback
- urgent_critical.template: Response for urgent messages

You can view templates with:
curl http://localhost:8080/api/templates

To stop the application, press Ctrl+C or run 'docker-compose down' if using Docker.
=========================================================================================
"

# Wait for user to stop the application if running in Docker mode
if [ -f docker-compose.yml ]; then
  echo "Press Ctrl+C to stop viewing logs (services will keep running)"
  echo "To completely stop all services, use 'docker-compose down'"

  # Show logs
  docker-compose logs -f
else
  # In standalone mode, the application is already running in the foreground
  # with npm start, so we don't need to do anything else
  :
fi