#!/bin/bash
set -e

# Sprawdzenie, czy docker i docker-compose są zainstalowane
if ! command -v docker &> /dev/null || ! command -v docker-compose &> /dev/null; then
    echo "Docker lub Docker Compose nie są zainstalowane. Uruchom najpierw ./scripts/install.sh"
    exit 1
fi

# Sprawdzenie, czy plik .env istnieje
if [ ! -f .env ]; then
    echo "Plik .env nie istnieje. Kopiowanie z .env.example..."
    cp .env.example .env
    echo "Plik .env został utworzony. Proszę dostosować zmienne środowiskowe według potrzeb."
fi

# Tworzenie katalogów dla danych i logów, jeśli nie istnieją
mkdir -p data logs

# Zatrzymanie kontenerów, jeśli są uruchomione
echo "Zatrzymywanie uruchomionych kontenerów..."
docker-compose down 2>/dev/null || true

# Budowanie i uruchamianie kontenerów
echo "Budowanie i uruchamianie kontenerów..."
docker-compose up -d --build

# Sprawdzenie statusu kontenerów
echo "Sprawdzanie statusu kontenerów..."
docker-compose ps

# Wyprowadzanie logów z aplikacji
echo "Serwer uruchomiony! Wyświetlanie logów aplikacji..."
echo "Naciśnij Ctrl+C, aby wyłączyć wyświetlanie logów (serwer pozostanie uruchomiony)"
docker-compose logs -f app

# Instrukcje dostępu
echo ""
echo "Serwery są dostępne pod następującymi adresami:"
echo "- Aplikacja: http://localhost:8080"
echo "- MailHog (interfejs testowy email): http://localhost:8025"
echo "- Adminer (zarządzanie bazą danych): http://localhost:8081"
echo "- Hawtio (panel administracyjny Camel): http://localhost:8090/hawtio"
echo ""
echo "Aby zatrzymać aplikację, użyj: docker-compose down"