# Alternatywy dla Apache Camel w projekcie Email LLM Processor

Dla realizacji projektu Email LLM Processor z mniejszą ilością kodu niż przy użyciu Apache Camel, można rozważyć następujące technologie i języki:

## 1. Node.js z Express.js i nodemailer

**Zalety:**
- Znacznie mniejsza ilość kodu konfiguracyjnego
- Natywna asynchroniczność JavaScript
- Bogaty ekosystem bibliotek npm
- Łatwiejsza integracja z bazami danych i API

**Przykład implementacji:**
```javascript
const express = require('express');
const nodemailer = require('nodemailer');
const Imap = require('node-imap');
const simpleParser = require('mailparser').simpleParser;
const sqlite3 = require('better-sqlite3');
const axios = require('axios');

// Inicjalizacja expressJS
const app = express();
app.use(express.json());

// Inicjalizacja transportera email
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASSWORD }
});

// Funkcja do odebrania emaili
function fetchEmails() {
  const imap = new Imap({
    user: process.env.EMAIL_USER,
    password: process.env.EMAIL_PASSWORD,
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    tls: false
  });
  
  imap.connect();
  imap.once('ready', () => {
    imap.openBox('INBOX', false, (err, box) => {
      imap.search(['UNSEEN'], (err, results) => {
        // Przetwarzanie nowych wiadomości
        // ...
      });
    });
  });
}

// API endpoint do przetwarzania wiadomości
app.post('/api/emails/process', async (req, res) => {
  // Logika przetwarzania...
});

// Uruchomienie aplikacji
app.listen(8080, () => {
  console.log('Serwer uruchomiony na porcie 8080');
  // Uruchomienie cyklicznego sprawdzania emaili
  setInterval(fetchEmails, 60000);
});
```

## 2. Python z FastAPI i aiosmtplib/imaplib

**Zalety:**
- Niezwykle zwięzły i czytelny kod
- Wbudowane typy danych ułatwiające przetwarzanie
- Biblioteki do przetwarzania języka naturalnego (NLTK, spaCy)
- Asynchroniczne API z FastAPI

**Przykład implementacji:**
```python
from fastapi import FastAPI, BackgroundTasks
from pydantic import BaseModel
import imaplib
import email
import email.header
import smtplib
import sqlite3
import httpx
import asyncio
import os
from email.mime.text import MIMEText

app = FastAPI()

# Model danych
class EmailMessage(BaseModel):
    from_address: str
    to_address: str
    subject: str = None
    content: str = None

# Połączenie z bazą danych
def get_db():
    conn = sqlite3.connect("data/emails.db")
    conn.row_factory = sqlite3.Row
    return conn

# Analiza LLM
async def analyze_tone(content: str):
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{os.getenv('LLM_API_URL')}/api/generate",
            json={"model": os.getenv("LLM_MODEL"), "prompt": f"Analyze this email: {content}"}
        )
        return response.json()

# Funkcja do pobierania emaili (uruchamiana w tle)
async def fetch_emails():
    mail = imaplib.IMAP4_SSL(os.getenv("EMAIL_HOST"), int(os.getenv("EMAIL_PORT")))
    mail.login(os.getenv("EMAIL_USER"), os.getenv("EMAIL_PASSWORD"))
    mail.select('inbox')
    
    status, messages = mail.search(None, 'UNSEEN')
    for num in messages[0].split():
        # Przetwarzanie wiadomości
        # ...
        
    mail.close()
    mail.logout()

# Endpoint API
@app.post("/api/emails/process")
async def process_email(email_message: EmailMessage, background_tasks: BackgroundTasks):
    # Logika przetwarzania
    # ...
    return {"status": "accepted"}

# Cykliczne uruchamianie fetch_emails
@app.on_event("startup")
async def startup():
    asyncio.create_task(periodic_fetch())

async def periodic_fetch():
    while True:
        await fetch_emails()
        await asyncio.sleep(60)  # Co minutę
```

## 3. Golang z bibliotekami net/mail i net/smtp

**Zalety:**
- Wyjątkowo wydajny kod
- Kompilowany, statycznie typowany język
- Doskonała obsługa współbieżności z gorutynami
- Małe zużycie pamięci i zasobów

