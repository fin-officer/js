# Email LLM Processor - Dokumentacja

## Przegląd

Email LLM Processor to minimalistyczna aplikacja napisana w JavaScript z użyciem Apache Camel, umożliwiająca automatyczne przetwarzanie, analizę i generowanie odpowiedzi na wiadomości e-mail przy użyciu modeli językowych (LLM).

Aplikacja została zaprojektowana w podejściu skryptowym, z minimalnym wykorzystaniem frameworków, aby zminimalizować ilość kodu i zależności.

## Funkcjonalności

- Odbieranie wiadomości e-mail przez IMAP
- Wysyłanie wiadomości e-mail przez SMTP
- Analiza treści wiadomości przy użyciu modeli językowych (LLM)
- Automatyczne generowanie odpowiedzi
- Przechowywanie wiadomości w lokalnej bazie danych SQLite
- REST API do ręcznego przetwarzania wiadomości

## Architektura

### Główne komponenty

1. **index.js** - punkt wejścia aplikacji, odpowiedzialny za inicjalizację wszystkich komponentów i uruchomienie Apache Camel
2. **camel-routes.xml** - definicja tras Apache Camel odpowiedzialnych za odbieranie, przetwarzanie i wysyłanie wiadomości e-mail
3. **emailService.js** - serwis zawierający logikę biznesową przetwarzania wiadomości
4. **llmService.js** - serwis do komunikacji z API modelu językowego
5. **emailParser.js** - narzędzie do parsowania wiadomości e-mail
6. **dbUtils.js** - narzędzia do obsługi bazy danych

### Model danych

1. **emailMessage.js** - model reprezentujący wiadomość e-mail
2. **toneAnalysis.js** - model reprezentujący analizę tonu wiadomości

### Baza danych

Aplikacja wykorzystuje prostą bazę danych SQLite do przechowywania wiadomości e-mail i wyników analizy.

## Wymagania

- Node.js 18 lub nowszy
- Docker i Docker Compose (do uruchomienia w kontenerach)
- Opcjonalnie: Java 11 lub nowsze (dla pełnej funkcjonalności Apache Camel)

## Instalacja

Aplikacja może być zainstalowana i uruchomiona na dwa sposoby:

### Instalacja za pomocą skryptów

1. Dla systemów Linux/MacOS:
   ```bash
   ./scripts/install.sh
   ```

2. Dla systemów Windows:
   ```cmd
   scripts\install.bat
   ```

Skrypty automatycznie zainstalują wszystkie wymagane zależności, w tym Docker, jeśli nie jest zainstalowany.

### Instalacja ręczna

1. Zainstaluj Node.js 18+
2. Zainstaluj Docker i Docker Compose
3. Sklonuj repozytorium
   ```bash
   git clone https://github.com/yourusername/email-llm-processor-js.git
   cd email-llm-processor-js
   ```
4. Zainstaluj zależności:
   ```bash
   npm install
   ```
5. Skopiuj plik przykładowy .env.example do .env:
   ```bash
   cp .env.example .env
   ```
6. Dostosuj zmienne w pliku .env według potrzeb.

## Uruchomienie

### Uruchomienie za pomocą skryptów

1. Dla systemów Linux/MacOS:
   ```bash
   ./scripts/start.sh
   ```

2. Dla systemów Windows:
   ```cmd
   scripts\start.bat
   ```

### Uruchomienie manualne

```bash
docker-compose up -d
```

To polecenie uruchomi:
- Aplikację Email LLM Processor
- Serwer testowy MailHog do odbioru/wysyłania wiadomości
- Serwer Ollama do hostowania modelu LLM
- Adminer do zarządzania bazą danych SQLite
- Apache ActiveMQ (opcjonalnie, dla wykorzystania JMS)

### Uruchomienie lokalne bez Dockera

```bash
npm start
```

## Dostęp do usług

Po uruchomieniu, następujące usługi będą dostępne:

| Usługa | URL | Opis |
|--------|-----|------|
| Aplikacja | http://localhost:8080 | REST API aplikacji |
| MailHog | http://localhost:8025 | Interfejs testowy do przeglądania wiadomości |
| Adminer | http://localhost:8081 | Panel zarządzania bazą danych |
| Hawtio | http://localhost:8090/hawtio | Panel administracyjny Apache Camel (opcjonalnie) |
| ActiveMQ | http://localhost:8161 | Panel administracyjny ActiveMQ (opcjonalnie) |

## Testowanie

Aby przetestować aplikację:

