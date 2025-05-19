# Email LLM Processor - Dokumentacja

## Przegląd

Email LLM Processor to minimalistyczna aplikacja napisana w JavaScript z użyciem Apache Camel, umożliwiająca automatyczne przetwarzanie, analizę i generowanie odpowiedzi na wiadomości e-mail przy użyciu modeli językowych (LLM).

Aplikacja została zaprojektowana w podejściu skryptowym, z minimalnym wykorzystaniem frameworków, aby zminimalizować ilość kodu i zależności, jednocześnie zapewniając zaawansowane funkcjonalności.

## Funkcjonalności

- Odbieranie wiadomości e-mail przez IMAP
- Wysyłanie wiadomości e-mail przez SMTP
- Analiza treści wiadomości przy użyciu modeli językowych (LLM)
- Zaawansowany system szablonów odpowiedzi
- Automatyczna archiwizacja wiadomości email
- Śledzenie historii komunikacji z nadawcami
- Przechowywanie wiadomości w lokalnej bazie danych SQLite
- REST API do ręcznego przetwarzania wiadomości i zarządzania szablonami

## Architektura

### Główne komponenty

1. **index.js** - punkt wejścia aplikacji, odpowiedzialny za inicjalizację wszystkich komponentów i uruchomienie Apache Camel
2. **camel-routes.xml** - definicja tras Apache Camel odpowiedzialnych za odbieranie, przetwarzanie i wysyłanie wiadomości e-mail
3. **emailService.js** - serwis zawierający logikę biznesową przetwarzania wiadomości
4. **llmService.js** - serwis do komunikacji z API modelu językowego
5. **advancedReplyService.js** - serwis zarządzający szablonami i personalizacją odpowiedzi
6. **emailParser.js** - narzędzie do parsowania wiadomości e-mail
7. **dbUtils.js** - narzędzia do obsługi bazy danych

### Model danych

1. **emailMessage.js** - model reprezentujący wiadomość e-mail
2. **toneAnalysis.js** - model reprezentujący analizę tonu wiadomości

### Baza danych

Aplikacja wykorzystuje prostą bazę danych SQLite do przechowywania wiadomości e-mail, wyników analizy oraz historii komunikacji.

### System szablonów

System wykorzystuje katalog `data/templates/` do przechowywania szablonów odpowiedzi w formacie tekstowym z placeholderami.

### System archiwizacji

Wiadomości są archiwizowane w katalogu `data/archive/` jako pliki tekstowe zawierające metadane oraz pełną treść wiadomości.

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

### Uruchomienie z rozszerzonymi funkcjonalnościami

```bash
./run-advanced.sh
```

Ten skrypt inicjalizuje wszystkie zaawansowane funkcjonalności, w tym system szablonów i archiwizację.

### Uruchomienie za pomocą standardowych skryptów

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
node scripts/setup.js
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

### Testowanie zaawansowanych funkcjonalności

Aplikacja zawiera skrypt do testowania zaawansowanego systemu szablonów:

```bash
./test-advanced-reply.sh [frequent|negative|urgent|new]
```

Gdzie:
- `frequent` - Testuje szablon dla częstych nadawców
- `negative` - Testuje szablon dla powtarzających się negatywnych opinii
- `urgent` - Testuje szablon dla pilnych wiadomości
- `new` - Testuje szablon dla nowych użytkowników

### Standardowe testowanie

1. Otwórz interfejs MailHog pod adresem http://localhost:8025
2. Wyślij testową wiadomość e-mail na adres skonfigurowany w zmiennych środowiskowych (domyślnie test@example.com)
3. Aplikacja powinna odebrać wiadomość, przetworzyć ją i wysłać automatyczną odpowiedź (jeśli spełnione są kryteria)
4. Sprawdź w MailHog czy otrzymałeś odpowiedź
5. Możesz również sprawdzić bazę danych przez Adminer, aby zobaczyć zapisane wiadomości i wyniki analizy

### Testowanie API

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

### Testowanie API szablonów

