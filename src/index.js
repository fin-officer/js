/**
 * Inicjalizacja i główny punkt wejścia aplikacji
 */
const fs = require('fs').promises;
const path = require('path');
const { createCamelContext } = require('./utils/camelContext');
const express = require('express');
const log4js = require('log4js');
const { loadConfig } = require('./utils/dbUtils');
require('dotenv').config();

// Konfiguracja loggera
log4js.configure({
  appenders: {
    console: { type: 'console' },
    file: { type: 'file', filename: 'logs/app.log' }
  },
  categories: {
    default: { appenders: ['console', 'file'], level: process.env.LOG_LEVEL || 'info' }
  }
});

const logger = log4js.getLogger('main');

// Inicjalizacja serwisów
const LlmService = require('./services/llmService');
const AdvancedReplyService = require('./services/advancedReplyService');
const EmailService = require('./services/emailService');

// Utworzenie Express app dla REST API
const app = express();
app.use(express.json());

// Globalne serwisy
let llmService;
let advancedReplyService;
let emailService;

// Utworzenie kontekstu Apache Camel
async function startCamelContext() {
  try {
    logger.info('Inicjalizacja kontekstu Apache Camel...');

    // Ładowanie konfiguracji z bazy danych
    const config = await loadConfig();
    logger.info('Konfiguracja załadowana:', config);

    // Tworzenie i konfiguracja kontekstu Camel
    const camelContext = createCamelContext();

    // Inicjalizacja serwisów
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/emails.db');

    // LLM Service
    llmService = new LlmService(
      process.env.LLM_API_URL || 'http://localhost:11434',
      process.env.LLM_MODEL || 'llama2'
    );

    // Advanced Reply Service
    advancedReplyService = new AdvancedReplyService(dbPath);

    // Email Service
    emailService = new EmailService(
      llmService,
      advancedReplyService,
      dbPath,
      path.join(__dirname, '../data/archive')
    );

    // Rejestracja serwisów jako beany
    camelContext.registry.bind('emailService', emailService);
    camelContext.registry.bind('llmService', llmService);
    camelContext.registry.bind('advancedReplyService', advancedReplyService);

    // Ładowanie tras Camel z pliku XML
    const routesXml = await fs.readFile(path.join(__dirname, '../camel-routes.xml'), 'utf8');
    camelContext.addRoutes(routesXml);

    // Ustawienie właściwości dla tras
    camelContext.propertyPlaceholderService.setProperty('email.host', process.env.EMAIL_HOST || 'localhost');
    camelContext.propertyPlaceholderService.setProperty('email.port', process.env.EMAIL_PORT || '1025');
    camelContext.propertyPlaceholderService.setProperty('email.username', process.env.EMAIL_USER || 'test@example.com');
    camelContext.propertyPlaceholderService.setProperty('email.password', process.env.EMAIL_PASSWORD || 'password');
    camelContext.propertyPlaceholderService.setProperty('llm.api.url', process.env.LLM_API_URL || 'http://localhost:11434');
    camelContext.propertyPlaceholderService.setProperty('llm.model', process.env.LLM_MODEL || 'llama2');

    // Uruchomienie kontekstu Camel
    await camelContext.start();
    logger.info('Kontekst Apache Camel uruchomiony.');

    return camelContext;
  } catch (error) {
    logger.error('Błąd podczas uruchamiania kontekstu Apache Camel:', error);
    throw error;
  }
}

// Endpoint API dla ręcznego przetwarzania wiadomości
app.post('/api/emails/process', async (req, res) => {
  try {
    const { from, to, subject, content } = req.body;

    if (!from || !to) {
      return res.status(400).json({
        error: 'Brakujące wymagane pola',
        message: 'Pola "from" i "to" są wymagane'
      });
    }

    // Ręczne wywołanie trasy przetwarzania email
    global.camelContext.createProducerTemplate().send('direct:process-email', exchange => {
      exchange.message.body = content;
      exchange.message.headers.from = from;
      exchange.message.headers.to = to;
      exchange.message.headers.subject = subject || '';
    });

    res.status(202).json({
      status: 'accepted',
      message: 'Wiadomość przyjęta do przetworzenia'
    });
  } catch (error) {
    logger.error('Błąd podczas przetwarzania żądania API:', error);
    res.status(500).json({
      error: 'Błąd wewnętrzny serwera',
      message: error.message
    });
  }
});

// Endpoint API dla uzyskania szablonu odpowiedzi
app.get('/api/templates/:key', async (req, res) => {
  try {
    const templateKey = req.params.key;

    if (!advancedReplyService || !advancedReplyService.templates) {
      return res.status(503).json({
        error: 'Serwis szablonów niedostępny',
        message: 'Serwis szablonów nie został jeszcze zainicjalizowany'
      });
    }

    const template = advancedReplyService.templates[templateKey];

    if (!template) {
      return res.status(404).json({
        error: 'Szablon nie znaleziony',
        message: `Szablon o kluczu "${templateKey}" nie istnieje`
      });
    }

    res.json({
      key: templateKey,
      content: template
    });
  } catch (error) {
    logger.error('Błąd podczas pobierania szablonu:', error);
    res.status(500).json({
      error: 'Błąd wewnętrzny serwera',
      message: error.message
    });
  }
});

