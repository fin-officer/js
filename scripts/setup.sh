const fs = require('fs').promises;
const path = require('path');
const log4js = require('log4js');
const { execSync } = require('child_process');

const logger = log4js.getLogger('copyTemplates');

// Konfiguracja loggera
log4js.configure({
  appenders: {
    console: { type: 'console' },
    file: { type: 'file', filename: 'logs/setup.log' }
  },
  categories: {
    default: { appenders: ['console', 'file'], level: 'info' }
  }
});

/**
 * Skrypt do inicjalizacji przykładowych szablonów odpowiedzi
 */
async function setupTemplates() {
  try {
    logger.info('Inicjalizacja przykładowych szablonów odpowiedzi');
    
    // Ścieżka do katalogu szablonów
    const templatesDir = path.join(process.cwd(), 'data/templates');
    
    // Sprawdź czy katalog istnieje, jeśli nie - utwórz go
    try {
      await fs.access(templatesDir);
      logger.info(`Katalog szablonów już istnieje: ${templatesDir}`);
    } catch (error) {
      logger.info(`Tworzenie katalogu szablonów: ${templatesDir}`);
      await fs.mkdir(templatesDir, { recursive: true });
    }
    
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
      const templatePath = path.join(templatesDir, filename);
      
      try {
        // Sprawdź czy plik już istnieje
        await fs.access(templatePath);
        logger.info(`Szablon już istnieje: ${filename}`);
      } catch (error) {
        // Jeśli nie istnieje, zapisz go
        await fs.writeFile(templatePath, content);
        logger.info(`Utworzono szablon: ${filename}`);
      }
    }
    
    logger.info('Inicjalizacja szablonów zakończona pomyślnie');
  } catch (error) {
    logger.error(`Błąd podczas inicjalizacji szablonów: ${error.message}`);
    throw error;
  }
}

/**
 * Skrypt do inicjalizacji katalogów archiwum
 */
async function setupArchiveDir() {
  try {
    logger.info('Inicjalizacja katalogu archiwum wiadomości');
    
    // Ścieżka do katalogu archiwum
    const archiveDir = path.join(process.cwd(), 'data/archive');
    
    // Sprawdź czy katalog istnieje, jeśli nie - utwórz go
    try {
      await fs.access(archiveDir);
      logger.info(`Katalog archiwum już istnieje: ${archiveDir}`);
    } catch (error) {
      logger.info(`Tworzenie katalogu archiwum: ${archiveDir}`);
      await fs.mkdir(archiveDir, { recursive: true });
    }
    
    logger.info('Inicjalizacja katalogu archiwum zakończona pomyślnie');
  } catch (error) {
    logger.error(`Błąd podczas inicjalizacji katalogu archiwum: ${error.message}`);
    throw error;
  }
}

/**
 * Główna funkcja inicjalizacji
 */
async function main() {
  try {
    logger.info('Rozpoczynanie inicjalizacji aplikacji...');
    
    // Uruchom inicjalizację bazy danych
    logger.info('Inicjalizacja bazy danych...');
    require('./setup-db');
    
    // Uruchom inicjalizację szablonów
    await setupTemplates();
    
    // Uruchom inicjalizację katalogu archiwum
    await setupArchiveDir();
    
    logger.info('Inicjalizacja aplikacji zakończona pomyślnie');
  } catch (error) {
    logger.error(`Błąd podczas inicjalizacji aplikacji: ${error.message}`);
    process.exit(1);
  }
}

// Uruchomienie skryptu
if (require.main === module) {
  main();
}

module.exports = main;