```bash
# Pobieranie listy wszystkich szablonów
curl -X GET http://localhost:8080/api/templates

# Pobieranie konkretnego szablonu
curl -X GET http://localhost:8080/api/templates/urgent_critical
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
- **advancedReplyService.js** - zarządzanie szablonami i personalizacją odpowiedzi

### src/utils
Zawiera narzędzia pomocnicze:
- **emailParser.js** - narzędzia do parsowania wiadomości email
- **dbUtils.js** - narzędzia do komunikacji z bazą danych
- **camelContext.js** - konfiguracja kontekstu Apache Camel

### camel-routes.xml
Definicja tras Apache Camel w formacie XML, zawiera trasy dla zaawansowanych funkcjonalności.

### scripts
Skrypty instalacyjne i uruchomieniowe:
- **install.sh/.bat** - skrypty instalacyjne
- **start.sh/.bat** - skrypty uruchomieniowe
- **setup-db.js** - skrypt inicjalizujący bazę danych
- **setup.js** - skrypt inicjalizujący zaawansowane funkcjonalności

## System szablonów i automatycznych odpowiedzi

### Zasada działania

System automatycznych odpowiedzi wykorzystuje kombinację danych z bazy SQLite oraz plików szablonów przechowywanych w systemie plików. Dzięki temu może generować spersonalizowane odpowiedzi dostosowane do kontekstu komunikacji z danym nadawcą.

### Struktura katalogów

Szablony odpowiedzi są przechowywane w katalogu `data/templates/` w postaci plików tekstowych z rozszerzeniem `.template`. Każdy szablon zawiera tekst odpowiedzi z placeholderami, które są zastępowane rzeczywistymi danymi podczas generowania odpowiedzi.

### Rodzaje szablonów

System zawiera następujące rodzaje szablonów:

- `default.template` - domyślny szablon odpowiedzi
- `urgent_critical.template` - odpowiedź na wiadomości o krytycznej pilności
- `negative_repeated.template` - odpowiedź na powtarzające się wiadomości o negatywnym sentymencie
- `frequent_sender.template` - odpowiedź dla częstych nadawców

### Placeholdery w szablonach

Szablony mogą zawierać następujące placeholdery, które są zastępowane rzeczywistymi danymi:

- `{{SENDER_NAME}}` - imię nadawcy (ekstrahowane z adresu email)
- `{{SUBJECT}}` - temat wiadomości
- `{{CURRENT_DATE}}` - bieżąca data
- `{{SENTIMENT}}` - sentyment wiadomości w języku polskim
- `{{URGENCY}}` - pilność wiadomości w języku polskim
- `{{SUMMARY}}` - krótkie podsumowanie treści wiadomości
- `{{EMAIL_COUNT}}` - liczba wiadomości otrzymanych od tego nadawcy
- `{{LAST_EMAIL_DATE}}` - data ostatniej wiadomości od tego nadawcy

### Przykład szablonu

```
Szanowny/a {{SENDER_NAME}},

Dziękujemy za Twoją wiadomość dotyczącą: "{{SUBJECT}}".

Doceniamy Twoją lojalność i częsty kontakt z nami. Jako nasz stały klient, Twoja sprawa zostanie rozpatrzona priorytetowo.

To już Twoja {{EMAIL_COUNT}}. wiadomość do nas. Ostatnio kontaktowałeś/aś się z nami {{LAST_EMAIL_DATE}}.

Z poważaniem,
Zespół Obsługi Klienta
```

### Proces wyboru szablonu

Wybór odpowiedniego szablonu odbywa się na podstawie następujących kryteriów:

1. Pilność wiadomości (CRITICAL, HIGH, NORMAL, LOW)
2. Sentyment wiadomości (VERY_NEGATIVE, NEGATIVE, NEUTRAL, POSITIVE, VERY_POSITIVE)
3. Historia komunikacji z nadawcą (pierwszy kontakt, częsty nadawca, powtarzające się skargi)

Algorytm wyboru szablonu jest zaimplementowany w metodzie `selectTemplateKey()` klasy `AdvancedReplyService`.

## Archiwizacja wiadomości

### Cel archiwizacji

System automatycznie archiwizuje wszystkie otrzymane wiadomości email do plików tekstowych w celu:
- Zachowania pełnej historii komunikacji
- Umożliwienia dostępu do wiadomości nawet w przypadku awarii bazy danych
- Ułatwienia analizy wiadomości przez inne narzędzia

### Struktura katalogów

Zarchiwizowane wiadomości są przechowywane w katalogu `data/archive/` w postaci plików tekstowych. Nazwy plików zawierają timestamp oraz adres nadawcy, co umożliwia łatwe wyszukiwanie wiadomości.

### Format plików archiwalnych

Każdy plik archiwalny zawiera:
- Nagłówki wiadomości (From, To, Subject, Received, Status)
- Wyniki analizy (Sentiment, Urgency)
- Pustą linię
- Pełną treść wiadomości

Przykład:
```
From: user@example.com
To: test@example.com
Subject: Zapytanie o produkt
Received: 2025-05-19T22:27:10+02:00
Status: RECEIVED
Sentiment: NEUTRAL
Urgency: NORMAL

