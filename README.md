# Email LLM Processor - Dokumentacja

## Przegląd

Email LLM Processor to minimalistyczna aplikacja napisana w Kotlinie z użyciem Apache Camel, umożliwiająca automatyczne przetwarzanie, analizę i generowanie odpowiedzi na wiadomości e-mail przy użyciu modeli językowych (LLM).

Aplikacja została zaprojektowana w podejściu skryptowym, bez wykorzystania frameworków takich jak Spring Boot, co minimalizuje ilość kodu i zależności, jednocześnie zachowując wszystkie niezbędne funkcjonalności.

## Funkcjonalności

- Odbieranie wiadomości e-mail przez IMAP
- Wysyłanie wiadomości e-mail przez SMTP
- Analiza treści wiadomości przy użyciu modeli językowych (LLM)
- Automatyczne generowanie odpowiedzi
- Przechowywanie wiadomości w lokalnej bazie danych SQLite

## Architektura

### Struktura projektu

Projekt jest zorganizowany w następujący sposób:

```
src/main/kotlin/com/emailprocessor/
├── Main.kt                     # Główny punkt wejścia aplikacji
├── model/                     # Modele danych
│   ├── EmailMessage.kt        # Model wiadomości email
│   └── ToneAnalysis.kt        # Model analizy tonu
├── routes/                    # Trasy Apache Camel
│   ├── EmailProcessingRoute.kt # Odbieranie i przetwarzanie emaili
│   └── EmailSendingRoute.kt   # Wysyłanie automatycznych odpowiedzi
├── services/                  # Serwisy biznesowe
│   ├── EmailService.kt        # Logika przetwarzania emaili
│   └── LlmService.kt          # Integracja z modelami językowymi
└── util/                     # Narzędzia pomocnicze
    └── EmailParser.kt         # Parser wiadomości email
```

### Główne komponenty

1. **Main.kt** - punkt wejścia aplikacji, odpowiedzialny za inicjalizację wszystkich komponentów i uruchomienie Apache Camel. Zawiera konfigurację aplikacji, ładowanie zmiennych środowiskowych i inicjalizację bazy danych.

2. **EmailProcessingRoute.kt** - trasa Camel odpowiedzialna za odbieranie i przetwarzanie wiadomości e-mail. Implementuje następujący przepływ:
   - Odbieranie wiadomości przez IMAP
   - Parsowanie wiadomości do modelu EmailMessage
   - Zapisywanie wiadomości w bazie danych SQLite
   - Przetwarzanie wiadomości przez EmailService
   - Decydowanie o wysłaniu automatycznej odpowiedzi

3. **EmailSendingRoute.kt** - trasa Camel odpowiedzialna za wysyłanie automatycznych odpowiedzi. Formatuje odpowiedzi na podstawie analizy tonu i wysyła je przez SMTP.

4. **EmailService.kt** - serwis zawierający logikę biznesową przetwarzania wiadomości. Odpowiada za:
   - Przetwarzanie wiadomości email
   - Decydowanie o automatycznej odpowiedzi na podstawie analizy tonu
   - Generowanie treści odpowiedzi

5. **LlmService.kt** - serwis do komunikacji z API modelu językowego. Odpowiada za:
   - Tworzenie promptów dla modelu LLM
   - Wysyłanie zapytań do API modelu (Ollama)
   - Parsowanie odpowiedzi i tworzenie obiektów ToneAnalysis

6. **EmailParser.kt** - narzędzie do parsowania wiadomości e-mail. Obsługuje różne formaty wiadomości (plain text, HTML, multipart) i ekstrahuje załączniki.

### Model danych

1. **EmailMessage.kt** - model reprezentujący wiadomość e-mail z następującymi polami:
   - id: identyfikator wiadomości
   - from: adres nadawcy
   - to: adres odbiorcy
   - subject: temat wiadomości
   - content: treść wiadomości
   - receivedDate: data otrzymania
   - processedDate: data przetworzenia
   - toneAnalysis: wynik analizy tonu
   - status: status przetwarzania (RECEIVED, PROCESSING, PROCESSED, REPLIED, ERROR)

