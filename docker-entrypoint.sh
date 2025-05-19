#!/bin/sh
set -e

# Oczekiwanie na dostępność ActiveMQ (opcjonalnie)
if [ ! -z "$ACTIVEMQ_HOST" ]; then
  echo "Oczekiwanie na ActiveMQ..."
  while ! nc -z $ACTIVEMQ_HOST 61616; do
    sleep 1
  done
  echo "ActiveMQ jest dostępny."
fi

# Ustawienie zmiennych środowiskowych z pliku .env
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

# Inicjalizacja bazy danych, jeśli nie istnieje
if [ ! -f "/app/data/emails.db" ]; then
  echo "Inicjalizacja bazy danych..."
  node /app/scripts/setup-db.js
  echo "Inicjalizacja zakończona."
fi

# Uruchomienie Hawtio w tle (opcjonalnie)
if [ "$ENABLE_HAWTIO" = "true" ]; then
  echo "Uruchamianie Hawtio na porcie 8090..."
  java -jar /opt/hawtio/hawtio-app.jar --port 8090 &
fi

# Uruchomienie głównej aplikacji
echo "Uruchamianie Email LLM Processor..."
exec "$@"