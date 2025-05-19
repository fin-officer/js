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
DATABASE_PATH=${DATABASE_PATH:-data/emails.db}

# Create directories for templates and archives
mkdir -p data/templates
mkdir -p data/archive

# Function to create a sample database for testing
create_sample_database() {
  echo "Creating sample database for testing..."
  
  # Create SQLite database if it doesn't exist
  if [ ! -f "$DATABASE_PATH" ]; then
    mkdir -p $(dirname "$DATABASE_PATH")
    
    # Create the database and tables
    sqlite3 "$DATABASE_PATH" <<EOF
    CREATE TABLE IF NOT EXISTS emails (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        from_address TEXT NOT NULL,
        to_address TEXT NOT NULL,
        subject TEXT,
        content TEXT,
        received_date TIMESTAMP,
        processed_date TIMESTAMP,
        tone_analysis TEXT,
        status TEXT
    );
    
    -- Insert sample data for frequent sender
    INSERT INTO emails (from_address, to_address, subject, content, received_date, status, tone_analysis)
    VALUES (
        'frequent@example.com',
        '$EMAIL_USER',
        'Poprzednie zapytanie',
        'Treść poprzedniej wiadomości',
        datetime('now', '-7 days'),
        'PROCESSED',
        '{"sentiment":"NEUTRAL","emotions":{"NEUTRAL":0.8},"urgency":"NORMAL","formality":"NEUTRAL","topTopics":["zapytanie"],"summaryText":"Standardowe zapytanie."}'        
    );
    
    INSERT INTO emails (from_address, to_address, subject, content, received_date, status, tone_analysis)
    VALUES (
        'frequent@example.com',
        '$EMAIL_USER',
        'Drugie zapytanie',
        'Treść drugiej wiadomości',
        datetime('now', '-3 days'),
        'PROCESSED',
        '{"sentiment":"POSITIVE","emotions":{"HAPPINESS":0.6,"NEUTRAL":0.4},"urgency":"NORMAL","formality":"NEUTRAL","topTopics":["podziękowanie"],"summaryText":"Podziękowanie za obsługę."}'        
    );
    
    -- Insert sample data for negative sender
    INSERT INTO emails (from_address, to_address, subject, content, received_date, status, tone_analysis)
    VALUES (
        'negative@example.com',
        '$EMAIL_USER',
        'Skarga na obsługę',
        'Jestem bardzo niezadowolony z obsługi.',
        datetime('now', '-5 days'),
        'PROCESSED',
        '{"sentiment":"NEGATIVE","emotions":{"ANGER":0.7,"SADNESS":0.3},"urgency":"HIGH","formality":"NEUTRAL","topTopics":["skarga","obsługa"],"summaryText":"Skarga na obsługę klienta."}'        
    );
    
    -- Insert sample data for urgent sender
    INSERT INTO emails (from_address, to_address, subject, content, received_date, status, tone_analysis)
    VALUES (
        'urgent@example.com',
        '$EMAIL_USER',
        'PILNE: Problem z kontem',
        'Pilnie potrzebuję pomocy z moim kontem!',
        datetime('now', '-1 days'),
        'PROCESSED',
        '{"sentiment":"NEUTRAL","emotions":{"FEAR":0.5,"NEUTRAL":0.5},"urgency":"CRITICAL","formality":"NEUTRAL","topTopics":["konto","problem"],"summaryText":"Pilny problem z kontem użytkownika."}'        
    );
EOF
    
    echo "Sample database created at $DATABASE_PATH"
  else
    echo "Database already exists at $DATABASE_PATH"
  fi
}