2. **ToneAnalysis.kt** - model reprezentujący analizę tonu wiadomości z następującymi polami:
   - sentiment: ogólny sentyment (VERY_NEGATIVE, NEGATIVE, NEUTRAL, POSITIVE, VERY_POSITIVE)
   - emotions: mapa emocji z wartościami intensywności (ANGER, FEAR, HAPPINESS, SADNESS, SURPRISE, DISGUST, NEUTRAL)
   - urgency: pilność (LOW, NORMAL, HIGH, CRITICAL)
   - formality: formalność (VERY_INFORMAL, INFORMAL, NEUTRAL, FORMAL, VERY_FORMAL)
   - topTopics: lista głównych tematów
   - summaryText: krótkie podsumowanie treści

### Baza danych

Aplikacja wykorzystuje prostą bazę danych SQLite do przechowywania wiadomości e-mail i wyników analizy.

## Wymagania

- Java 17 lub nowsza
- Gradle 8.0 lub nowszy
- Docker i Docker Compose (do uruchomienia w kontenerach)

## Uruchomienie

### Przygotowanie środowiska

1. Sklonuj repozytorium:
   ```
   git clone https://github.com/yourusername/email-llm-processor.git
   cd email-llm-processor
   ```

2. Skopiuj plik przykładowy .env.example do .env:
   ```
   cp .env.example .env
   ```

3. Dostosuj zmienne w pliku .env według potrzeb.

### Uruchomienie z Docker Compose

```
docker-compose up -d
```

To polecenie uruchomi:
- Aplikację Email LLM Processor
- Serwer testowy MailHog do odbioru/wysyłania wiadomości
- Serwer Ollama do hostowania modelu LLM
- Adminer do zarządzania bazą danych SQLite

### Uruchomienie lokalne bez Dockera

1. Zbuduj projekt:
   ```
   ./gradlew build
   ```

2. Uruchom aplikację:
   ```
   ./gradlew run
   ```

## Dostęp do usług

Po uruchomieniu docker-compose, następujące usługi będą dostępne:

| Usługa | URL | Opis |
|--------|-----|------|
| MailHog | http://localhost:8025 | Interfejs testowy do przeglądania wiadomości |
| Adminer | http://localhost:8081 | Panel zarządzania bazą danych |

## Testowanie

Aby przetestować aplikację:

1. Otwórz interfejs MailHog pod adresem http://localhost:8025
2. Wyślij testową wiadomość e-mail na adres skonfigurowany w zmiennych środowiskowych (domyślnie test@example.com)
3. Aplikacja powinna odebrać wiadomość, przetworzyć ją i wysłać automatyczną odpowiedź (jeśli spełnione są kryteria)
4. Sprawdź w MailHog czy otrzymałeś odpowiedź
5. Możesz również sprawdzić bazę danych przez Adminer, aby zobaczyć zapisane wiadomości i wyniki analizy

## Rozszerzanie funkcjonalności

### Dodawanie nowych tras Camel

Aby dodać nową trasę Camel:
1. Utwórz nową klasę implementującą RouteBuilder w katalogu `src/main/kotlin/com/emailprocessor/routes/`
2. Zaimplementuj metodę `configure()`
3. Zarejestruj trasę w `Main.kt` dodając ją do `camelMain.configure().addRoutesBuilder()`

### Dostosowanie analizy LLM

Aby dostosować analizę LLM:
1. Zmodyfikuj prompt w metodzie `createAnalysisPrompt()` w klasie `LlmService.kt`
2. Dostosuj parsowanie odpowiedzi w metodzie `parseAnalysisResponse()`
3. Rozszerz model `ToneAnalysis.kt` o dodatkowe pola, jeśli są potrzebne

## Ograniczenia