Dzień dobry,

Mam pytanie dotyczące Waszego produktu XYZ.
Czy jest on dostępny w kolorze niebieskim?

Pozdrawiam,
Jan Kowalski
```

## REST API

### Przetwarzanie wiadomości e-mail

```http
POST /api/emails/process
Content-Type: application/json

{
  "from": "nadawca@example.com",
  "to": "odbiorca@example.com",
  "subject": "Przykładowy temat",
  "content": "Treść wiadomości do przetworzenia"
}
```

### Zarządzanie szablonami

```http
GET /api/templates
```

Zwraca listę wszystkich dostępnych szablonów.

```http
GET /api/templates/{templateKey}
```

Zwraca treść konkretnego szablonu.

### Sprawdzenie stanu aplikacji

```http
GET /health
```

Zwraca informacje o stanie aplikacji i jej komponentów.

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

### Dostosowanie systemu szablonów

Aby dostosować system szablonów:

1. Dodaj nowe pliki szablonów w katalogu `data/templates/` z rozszerzeniem `.template`
2. Zmodyfikuj logikę wyboru szablonu w metodzie `selectTemplateKey()` w klasie `AdvancedReplyService`
3. Dodaj nowe placeholdery w metodzie `fillTemplate()` w klasie `AdvancedReplyService`

### Dostosowanie archiwizacji wiadomości

Aby dostosować system archiwizacji wiadomości:

1. Zmodyfikuj metodę `archiveEmail()` w klasie `EmailService`
2. Dostosuj format pliku archiwalnego według potrzeb

## Integracja z LLM

### Prompt dla modelu LLM

Aplikacja używa następującego promptu do analizy tonu wiadomości:

```
Przeanalizuj poniższą wiadomość email i podaj:
1. Ogólny sentyment (VERY_NEGATIVE, NEGATIVE, NEUTRAL, POSITIVE, VERY_POSITIVE)
2. Główne emocje (ANGER, FEAR, HAPPINESS, SADNESS, SURPRISE, DISGUST, NEUTRAL) z wartościami od 0 do 1
3. Pilność (LOW, NORMAL, HIGH, CRITICAL)
4. Formalność (VERY_INFORMAL, INFORMAL, NEUTRAL, FORMAL, VERY_FORMAL)
5. Główne tematy (lista słów kluczowych)
6. Krótkie podsumowanie treści

Odpowiedź podaj w formacie JSON.

Wiadomość:
[TREŚĆ WIADOMOŚCI]
```

### Format odpowiedzi

Oczekiwany format odpowiedzi od modelu LLM:

```json
{
    "sentiment": "NEUTRAL",
    "emotions": {
        "NEUTRAL": 0.8,
        "HAPPINESS": 0.2
    },
    "urgency": "NORMAL",
    "formality": "NEUTRAL",
    "topTopics": ["zapytanie", "informacja"],
    "summaryText": "Wiadomość zawiera ogólne zapytanie o informacje."
}
```

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

### Problem: Szablony nie są ładowane

Sprawdź:
- Czy katalog `data/templates/` istnieje i zawiera pliki z rozszerzeniem `.template`
- Logi aplikacji w poszukiwaniu błędów ładowania szablonów
- Wykonaj `curl http://localhost:8080/api/templates` aby sprawdzić, czy API widzi szablony

### Problem: Archiwizacja nie działa

Sprawdź:
- Czy katalog `data/archive/` istnieje i czy aplikacja ma uprawnienia do zapisu
- Logi aplikacji w poszukiwaniu błędów podczas archiwizacji
- Sprawdź, czy po przetworzeniu wiadomości pojawiają się nowe pliki w katalogu archiwum

## Wsparcie

W przypadku problemów lub pytań:
1. Sprawdź logi aplikacji: `docker-compose logs app`
2. Sprawdź dokumentację Apache Camel: https://camel.apache.org/
3. Uruchom skrypt testowy: `./test-advanced-reply.sh frequent` aby sprawdzić działanie zaawansowanych funkcjonalności
4. Zgłoś problem w repozytorium projektu