// Endpoint API dla listy wszystkich szablonów
app.get('/api/templates', async (req, res) => {
  try {
    if (!advancedReplyService || !advancedReplyService.templates) {
      return res.status(503).json({
        error: 'Serwis szablonów niedostępny',
        message: 'Serwis szablonów nie został jeszcze zainicjalizowany'
      });
    }

    const templateKeys = Object.keys(advancedReplyService.templates);

    res.json({
      templates: templateKeys.map(key => ({
        key: key,
        preview: advancedReplyService.templates[key].substring(0, 100) + '...'
      }))
    });
  } catch (error) {
    logger.error('Błąd podczas pobierania listy szablonów:', error);
    res.status(500).json({
      error: 'Błąd wewnętrzny serwera',
      message: error.message
    });
  }
});

// Endpoint zdrowia aplikacji
app.get('/health', (req, res) => {
  const status = global.camelContext && global.camelContext.status === 'Started' ? 'UP' : 'DOWN';
  res.json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      llmService: llmService ? 'UP' : 'DOWN',
      advancedReplyService: advancedReplyService ? 'UP' : 'DOWN',
      emailService: emailService ? 'UP' : 'DOWN'
    }
  });
});

// Główna funkcja startowa
async function main() {
  try {
    logger.info('Uruchamianie Email LLM Processor...');

    // Sprawdzenie, czy baza danych istnieje, jeśli nie, utworzenie jej
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/emails.db');
    try {
      await fs.access(dbPath);
    } catch (error) {
      logger.info('Baza danych nie istnieje, inicjalizacja...');
      // Uruchom skrypt inicjalizujący bazę danych
      require('../scripts/setup-db.js');
    }

    // Uruchomienie kontekstu Camel
    global.camelContext = await startCamelContext();

    // Uruchomienie serwera Express
    const port = process.env.APP_PORT || 8080;
    app.listen(port, () => {
      logger.info(`Serwer HTTP uruchomiony na porcie ${port}`);
    });

    // Inicjalizacja katalogów dla szablonów, jeśli nie istnieją
    const templatesDir = path.join(__dirname, '../data/templates');
    try {
      await fs.access(templatesDir);
    } catch (error) {
      logger.info('Katalog szablonów nie istnieje, tworzenie...');
      await fs.mkdir(templatesDir, { recursive: true });

      // Kopiuj przykładowe szablony
      await copyDefaultTemplates(templatesDir);
    }

    // Obsługa sygnałów zakończenia procesu
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

    logger.info('Email LLM Processor jest gotowy do pracy!');

  } catch (error) {
    logger.error('Błąd podczas uruchamiania aplikacji:', error);
    process.exit(1);
  }
}

// Funkcja kopiująca przykładowe szablony
async function copyDefaultTemplates(templatesDir) {
  try {
    // Definicje przykładowych szablonów
    const templates = {
      'default.template': `
Szanowny/a {{SENDER_NAME}},

Dziękujemy za wiadomość dotyczącą: "{{SUBJECT}}".

Otrzymaliśmy Twoją wiadomość i zajmiemy się nią wkrótce.

Z poważaniem,
Zespół Obsługi Klienta
`,
      'frequent_sender.template': `
Szanowny/a {{SENDER_NAME}},

Dziękujemy za Twoją wiadomość dotyczącą: "{{SUBJECT}}".

Doceniamy Twoją lojalność i częsty kontakt z nami. Jako nasz stały klient, Twoja sprawa zostanie rozpatrzona priorytetowo.

To już Twoja {{EMAIL_COUNT}}. wiadomość do nas. Ostatnio kontaktowałeś/aś się z nami {{LAST_EMAIL_DATE}}.

Z poważaniem,
Zespół Obsługi Klienta
`,
      'negative_repeated.template': `
Szanowny/a {{SENDER_NAME}},

Dziękujemy za ponowną wiadomość dotyczącą: "{{SUBJECT}}".

Widzimy, że to nie pierwszy raz, gdy napotykasz problemy. Bardzo przepraszamy za tę sytuację. Twoja sprawa została przekazana do kierownika zespołu, który osobiście zajmie się jej rozwiązaniem.

Skontaktujemy się z Tobą najszybciej jak to możliwe.

Z poważaniem,
Zespół Obsługi Klienta
`,
      'urgent_critical.template': `
Szanowny/a {{SENDER_NAME}},

Dziękujemy za wiadomość dotyczącą: "{{SUBJECT}}".

Zauważyliśmy, że Twoja sprawa jest krytycznie pilna. Przekazaliśmy ją do natychmiastowego rozpatrzenia przez nasz zespół.

Skontaktujemy się z Tobą najszybciej jak to możliwe.

Z poważaniem,
Zespół Obsługi Klienta
`
    };

    // Zapisz każdy szablon do pliku
    for (const [filename, content] of Object.entries(templates)) {
      await fs.writeFile(path.join(templatesDir, filename), content);
      logger.info(`Utworzono przykładowy szablon: ${filename}`);
    }

    logger.info('Przykładowe szablony zostały pomyślnie skopiowane.');
  } catch (error) {
    logger.error('Błąd podczas kopiowania przykładowych szablonów:', error);
  }
}

// Funkcja zamykająca aplikację
async function shutdown() {
  logger.info('Zamykanie aplikacji...');
  
  try {
    if (global.camelContext) {
      await global.camelContext.stop();
      logger.info('Kontekst Apache Camel zatrzymany.');
    }
    
    log4js.shutdown(() => {
      logger.info('Logger zamknięty.');
      process.exit(0);
    });
  } catch (error) {
    logger.error('Błąd podczas zamykania aplikacji:', error);
    process.exit(1);
  }
}

// Uruchomienie aplikacji
main();