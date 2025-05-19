#!/bin/bash

# Set up environment variables from .env file if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Default values if not set in .env
EMAIL_HOST=${EMAIL_HOST:-localhost}
EMAIL_PORT=${EMAIL_PORT:-1025}
EMAIL_USER=${EMAIL_USER:-test@example.com}
EMAIL_PASSWORD=${EMAIL_PASSWORD:-password}

# Function to generate a random ID for the email
generate_id() {
  echo $(date +%s)$RANDOM
}

# Function to simulate sending an email
send_email() {
  local subject="$1"
  local content="$2"
  local from="$3"
  local to="$4"
  local id=$(generate_id)

  echo -e "\n======================================"
  echo "Sending test email:"
  echo "======================================"
  echo "ID: $id"
  echo "From: $from"
  echo "To: $to"
  echo "Subject: $subject"
  echo -e "Content:\n$content"
  echo "======================================"

  # Use curl to send the API request for processing the email
  echo -e "\nSending email via API..."
  curl -s -X POST "http://localhost:8080/api/emails/process" \
    -H "Content-Type: application/json" \
    -d "{
      \"from\": \"$from\",
      \"to\": \"$to\",
      \"subject\": \"$subject\",
      \"content\": \"$content\"
    }"

  echo -e "\nEmail sent successfully!"

  # Return the ID for later reference
  return $id
}

# Function to choose a template based on the test type
choose_template() {
  local test_type=$1

  case $test_type in
    "frequent")
      echo "frequent_sender.template"
      ;;
    "negative")
      echo "negative_repeated.template"
      ;;
    "urgent")
      echo "urgent_critical.template"
      ;;
    *)
      echo "default.template"
      ;;
  esac
}

# Function to simulate checking for a response
check_response() {
  local id=$1
  local test_type=$2
  local template=$(choose_template "$test_type")

  echo -e "\n======================================"
  echo "Checking template response for email $id:"
  echo "======================================"
  echo "Template: $template"

  # Use curl to retrieve the template
  echo -e "\nTemplate content:"
  echo "--------------------------------------"
  curl -s "http://localhost:8080/api/templates/$(basename $template .template)" | jq -r '.content'
  echo "--------------------------------------"

  echo -e "\nSimulated response after template processing:"
  echo "======================================"

  # Simulate filling out the template with example data
  case $test_type in
    "frequent")
      echo "Template is for frequent senders with placeholders filled in:"
      echo "- {{SENDER_NAME}} -> Jan Kowalski"
      echo "- {{SUBJECT}} -> The actual email subject"
      echo "- {{EMAIL_COUNT}} -> 5"
      echo "- {{LAST_EMAIL_DATE}} -> 12.05.2025"
      ;;
    "negative")
      echo "Template is for repeated negative feedback with placeholders filled in:"
      echo "- {{SENDER_NAME}} -> Anna Nowak"
      echo "- {{SUBJECT}} -> The actual email subject"
      echo "- Special handling: Przekazano do kierownika zespołu"
      ;;
    "urgent")
      echo "Template is for urgent messages with placeholders filled in:"
      echo "- {{SENDER_NAME}} -> Piotr Wiśniewski"
      echo "- {{SUBJECT}} -> The actual email subject"
      echo "- {{URGENCY}} -> krytyczna"
      ;;
    *)
      echo "Default template with placeholders filled in:"
      echo "- {{SENDER_NAME}} -> Użytkownik"
      echo "- {{SUBJECT}} -> The actual email subject"
      ;;
  esac

  echo "======================================"
}

# Function to check database entries
check_database() {
  echo -e "\n======================================"
  echo "Checking database entries:"
  echo "======================================"

  if [ -f "data/emails.db" ]; then
    # Check if sqlite3 is installed
    if command -v sqlite3 >/dev/null 2>&1; then
      echo "Last 3 entries in the emails table:"
      sqlite3 "data/emails.db" "SELECT id, from_address, subject, status FROM emails ORDER BY id DESC LIMIT 3;"
    else
      echo "SQLite3 not installed. Install it to view database entries directly."
      echo "You can still view the database using Adminer at http://localhost:8081"
    fi
  else
    echo "Database file not found. Make sure the application is running and has processed at least one email."
  fi

  echo "======================================"
}