# Function to create sample templates
create_sample_templates() {
  echo "Creating sample email templates..."
  
  # Create default template
  cat > data/templates/default.template << EOF
Szanowny/a {{SENDER_NAME}},

Dziękujemy za wiadomość dotyczącą: "{{SUBJECT}}".

Otrzymaliśmy Twoją wiadomość i zajmiemy się nią wkrótce.

Z poważaniem,
Zespół Obsługi Klienta
EOF

  # Create template for frequent senders
  cat > data/templates/frequent_sender.template << EOF
Szanowny/a {{SENDER_NAME}},

Dziękujemy za Twoją wiadomość dotyczącą: "{{SUBJECT}}".

Doceniamy Twoją lojalność i częsty kontakt z nami. Jako nasz stały klient, Twoja sprawa zostanie rozpatrzona priorytetowo.

To już Twoja {{EMAIL_COUNT}}. wiadomość do nas. Ostatnio kontaktowałeś/aś się z nami {{LAST_EMAIL_DATE}}.

Z poważaniem,
Zespół Obsługi Klienta
EOF

  # Create template for negative sentiment
  cat > data/templates/negative_repeated.template << EOF
Szanowny/a {{SENDER_NAME}},

Dziękujemy za ponowną wiadomość dotyczącą: "{{SUBJECT}}".

Widzimy, że to nie pierwszy raz, gdy napotykasz problemy. Bardzo przepraszamy za tę sytuację. Twoja sprawa została przekazana do kierownika zespołu, który osobiście zajmie się jej rozwiązaniem.

Skontaktujemy się z Tobą najszybciej jak to możliwe.

Z poważaniem,
Zespół Obsługi Klienta
EOF

  # Create template for urgent messages
  cat > data/templates/urgent_critical.template << EOF
Szanowny/a {{SENDER_NAME}},

Dziękujemy za wiadomość dotyczącą: "{{SUBJECT}}".

Zauważyliśmy, że Twoja sprawa jest krytycznie pilna. Przekazaliśmy ją do natychmiastowego rozpatrzenia przez nasz zespół.

Skontaktujemy się z Tobą najszybciej jak to możliwe.

Z poważaniem,
Zespół Obsługi Klienta
EOF

  echo "Sample templates created in data/templates/"
}