**Przykład implementacji:**
```go
package main

import (
    "database/sql"
    "encoding/json"
    "fmt"
    "log"
    "net/http"
    "net/mail"
    "net/smtp"
    "os"
    "time"
    
    "github.com/emersion/go-imap"
    "github.com/emersion/go-imap/client"
    "github.com/gin-gonic/gin"
    "github.com/joho/godotenv"
    _ "github.com/mattn/go-sqlite3"
)

// Struktura wiadomości
type EmailMessage struct {
    From    string `json:"from"`
    To      string `json:"to"`
    Subject string `json:"subject"`
    Content string `json:"content"`
}

// Usługa do analizy LLM
func analyzeTone(content string) (map[string]interface{}, error) {
    // Implementacja analizy
    // ...
    return nil, nil
}

// Funkcja do pobierania wiadomości
func fetchEmails() {
    // Połączenie IMAP
    c, err := client.DialTLS(fmt.Sprintf("%s:%s", os.Getenv("EMAIL_HOST"), os.Getenv("EMAIL_PORT")), nil)
    if err != nil {
        log.Fatal(err)
    }
    defer c.Logout()
    
    // Logowanie
    if err := c.Login(os.Getenv("EMAIL_USER"), os.Getenv("EMAIL_PASSWORD")); err != nil {
        log.Fatal(err)
    }
    
    // Wybór skrzynki
    mbox, err := c.Select("INBOX", false)
    if err != nil {
        log.Fatal(err)
    }
    
    // Pobieranie wiadomości
    criteria := imap.NewSearchCriteria()
    criteria.WithoutFlags = []string{"\\Seen"}
    ids, err := c.Search(criteria)
    if err != nil {
        log.Fatal(err)
    }
    
    // Przetwarzanie wiadomości
    // ...
}

func main() {
    godotenv.Load()
    
    // Ustawienie routera Gin
    r := gin.Default()
    
    // API endpoint
    r.POST("/api/emails/process", func(c *gin.Context) {
        var msg EmailMessage
        if err := c.BindJSON(&msg); err != nil {
            c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
            return
        }
        
        // Logika przetwarzania
        // ...
        
        c.JSON(http.StatusAccepted, gin.H{"status": "accepted"})
    })
    
    // Uruchomienie cyklicznego pobierania wiadomości
    go func() {
        for {
            fetchEmails()
            time.Sleep(1 * time.Minute)
        }
    }()
    
    // Uruchomienie serwera HTTP
    r.Run(":8080")
}
```

## 4. Ruby z Sinatra i bibliotekami mail/pony

**Zalety:**
- Ekstremalnie zwięzły kod
- Czytelna składnia skupiona na czytelności
- Dynamiczna natura języka ułatwia manipulację danymi
- Prostota wdrożenia

**Przykład implementacji:**
```ruby
require 'sinatra'
require 'json'
require 'sqlite3'
require 'mail'
require 'pony'
require 'httparty'
require 'dotenv/load'

# Konfiguracja emaili
Mail.defaults do
  retriever_method :imap, 
    address: ENV['EMAIL_HOST'],
    port: ENV['EMAIL_PORT'].to_i,
    user_name: ENV['EMAIL_USER'],
    password: ENV['EMAIL_PASSWORD'],
    enable_ssl: false
end

# Funkcja do analizy LLM
def analyze_tone(content)
  response = HTTParty.post("#{ENV['LLM_API_URL']}/api/generate",
    body: {
      model: ENV['LLM_MODEL'],
      prompt: "Analyze this email: #{content}"
    }.to_json,
    headers: { 'Content-Type' => 'application/json' }
  )
  
  JSON.parse(response.body)
end

# Funkcja do pobierania emaili
def fetch_emails
  Mail.find(keys: ['NOT', 'SEEN']).each do |mail|
    # Przetwarzanie wiadomości
    # ...
    
    # Zapisanie do bazy danych
    db = SQLite3::Database.new "data/emails.db"
    db.execute("INSERT INTO emails (from_address, to_address, subject, content, received_date, status) 
                VALUES (?, ?, ?, ?, ?, ?)",
                [mail.from.first, mail.to.join(", "), mail.subject, mail.text_part.body.to_s, 
                 Time.now.iso8601, "RECEIVED"])
  end
end

# Endpoint API
post '/api/emails/process' do
  payload = JSON.parse(request.body.read)
  
  # Logika przetwarzania
  # ...
  
  content_type :json
  { status: "accepted" }.to_json
end

# Cykliczne pobieranie emaili
Thread.new do
  loop do
    fetch_emails
    sleep 60
  end
end
```