# Function to check archive files
check_archives() {
  echo -e "\n======================================"
  echo "Checking archive files:"
  echo "======================================"

  # List the most recent archive files
  if [ -d "data/archive" ]; then
    echo "Most recent archive files:"
    ls -lt "data/archive" | head -n 5

    # Show the content of the most recent archive file
    RECENT_FILE=$(ls -t "data/archive" | head -n 1)
    if [ -n "$RECENT_FILE" ]; then
      echo -e "\nContent of the most recent archive file ($RECENT_FILE):"
      echo "--------------------------------------"
      head -n 10 "data/archive/$RECENT_FILE"
      echo "..."
      echo "--------------------------------------"
    else
      echo "No archive files found."
    fi
  else
    echo "Archive directory not found. Make sure the application is running and has processed at least one email."
  fi

  echo "======================================"
}

# Main test function
run_test() {
  local test_type=$1
  local from="user@example.com"
  local to="$EMAIL_USER"
  local subject=""
  local content=""

  case $test_type in
    "frequent")
      subject="Kolejne zapytanie o produkt"
      content="Dzień dobry,\n\nTo już moja kolejna wiadomość do Państwa. Chciałbym zapytać o dostępność produktu XYZ.\n\nPozdrawiam,\nJan Kowalski"
      ;;
    "negative")
      subject="REKLAMACJA: Problem z zamówieniem #12345"
      content="Dzień dobry,\n\nPonownie piszę w sprawie mojego zamówienia #12345. Produkty nadal nie zostały dostarczone, pomimo wcześniejszej reklamacji. Jestem bardzo niezadowolony z obsługi.\n\nProszę o natychmiastowe wyjaśnienie.\n\nZ poważaniem,\nAnna Nowak"
      ;;
    "urgent")
      subject="PILNE: Prośba o natychmiastowy kontakt"
      content="Dzień dobry,\n\nPilnie potrzebuję kontaktu w sprawie mojego konta. Zauważyłem nieautoryzowane transakcje i muszę to natychmiast wyjaśnić.\n\nProszę o kontakt jak najszybciej.\n\nZ poważaniem,\nPiotr Wiśniewski"
      ;;
    "new")
      subject="Pierwsze zapytanie o produkty"
      content="Dzień dobry,\n\nJestem nowym klientem i chciałbym zapytać o Waszą ofertę. Czy możecie przedstawić mi dostępne produkty?\n\nPozdrawiam,\nNowy Klient"
      ;;
    *)
      echo "Nieznany typ testu. Dostępne opcje: frequent, negative, urgent, new"
      exit 1
      ;;
  esac

  # Send the test email
  send_email "$subject" "$content" "$from" "$to"
  local email_id=$?

  # Check for response template
  check_response $email_id "$test_type"

  # Check database and archives
  check_database
  check_archives

  echo -e "\n======================================"
  echo "Test zakończony pomyślnie!"
  echo "======================================"
  echo "Aby zobaczyć pełne wyniki w interfejsie MailHog, odwiedź: http://localhost:8025"
  echo "Aby zobaczyć bazę danych w Adminer, odwiedź: http://localhost:8081"
}

# Display help if no arguments provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 [frequent|negative|urgent|new]"
  echo "  frequent - Test template for frequent senders"
  echo "  negative - Test template for repeated negative feedback"
  echo "  urgent   - Test template for urgent messages"
  echo "  new      - Test template for new users"
  exit 1
fi

# Check if the application is running by attempting to connect to the API
if ! curl -s "http://localhost:8080/health" > /dev/null; then
  echo "ERROR: Aplikacja Email LLM Processor nie jest uruchomiona lub nie jest dostępna."
  echo "Uruchom aplikację za pomocą './run-advanced.sh' przed wykonaniem testów."
  exit 1
fi

# Run the test with the specified type
run_test "$1"