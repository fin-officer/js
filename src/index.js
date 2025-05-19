/**
 * Główny punkt wejścia aplikacji
 */
const fs = require('fs');
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
const emailService = require('./services/emailService');
const llmService = require('./services/llmService');

// Utworzenie Express app dla REST API
const app = express();
app.use(express.json());

// Utworzenie kontekstu Apache Camel
async function startCamelContext() {
  try {
    logger.info('Inicjalizacja kontekstu Apache Camel...');
    
    // Ładowanie konfiguracji z bazy danych
    const config = await loadConfig();
    logger.info('Konfiguracja załadowana:', config);
    
    // Tworzenie i konfiguracja kontekstu Camel
    const camelContext = createCamelContext();
    
    // Rejestracja serwisów jako beany
    camelContext.registry.bind('emailService', emailService);
    camelContext.registry.bind('llmService', llmService);
    
    // Ładowanie tras Camel z pliku XML
    const routesXml = fs.readFileSync(path.join(__dirname, '../camel-routes.xml'), 'utf8');
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
app.post('/api/emails/process', (req, res) => {
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

// Endpoint zdrowia aplikacji
app.get('/health', (req, res) => {
  const status = global.camelContext && global.camelContext.status === 'Started' ? 'UP' : 'DOWN';
  res.json({ 
    status, 
    timestamp: new Date().toISOString() 
  });
});

// Główna funkcja startowa
async function main() {
  try {
    logger.info('Uruchamianie Email LLM Processor...');
    
    // Sprawdzenie, czy baza danych istnieje, jeśli nie, utworzenie jej
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/emails.db');
    if (!fs.existsSync(dbPath)) {
      logger.info('Baza danych nie istnieje, inicjalizacja...');
      require('../scripts/setup-db.js');
    }
    
    // Uruchomienie kontekstu Camel
    global.camelContext = await startCamelContext();
    
    // Uruchomienie serwera Express
    const port = process.env.APP_PORT || 8080;
    app.listen(port, () => {
      logger.info(`Serwer HTTP uruchomiony na porcie ${port}`);
    });
    
    // Obsługa sygnałów zakończenia procesu
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logger.error('Błąd podczas uruchamiania aplikacji:', error);
    process.exit(1);
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