Ta minimalistyczna wersja ma pewne ograniczenia:
- Brak interfejsu użytkownika/API REST
- Brak zaawansowanego zarządzania błędami
- Uproszczona obsługa załączników
- Brak systemu uwierzytelniania i autoryzacji
- Zaślepki w komunikacji z LLM (w pełnej implementacji należałoby zintegrować się z rzeczywistym API)

## Przepływ przetwarzania wiadomości

### Diagram przepływu

```
+---------------+    +-------------------+    +-------------------+
|               |    |                   |    |                   |
| Serwer Email  |--->| EmailProcessing   |--->| LLM Service       |
| (IMAP)        |    | Route            |    | (Analiza tonu)    |
|               |    |                   |    |                   |
+---------------+    +-------------------+    +-------------------+
                                |                       |
                                v                       |
                     +-------------------+              |
                     |                   |              |
                     | Baza danych       |<-------------+
                     | SQLite            |
                     |                   |
                     +-------------------+
                                |
                                v
                     +-------------------+    +-------------------+
                     |                   |    |                   |
                     | Email Service     |--->| EmailSending      |
                     | (Decyzja o        |    | Route             |
                     |  odpowiedzi)      |    | (SMTP)            |
                     +-------------------+    +-------------------+
                                                       |
                                                       v
                                               +---------------+
                                               |               |
                                               | Serwer Email  |
                                               | (Odbiorca)    |
                                               |               |
                                               +---------------+
```

### Szczegółowy opis przepływu

1. **Odbieranie wiadomości**:
   - Komponent IMAP Apache Camel regularnie sprawdza skrzynkę pocztową
   - Nowe wiadomości są pobierane i przekazywane do trasy przetwarzania

2. **Parsowanie wiadomości**:
   - `EmailParser` ekstrahuje nadawcę, odbiorcę, temat i treść wiadomości
   - Wiadomość jest konwertowana do modelu `EmailMessage`

3. **Zapisywanie w bazie danych**:
   - Wiadomość jest zapisywana w tabeli `emails` w bazie SQLite
   - Status wiadomości jest ustawiany na `RECEIVED`

4. **Analiza tonu**:
   - `LlmService` wysyła treść wiadomości do API modelu językowego (Ollama)
   - Model analizuje sentyment, emocje, pilność i formalność wiadomości
   - Wyniki są parsowane do modelu `ToneAnalysis`

5. **Decyzja o odpowiedzi**:
   - `EmailService` na podstawie analizy tonu decyduje, czy wysłać automatyczną odpowiedź
   - Wiadomości pilne lub o negatywnym sentymencie otrzymują automatyczną odpowiedź

6. **Generowanie odpowiedzi**:
   - Jeśli zdecydowano o odpowiedzi, `EmailService` generuje odpowiednią treść
   - Treść jest dostosowana do tonu oryginalnej wiadomości

7. **Wysyłanie odpowiedzi**:
   - `EmailSendingRoute` formatuje wiadomość odpowiedzi
   - Odpowiedź jest wysyłana przez SMTP do oryginalnego nadawcy
   - Status wiadomości jest aktualizowany na `REPLIED`

## Informacje dodatkowe

### Dlaczego Apache Camel?

Apache Camel został wybrany jako główny komponent integracyjny ze względu na:
- Prostotę w definiowaniu tras przetwarzania
- Gotowe komponenty do obsługi poczty (IMAP, SMTP)
- Elastyczność w konfiguracji
- Niski narzut w porównaniu do pełnych frameworków

### Dlaczego SQLite?

SQLite zostało wybrane jako baza danych ze względu na:
- Brak potrzeby instalacji osobnego serwera
- Przechowywanie danych w jednym pliku
- Prostota konfiguracji i użycia
- Wystarczająca wydajność dla małych i średnich obciążeń

### Dlaczego Ollama?

Ollama zostało wybrane jako serwer modeli językowych ze względu na:
- Możliwość uruchomienia lokalnie bez potrzeby dostępu do internetu
- Wsparcie dla różnych modeli językowych (np. Llama2)
- Proste API REST
- Niskie wymagania sprzętowe w porównaniu do innych rozwiązań