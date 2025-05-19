#!/bin/bash
set -e

# Sprawdzenie, czy Docker jest zainstalowany
if ! command -v docker &> /dev/null; then
    echo "Docker nie jest zainstalowany. Instalowanie Docker..."

    # Instalacja dla systemów bazujących na Debian/Ubuntu
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y apt-transport-https ca-certificates curl software-properties-common
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
        sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io

    # Instalacja dla systemów bazujących na Red Hat/CentOS
    elif command -v yum &> /dev/null; then
        sudo yum install -y yum-utils
        sudo yum-config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo
        sudo yum install -y docker-ce docker-ce-cli containerd.io
        sudo systemctl start docker

    # Instalacja dla MacOS (wymaga Homebrew)
    elif command -v brew &> /dev/null; then
        brew install --cask docker
        echo "Docker Desktop został zainstalowany. Proszę uruchomić aplikację Docker Desktop."
        echo "Po uruchomieniu Docker Desktop, uruchom ten skrypt ponownie."
        exit 1
    else
        echo "Nie można automatycznie zainstalować Docker dla tego systemu operacyjnego."
        echo "Odwiedź https://docs.docker.com/get-docker/ aby uzyskać instrukcje instalacji."
        exit 1
    fi

    # Uruchomienie Docker
    sudo systemctl start docker
    sudo systemctl enable docker

    # Dodanie bieżącego użytkownika do grupy docker
    sudo usermod -aG docker $USER
    echo "Dodano użytkownika $USER do grupy docker. Może być konieczne wylogowanie i ponowne zalogowanie."
fi

# Sprawdzenie, czy Docker Compose jest zainstalowany
if ! command -v docker-compose &> /dev/null; then
    echo "Docker Compose nie jest zainstalowany. Instalowanie Docker Compose..."

    # Instalacja Docker Compose
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose

    # Sprawdzenie instalacji
    docker-compose --version
fi

# Sprawdzenie, czy Node.js jest zainstalowany (opcjonalnie, do lokalnego developmentu)
if ! command -v node &> /dev/null; then
    echo "Node.js nie jest zainstalowany. Instalowanie Node.js..."

    # Instalacja dla systemów bazujących na Debian/Ubuntu
    if command -v apt-get &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
        sudo apt-get install -y nodejs

    # Instalacja dla systemów bazujących na Red Hat/CentOS
    elif command -v yum &> /dev/null; then
        curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
        sudo yum install -y nodejs

    # Instalacja dla MacOS (wymaga Homebrew)
    elif command -v brew &> /dev/null; then
        brew install node@18
    else
        echo "Nie można automatycznie zainstalować Node.js dla tego systemu operacyjnego."
        echo "Odwiedź https://nodejs.org/ aby uzyskać instrukcje instalacji."
    fi

    # Sprawdzenie instalacji
    node --version
    npm --version
fi

# Tworzenie pliku .env na podstawie .env.example, jeśli nie istnieje
if [ ! -f .env ]; then
    echo "Tworzenie pliku .env na podstawie .env.example..."
    cp .env.example .env
    echo "Plik .env został utworzony. Proszę dostosować zmienne środowiskowe według potrzeb."
fi

# Instalacja zależności Node.js (opcjonalnie, do lokalnego developmentu)
echo "Instalacja zależności npm..."
npm install

# Tworzenie katalogów dla danych i logów
mkdir -p data logs

# Ustawianie uprawnień do skryptów
chmod +x scripts/*.sh

echo "Instalacja zakończona pomyślnie."
echo "Aby uruchomić aplikację, wykonaj: ./scripts/start.sh"