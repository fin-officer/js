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
  
  echo "\n======================================"
  echo "Sending test email:"
  echo "======================================"
  echo "ID: $id"
  echo "From: $from"
  echo "To: $to"
  echo "Subject: $subject"
  echo "Content:\n$content"
  echo "======================================"
  
  # In a real implementation, this would use the 'mail' command or similar
  # For simulation, we'll just pretend to send it
  echo "\nSending email to $EMAIL_HOST:$EMAIL_PORT..."
  sleep 1
  echo "Email sent successfully!"
  
  return $id
}

# Function to simulate checking for a response
check_response() {
  local id=$1
  local wait_time=$2
  
  echo "\n======================================"
  echo "Checking for response to email $id:"
  echo "======================================"
  echo "Waiting for $wait_time seconds..."
  
  # Simulate waiting for processing
  for i in $(seq 1 $wait_time); do
    echo -n "."
    sleep 1
  done
  
  echo "\n\nResponse received:"
  echo "======================================"
  
  # Simulate LLM analysis
  local sentiment=$(get_random_sentiment)
  local urgency=$(get_random_urgency)
  
  # Generate simulated response based on sentiment and urgency
  generate_response "$sentiment" "$urgency"
  
  echo "======================================"
}

# Function to get a random sentiment for simulation
get_random_sentiment() {
  local sentiments=("VERY_NEGATIVE" "NEGATIVE" "NEUTRAL" "POSITIVE" "VERY_POSITIVE")
  local random_index=$((RANDOM % 5))
  echo ${sentiments[$random_index]}
}

# Function to get a random urgency for simulation
get_random_urgency() {
  local urgencies=("LOW" "NORMAL" "HIGH" "CRITICAL")
  local random_index=$((RANDOM % 4))
  echo ${urgencies[$random_index]}
}

# Function to generate a simulated response based on sentiment and urgency
generate_response() {
  local sentiment=$1
  local urgency=$2
  
  echo "Analysis Results:"
  echo "- Sentiment: $sentiment"
  echo "- Urgency: $urgency"
  echo ""
  
  echo "Auto-Reply Content:"
  
  if [[ "$urgency" == "HIGH" || "$urgency" == "CRITICAL" ]]; then
    echo "Dziękujemy za wiadomość. Zauważyliśmy, że sprawa jest pilna. Zajmiemy się nią priorytetowo."
  elif [[ "$sentiment" == "NEGATIVE" || "$sentiment" == "VERY_NEGATIVE" ]]; then
    echo "Dziękujemy za wiadomość. Przepraszamy za niedogodności. Postaramy się rozwiązać problem jak najszybciej."
  else
    echo "Dziękujemy za wiadomość. Zajmiemy się nią wkrótce."
  fi
}

# Main test function
run_test() {
  local test_type=$1
  local from="user@example.com"
  local to="$EMAIL_USER"
  local subject=""
  local content=""
  
  case $test_type in
    "positive")
      subject="Podziękowanie za świetną obsługę"
      content="Dzień dobry,\n\nChciałbym podziękować za świetną obsługę mojego ostatniego zamówienia. Wszystko zostało dostarczone na czas i w idealnym stanie.\n\nPozdrawiam,\nZadowolony Klient"
      ;;
    "negative")
      subject="Problem z zamówieniem #12345"
      content="Dzień dobry,\n\nMam problem z moim ostatnim zamówieniem #12345. Produkty nie zostały dostarczone na czas, a jeden z nich był uszkodzony.\n\nProszę o pilne rozwiązanie problemu.\n\nZ poważaniem,\nNiezadowolony Klient"
      ;;
    "urgent")
      subject="PILNE: Prośba o natychmiastowy kontakt"
      content="Dzień dobry,\n\nPilnie potrzebuję kontaktu w sprawie mojego konta. Zauważyłem nieautoryzowane transakcje i muszę to natychmiast wyjaśnić.\n\nProszę o kontakt jak najszybciej.\n\nZ poważaniem,\nZaniepokojony Klient"
      ;;
    "neutral")
      subject="Pytanie o dostępność produktu"
      content="Dzień dobry,\n\nChciałbym zapytać o dostępność produktu XYZ w Państwa sklepie.\n\nZ poważaniem,\nZainteresowany Klient"
      ;;
    *)
      echo "Nieznany typ testu. Dostępne opcje: positive, negative, urgent, neutral"
      exit 1
      ;;
  esac
  
  # Send the test email
  send_email "$subject" "$content" "$from" "$to"
  local email_id=$?
  
  # Check for response
  check_response $email_id 5
}

# Display help if no arguments provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 [positive|negative|urgent|neutral]"
  echo "  positive - Send a positive email"
  echo "  negative - Send a negative email"
  echo "  urgent   - Send an urgent email"
  echo "  neutral  - Send a neutral inquiry"
  exit 1
fi

# Run the test with the specified type
run_test "$1"
