@echo off
setlocal

echo Uruchamianie Email LLM Processor...

:: Sprawdzenie, czy docker jest zainstalowany i uruchomiony
docker info >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Docker nie jest uruchomiony.
    echo Proszę uruchomić Docker Desktop i uruchomić ten skrypt ponownie.
    exit /b 1
)

:: Sprawdzenie, czy plik .env istnieje
if not exist .env (
    echo Plik .env nie istnieje. Kopiowanie z .env.example...
    copy .env.example .env
    echo Plik .env został utworzony. Proszę dostosować zmienne środowiskowe według potrzeb.
)

:: Tworzenie katalogów dla danych i logów, jeśli nie istnieją
if not exist data mkdir data
if not exist logs mkdir logs

:: Zatrzymanie kontenerów, jeśli są uruchomione
echo Zatrzymywanie uruchomionych kontenerów...
docker-compose down 2>nul

:: Budowanie i uruchamianie kontenerów
echo Budowanie i uruchamianie kontenerów...
docker-compose up -d --build

:: Sprawdzenie statusu kontenerów
echo Sprawdzanie statusu kontenerów...
docker-compose ps

:: Wyprowadzanie logów z aplikacji
echo Serwer uruchomiony! Wyświetlanie logów aplikacji...
echo Naciśnij Ctrl+C, aby wyłączyć wyświetlanie logów (serwer pozostanie uruchomiony)
docker-compose logs -f app

:: Instrukcje dostępu
echo.
echo Serwery są dostępne pod następującymi adresami:
echo - Aplikacja: http://localhost:8080
echo - MailHog (interfejs testowy email): http://localhost:8025
echo - Adminer (zarządzanie bazą danych): http://localhost:8081
echo - Hawtio (panel administracyjny Camel): http://localhost:8090/hawtio
echo.
echo Aby zatrzymać aplikację, użyj: docker-compose down

endlocal