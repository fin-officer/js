@echo off
setlocal

echo Instalacja Email LLM Processor...

:: Sprawdzenie, czy Docker jest zainstalowany
where docker >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Docker nie jest zainstalowany. 
    echo Proszę odwiedzić https://docs.docker.com/desktop/install/windows-install/ aby zainstalować Docker Desktop.
    echo Po instalacji Docker Desktop, uruchom ten skrypt ponownie.
    exit /b 1
)

:: Sprawdzenie, czy Docker jest uruchomiony
docker info >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Docker nie jest uruchomiony.
    echo Proszę uruchomić Docker Desktop i uruchomić ten skrypt ponownie.
    exit /b 1
)

:: Sprawdzenie, czy Node.js jest zainstalowany (opcjonalnie, do lokalnego developmentu)
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo Node.js nie jest zainstalowany.
    echo Zaleca się instalację Node.js do lokalnego developmentu.
    echo Odwiedź https://nodejs.org/ aby pobrać i zainstalować Node.js.
)

:: Tworzenie pliku .env na podstawie .env.example, jeśli nie istnieje
if not exist .env (
    echo Tworzenie pliku .env na podstawie .env.example...
    copy .env.example .env
    echo Plik .env został utworzony. Proszę dostosować zmienne środowiskowe według potrzeb.
)

:: Instalacja zależności Node.js (opcjonalnie, do lokalnego developmentu)
if exist node_modules\ (
    echo Aktualizacja zależności npm...
    call npm update
) else (
    echo Instalacja zależności npm...
    call npm install
)

:: Tworzenie katalogów dla danych i logów
if not exist data mkdir data
if not exist logs mkdir logs

echo Instalacja zakończona pomyślnie.
echo Aby uruchomić aplikację, wykonaj: scripts\start.bat

endlocal