1. Otwórz interfejs MailHog pod adresem http://localhost:8025
2. Wyślij testową wiadomość e-mail na adres skonfigurowany w zmiennych środowiskowych (domyślnie test@example.com)
3. Aplikacja powinna odebrać wiadomość, przetworzyć ją i wysłać automatyczną odpowiedź (jeśli spełnione są kryteria)
4. Sprawdź w MailHog czy otrzymałeś odpowiedź
5. Możesz również sprawdzić bazę danych przez Adminer, aby zobaczyć zapisane wiadomości i wyniki analizy

Alternatywnie, możesz przetestować API bezpośrednio:

```bash
curl -X POST http://localhost:8080/api/emails/process \
  -H "Content-Type: application/json" \
  -d '{
    "from": "testuser@example.com",
    "to": "service@example.com",
    "subject": "Test wiadomości",
    "content": "To jest testowa wiadomość do przetworzenia przez system."
  }'
```

## Struktura kodu

### src/index.js
Główny punkt wejścia aplikacji, inicjalizuje kontekst Apache Camel, serwisy i serwer Express dla REST API.

### src/models
Zawiera modele danych używane w aplikacji:
- **emailMessage.js** - reprezentacja wiadomości email
- **toneAnalysis.js** - reprezentacja wyników analizy tonu wiadomości

### src/services
Zawiera serwisy biznesowe aplikacji:
- **emailService.js** - logika przetwarzania wiadomości email
- **llmService.js** - komunikacja z API modelu językowego

### src/utils
Zawiera narzędzia pomocnicze:
- **emailParser.js** - narzędzia do parsowania wiadomości email
- **dbUtils.js** - narzędzia do komunikacji z bazą danych
- **camelContext.js** - konfiguracja kontekstu Apache Camel

### camel-routes.xml
Definicja tras Apache Camel w formacie XML.

### scripts
Skrypty instalacyjne i uruchomieniowe:
- **install.sh/.bat** - skrypty instalacyjne
- **start.sh/.bat** - skrypty uruchomieniowe
- **setup-db.js** - skrypt inicjalizujący bazę danych

## Rozszerzanie funkcjonalności

### Dodawanie nowych tras Camel

Aby dodać nową trasę Camel, możesz:

1. Edytować plik `camel-routes.xml` i dodać nową definicję trasy
2. Zrestartować aplikację

### Dostosowanie analizy LLM

Aby dostosować analizę LLM:

1. Zmodyfikuj prompt w metodzie `createAnalysisPrompt()` w pliku `src/services/llmService.js`
2. Dostosuj parsowanie odpowiedzi w metodzie `parseAnalysisResponse()`
3. Rozszerz model `ToneAnalysis` w pliku `src/models/toneAnalysis.js` o dodatkowe pola, jeśli są potrzebne

## Zmienne środowiskowe

Aplikacja wykorzystuje następujące zmienne środowiskowe, które można ustawić w pliku `.env`:

| Zmienna | Opis | Wartość domyślna |
|---------|------|------------------|
| EMAIL_HOST | Host serwera email | mailhog |
| EMAIL_PORT | Port serwera email | 1025 |
| EMAIL_USER | Nazwa użytkownika email | test@example.com |
| EMAIL_PASSWORD | Hasło email | password |
| LLM_API_URL | URL API modelu językowego | http://ollama:11434 |
| LLM_MODEL | Nazwa modelu językowego | llama2 |
| APP_PORT | Port aplikacji | 8080 |
| DATABASE_PATH | Ścieżka do bazy danych | /app/data/emails.db |
| ACTIVEMQ_HOST | Host ActiveMQ | activemq |
| ACTIVEMQ_PORT | Port ActiveMQ | 61616 |
| ENABLE_HAWTIO | Włączenie panelu Hawtio | true |
| NODE_ENV | Środowisko Node.js | production |

## Rozwiązywanie problemów

### Problem: Aplikacja nie uruchamia się

Sprawdź:
- Czy Docker jest uruchomiony
- Czy porty 8080, 8025, 8081 są wolne
- Logi aplikacji: `docker-compose logs app`

### Problem: Wiadomości nie są odbierane

Sprawdź:
- Czy serwer IMAP jest dostępny i poprawnie skonfigurowany
- Czy dane logowania do serwera email są poprawne
- Logi aplikacji pod kątem błędów połączenia

### Problem: Brak analizy LLM

Sprawdź:
- Czy serwer Ollama jest uruchomiony
- Czy model LLM jest dostępny
- Logi aplikacji pod kątem błędów komunikacji z API LLM

## Wsparcie

W przypadku problemów lub pytań:
1. Sprawdź logi aplikacji: `docker-compose logs app`
2. Sprawdź dokumentację Apache Camel: https://camel.apache.org/
3. Zgłoś problem w repozytorium projektu