## 5. Elixir z Phoenix Framework

**Zalety:**
- Odporność na awarie dzięki modelowi aktorów
- Naturalna współbieżność
- Funkcjonalne podejście redukuje ilość przypadków brzegowych
- Doskonała wydajność pod wysokim obciążeniem

**Przykład implementacji:**
```elixir
defmodule EmailProcessor.Application do
  use Application
  
  def start(_type, _args) do
    children = [
      EmailProcessor.Repo,
      EmailProcessor.Scheduler,
      EmailProcessor.Web.Endpoint
    ]
    
    opts = [strategy: :one_for_one, name: EmailProcessor.Supervisor]
    Supervisor.start_link(children, opts)
  end
end

defmodule EmailProcessor.EmailFetcher do
  use GenServer
  
  def start_link(_) do
    GenServer.start_link(__MODULE__, %{})
  end
  
  def init(state) do
    Process.send_after(self(), :fetch_emails, 1000)
    {:ok, state}
  end
  
  def handle_info(:fetch_emails, state) do
    fetch_emails()
    Process.send_after(self(), :fetch_emails, 60 * 1000) # Co minutę
    {:noreply, state}
  end
  
  defp fetch_emails do
    # Implementacja pobierania emaili przez IMAP
    # ...
  end
end

defmodule EmailProcessor.LlmService do
  def analyze_tone(content) do
    # Implementacja analizy LLM
    # ...
  end
end

defmodule EmailProcessor.Web.EmailController do
  use EmailProcessor.Web, :controller
  
  def process(conn, params) do
    # Logika przetwarzania
    # ...
    
    conn
    |> put_status(:accepted)
    |> json(%{status: "accepted"})
  end
end
```

## Wnioski i rekomendacje

Spośród wymienionych alternatyw, najlepszymi opcjami pod kątem minimalizacji ilości kodu byłyby:

### 1. Node.js z Express.js
**Najlepszy wybór, jeśli już używasz JavaScript/TypeScript**
- Najmniejsza ilość kodu
- Brak potrzeby używania XML do konfiguracji tras
- Łatwa integracja z LLM API, które często mają SDK dla JS

### 2. Python z FastAPI
**Najlepszy wybór, jeśli wydajność przetwarzania języka naturalnego jest priorytetem**
- Bardzo zwięzły kod dzięki funkcjonalnym możliwościom Pythona
- Najlepsze biblioteki do przetwarzania tekstu i integracji z modelami LLM
- Asyncio zapewnia wydajność porównywalną z Node.js

### 3. Ruby z Sinatra
**Najlepszy wybór, jeśli priorytetem jest szybkość developmentu**
- Najbardziej zwięzły kod ze wszystkich opcji
- Bardzo czytelna składnia
- DSL dla ułatwienia definicji tras i logiki biznesowej

Każde z tych rozwiązań byłoby znacznie bardziej zwięzłe niż Apache Camel, który wymaga dużej ilości kodu konfiguracyjnego (szczególnie w formacie XML) oraz dodatkowych komponentów integracyjnych, co zwiększa złożoność systemu.






# Porównanie technologii dla Email LLM Processor

Poniższa tabela przedstawia porównanie różnych technologii jako alternatyw dla Apache Camel w projekcie Email LLM Processor, koncentrując się na ilości kodu, strukturze plików i innych istotnych parametrach.

| Technologia | Ilość kodu | Liczba plików | Konfiguracja | Integracja z LLM | Obsługa email | Złożoność wdrożenia | Skalowalność |
|------------|------------|--------------|--------------|-----------------|--------------|---------------------|--------------|
| **Apache Camel (JS)** | ~1500-2000 linii | 10-12 plików | Wysoka (XML) | Średnia | Gotowe komponenty | Wysoka | Bardzo dobra |
| **Node.js + Express** | ~500-700 linii | 6-8 plików | Niska (JSON) | Łatwa (natywne HTTP) | Via nodemailer, IMAP | Niska | Dobra |
| **Python + FastAPI** | ~400-600 linii | 5-7 plików | Minimalna (Pydantic) | Bardzo łatwa (biblioteki NLP) | Via imaplib, smtplib | Niska | Dobra |
| **Golang** | ~700-900 linii | 6-8 plików | Minimalna | Średnia | Wymaga bibliotek | Średnia | Doskonała |
| **Ruby + Sinatra** | ~300-400 linii | 3-5 plików | Minimalna | Łatwa | Via Mail gem | Bardzo niska | Średnia |
| **Elixir + Phoenix** | ~600-800 linii | 8-10 plików | Średnia | Średnia | Via biblioteki | Średnia | Doskonała |
| **Kotlin (bez Spring)** | ~800-1000 linii | 7-9 plików | Niska | Średnia | Via JavaMail API | Średnia | Dobra |

