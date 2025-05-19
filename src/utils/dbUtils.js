/**
 * Narzędzia do obsługi bazy danych
 */
const log4js = require('log4js');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');
require('dotenv').config();

const logger = log4js.getLogger('dbUtils');

// Singleton instancji bazy danych
let dbInstance = null;

/**
 * Pobiera połączenie z bazą danych
 * @returns {Object} - Instancja połączenia z bazą danych
 */
function getDb() {
  if (!dbInstance) {
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/emails.db');
    
    // Sprawdzenie, czy katalog bazy danych istnieje
    const dbDir = path.dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      logger.info(`Tworzenie katalogu dla bazy danych: ${dbDir}`);
      fs.mkdirSync(dbDir, { recursive: true });
    }
    
    // Próba otwarcia połączenia z bazą danych
    try {
      logger.info(`Otwieranie połączenia z bazą danych: ${dbPath}`);
      dbInstance = new Database(dbPath, { verbose: process.env.NODE_ENV === 'development' });
      
      // Włączenie foreign keys
      dbInstance.pragma('foreign_keys = ON');
      
      // Konfiguracja bazy danych
      if (process.env.NODE_ENV === 'development') {
        dbInstance.pragma('journal_mode = WAL');
      }
    } catch (error) {
      logger.error(`Błąd podczas otwierania połączenia z bazą danych: ${error.message}`);
      throw error;
    }
  }
  
  return dbInstance;
}

/**
 * Zamyka połączenie z bazą danych
 */
function closeDb() {
  if (dbInstance) {
    logger.info('Zamykanie połączenia z bazą danych');
    dbInstance.close();
    dbInstance = null;
  }
}

/**
 * Ładuje konfigurację z bazy danych
 * @returns {Object} - Obiekt konfiguracji
 */
async function loadConfig() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT key, value FROM config').all();
    
    const config = {};
    for (const row of rows) {
      config[row.key] = row.value;
    }
    
    logger.debug('Załadowano konfigurację z bazy danych');
    return config;
  } catch (error) {
    logger.error('Błąd podczas ładowania konfiguracji:', error);
    return {};
  }
}

/**
 * Zapisuje konfigurację do bazy danych
 * @param {string} key - Klucz konfiguracji
 * @param {string} value - Wartość konfiguracji
 * @param {string} [description] - Opcjonalny opis konfiguracji
 */
function saveConfig(key, value, description = null) {
  try {
    const db = getDb();
    
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO config (key, value, description, updated_date)
      VALUES (?, ?, ?, datetime('now'))
    `);
    
    stmt.run(key, value, description);
    logger.debug(`Zapisano konfigurację: ${key} = ${value}`);
  } catch (error) {
    logger.error(`Błąd podczas zapisywania konfiguracji ${key}:`, error);
    throw error;
  }
}

module.exports = {
  getDb,
  closeDb,
  loadConfig,
  saveConfig
};