# Function to simulate sending an email and getting a response
simulate_email_processing() {
  local sender=$1
  local subject=$2
  local content=$3
  local sentiment=$4
  local urgency=$5
  
  echo "\n======================================"
  echo "Symulacja przetwarzania wiadomości email:"
  echo "======================================"
  echo "Od: $sender"
  echo "Temat: $subject"
  echo "Treść: $content"
  echo "Sentyment: $sentiment"
  echo "Pilność: $urgency"
  
  # Simulate email processing
  echo "\nPrzetwarzanie wiadomości..."
  echo "1. Zapisywanie wiadomości do bazy danych"
  echo "2. Archiwizacja wiadomości do pliku"
  
  # Create archive file
  local timestamp=$(date +"%Y%m%d_%H%M%S")
  local sanitized_sender=$(echo "$sender" | tr -dc '[:alnum:]')
  local archive_file="data/archive/${timestamp}_${sanitized_sender}.txt"
  
  cat > "$archive_file" << EOF
From: $sender
To: $EMAIL_USER
Subject: $subject
Received: $(date -Iseconds)
Status: RECEIVED

$content
EOF
  
  echo "3. Wiadomość zarchiwizowana w: $archive_file"
  
  # Create tone analysis JSON
  local tone_analysis="{\"sentiment\":\"$sentiment\",\"emotions\":{\"NEUTRAL\":0.5},\"urgency\":\"$urgency\",\"formality\":\"NEUTRAL\",\"topTopics\":[\"zapytanie\"],\"summaryText\":\"Treść wiadomości użytkownika.\"}"
  
  echo "4. Analiza tonu wiadomości przez LLM"
  echo "   Wynik analizy: $tone_analysis"
  
  # Simulate template selection based on sender and analysis
  local template_key="default"
  
  if [[ "$sender" == "frequent@example.com" ]]; then
    template_key="frequent_sender"
    echo "5. Wykryto częstego nadawcę, wybrano szablon: $template_key"
  elif [[ "$sender" == "negative@example.com" && "$sentiment" == "NEGATIVE" ]]; then
    template_key="negative_repeated"
    echo "5. Wykryto powtarzającą się skargę, wybrano szablon: $template_key"
  elif [[ "$urgency" == "CRITICAL" ]]; then
    template_key="urgent_critical"
    echo "5. Wykryto pilną wiadomość, wybrano szablon: $template_key"
  else
    echo "5. Wybrano domyślny szablon odpowiedzi"
  fi
  
  # Read the template
  local template_file="data/templates/${template_key}.template"
  local template=""
  
  if [ -f "$template_file" ]; then
    template=$(cat "$template_file")
  else
    template="Dziękujemy za wiadomość. Zajmiemy się nią wkrótce."
  fi
  
  # Fill in template variables
  local sender_name=$(echo "$sender" | cut -d@ -f1 | tr '_' ' ' | awk '{for(i=1;i<=NF;i++){ $i=toupper(substr($i,1,1)) substr($i,2) }}1')
  local email_count=0
  local last_email_date=""
  
  # Get email count and last email date from database
  if [ -f "$DATABASE_PATH" ]; then
    email_count=$(sqlite3 "$DATABASE_PATH" "SELECT COUNT(*) FROM emails WHERE from_address = '$sender'")
    last_email_date=$(sqlite3 "$DATABASE_PATH" "SELECT received_date FROM emails WHERE from_address = '$sender' ORDER BY received_date DESC LIMIT 1")
  fi
  
  # Replace template variables
  template=${template//\{\{SENDER_NAME\}\}/$sender_name}
  template=${template//\{\{SUBJECT\}\}/$subject}
  template=${template//\{\{EMAIL_COUNT\}\}/$email_count}
  template=${template//\{\{LAST_EMAIL_DATE\}\}/$last_email_date}
  template=${template//\{\{CURRENT_DATE\}\}/$(date +"%Y-%m-%d")}
  template=${template//\{\{SENTIMENT\}\}/$sentiment}
  template=${template//\{\{URGENCY\}\}/$urgency}
  
  echo "\n======================================"
  echo "Wygenerowana odpowiedź:"
  echo "======================================"
  echo "$template"
  echo "======================================"
  
  # Update database with this email
  if [ -f "$DATABASE_PATH" ]; then
    sqlite3 "$DATABASE_PATH" <<EOF
    INSERT INTO emails (from_address, to_address, subject, content, received_date, processed_date, status, tone_analysis)
    VALUES (
        '$sender',
        '$EMAIL_USER',
        '$subject',
        '$content',
        datetime('now'),
        datetime('now'),
        'REPLIED',
        '$tone_analysis'
    );
EOF
    echo "\nWiadomość została zapisana w bazie danych."
  fi
}

# Main function
main() {
  local test_type=$1
  
  # Create sample database and templates
  create_sample_database
  create_sample_templates
  
  case $test_type in
    "frequent")
      simulate_email_processing \
        "frequent@example.com" \
        "Kolejne zapytanie" \
        "Dzień dobry,\n\nMam jeszcze jedno pytanie odnośnie waszych usług.\n\nPozdrawiam,\nCzęsty Klient" \
        "NEUTRAL" \
        "NORMAL"
      ;;
    "negative")
      simulate_email_processing \
        "negative@example.com" \
        "Kolejna skarga" \
        "Dzień dobry,\n\nNiestety, mój problem nadal nie został rozwiązany. Jestem bardzo niezadowolony z obsługi.\n\nZ poważaniem,\nNiezadowolony Klient" \
        "NEGATIVE" \
        "NORMAL"
      ;;
    "urgent")
      simulate_email_processing \
        "urgent@example.com" \
        "PILNE: Kolejny problem" \
        "Dzień dobry,\n\nMam pilny problem z dostępem do mojego konta. Proszę o natychmiastową pomoc!\n\nZ poważaniem,\nZaniepokojony Klient" \
        "NEUTRAL" \
        "CRITICAL"
      ;;
    "new")
      simulate_email_processing \
        "new@example.com" \
        "Pierwsze zapytanie" \
        "Dzień dobry,\n\nJestem nowym klientem i mam pytanie o wasze usługi.\n\nPozdrawiam,\nNowy Klient" \
        "NEUTRAL" \
        "NORMAL"
      ;;
    *)
      echo "Nieznany typ testu. Dostępne opcje: frequent, negative, urgent, new"
      exit 1
      ;;
  esac
}

# Display help if no arguments provided
if [ $# -eq 0 ]; then
  echo "Usage: $0 [frequent|negative|urgent|new]"
  echo "  frequent - Symuluj odpowiedź dla częstego nadawcy"
  echo "  negative - Symuluj odpowiedź dla nadawcy z negatywnym sentymentem"
  echo "  urgent   - Symuluj odpowiedź dla pilnej wiadomości"
  echo "  new      - Symuluj odpowiedź dla nowego nadawcy"
  exit 1
fi

# Run the test with the specified type
main "$1"
