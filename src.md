email-llm-processor-js/
├── package.json                    # Konfiguracja npm i zależności
├── camel-routes.xml                # Definicja tras Apache Camel w XML
├── docker-compose.yml              # Konfiguracja Docker Compose
├── Dockerfile                      # Definicja obrazu Docker
├── .env.example                    # Przykładowe zmienne środowiskowe
├── scripts/
│   ├── install.sh                  # Skrypt instalacyjny (Linux/Mac)
│   ├── install.bat                 # Skrypt instalacyjny (Windows)
│   ├── start.sh                    # Skrypt uruchomieniowy (Linux/Mac)
│   ├── start.bat                   # Skrypt uruchomieniowy (Windows)
│   └── setup-db.js                 # Skrypt tworzący bazę danych
├── src/
│   ├── index.js                    # Główny punkt wejścia aplikacji
│   ├── models/
│   │   ├── emailMessage.js         # Model wiadomości email
│   │   └── toneAnalysis.js         # Model analizy tonu wiadomości
│   ├── services/
│   │   ├── emailService.js         # Usługa do obsługi email
│   │   └── llmService.js           # Usługa do komunikacji z LLM
│   └── utils/
│       ├── emailParser.js          # Narzędzie do parsowania emaili
│       ├── camelContext.js         # Konfiguracja kontekstu Apache Camel
│       └── dbUtils.js              # Narzędzia do obsługi bazy danych
├── config/
│   ├── camel-context.xml           # Główna konfiguracja kontekstu Camel
│   └── log4j2.properties           # Konfiguracja logowania
└── data/
    └── emails.db                   # Lokalna baza danych SQLite (tworzona automatycznie)