## Szczegółowa analiza struktur projektu

### Apache Camel (JavaScript)
```
projekt/
├── src/
│   ├── index.js
│   ├── models/ (2-3 pliki)
│   ├── services/ (3-4 pliki)
│   └── utils/ (3-4 pliki)
├── camel-routes.xml (złożona konfiguracja)
├── docker-compose.yml
└── scripts/ (2-3 pliki)
```
**Charakterystyka:**
- Wymaga dużej ilości kodu boilerplate
- Złożona konfiguracja XML
- Wymaga dodatkowej infrastruktury

### Node.js + Express
```
projekt/
├── src/
│   ├── index.js
│   ├── models.js
│   ├── emailService.js
│   ├── llmService.js
│   └── utils.js
├── config.js
└── docker-compose.yml
```
**Charakterystyka:**
- Minimalna konfiguracja
- Prosta struktura projektu
- Kod skupiony na logice biznesowej

### Python + FastAPI
```
projekt/
├── app/
│   ├── main.py
│   ├── models.py
│   ├── services/
│   │   ├── email_service.py
│   │   └── llm_service.py
│   └── utils.py
├── config.py
└── docker-compose.yml
```
**Charakterystyka:**
- Bardzo zwięzła implementacja
- Silne typowanie dzięki Pydantic
- Doskonałe wsparcie dla asyncio

### Ruby + Sinatra
```
projekt/
├── app.rb (główny plik aplikacji)
├── lib/
│   ├── email_service.rb
│   └── llm_service.rb
└── docker-compose.yml
```
**Charakterystyka:**
- Najmniejsza liczba plików
- Najniższa ilość kodu
- Wszystko może być zaimplementowane w jednym pliku

## Przykładowe metryki kodu

### Obsługa odbierania email

| Technologia | Ilość kodu (linie) |
|------------|-------------------|
| Apache Camel | ~100-150 (XML + JS) |
| Node.js + Express | ~50-70 |
| Python + FastAPI | ~40-60 |
| Ruby + Sinatra | ~30-40 |
| Golang | ~60-80 |
| Elixir | ~50-70 |

### Przetwarzanie wiadomości i analiza LLM

| Technologia | Ilość kodu (linie) |
|------------|-------------------|
| Apache Camel | ~200-300 (rozbudowana konfiguracja) |
| Node.js + Express | ~100-150 |
| Python + FastAPI | ~80-120 (z wykorzystaniem bibliotek NLP) |
| Ruby + Sinatra | ~70-100 |
| Golang | ~150-200 |
| Elixir | ~120-170 |

### System szablonów odpowiedzi

| Technologia | Ilość kodu (linie) |
|------------|-------------------|
| Apache Camel | ~250-350 |
| Node.js + Express | ~150-200 |
| Python + FastAPI | ~120-180 |
| Ruby + Sinatra | ~100-150 |
| Golang | ~180-250 |
| Elixir | ~150-220 |

## Wnioski

1. **Ruby z Sinatra** wymaga **najmniejszej ilości kodu i plików**, oferując bardzo zwięzłą implementację.

2. **Python z FastAPI** zapewnia dobry balans między ilością kodu a funkcjonalnością, szczególnie dla zadań związanych z NLP i analizą tekstów.

3. **Node.js z Express** oferuje zbliżoną zwięzłość do Pythona, z lepszym wsparciem asynchronicznym i bogatym ekosystemem bibliotek.

4. **Apache Camel** wymaga **znacznie więcej kodu i konfiguracji** niż pozostałe opcje, ale oferuje bardzo dobre możliwości integracyjne i skalowalność.

5. **Golang** i **Elixir** wymagają więcej kodu niż Ruby czy Python, ale oferują doskonałą wydajność i skalowalność, co może być istotne przy większych obciążeniach.

Ostateczny wybór technologii powinien zależeć od priorytetów projektu (minimalna ilość kodu vs. wydajność vs. łatwość utrzymania), doświadczenia zespołu oraz przewidywanej skali działania aplikacji.