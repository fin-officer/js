/**
 * Skrypt inicjalizujący bazę danych SQLite
 */
const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

// Ścieżka do bazy danych
const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../data/emails.db');

// Upewnienie się, że katalog dla bazy danych istnieje
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  console.log(`Tworzenie katalogu dla bazy danych: ${dbDir}`);
  fs.mkdirSync(dbDir, { recursive: true });
}

console.log(`Inicjalizacja bazy danych SQLite: ${dbPath}`);

// Tworzenie/otwarcie bazy danych
const db = new sqlite3.Database(dbPath);

// Utworzenie tabel w bazie danych
db.serialize(() => {
  // Tabela dla wiadomości email
  db.run(`
    CREATE TABLE IF NOT EXISTS emails (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      subject TEXT,
      content TEXT,
      received_date TIMESTAMP,
      processed_date TIMESTAMP,
      tone_analysis TEXT,
      status TEXT
    )
  `);
  
  // Tabela dla szablonów wiadomości (opcjonalnie)
  db.run(`
    CREATE TABLE IF NOT EXISTS email_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT,
      content TEXT NOT NULL,
      created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Tabela dla konfiguracji (opcjonalnie)
  db.run(`
    CREATE TABLE IF NOT EXISTS config (
      key TEXT PRIMARY KEY,
      value TEXT,
      description TEXT,
      updated_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);
  
  // Dodanie domyślnej konfiguracji
  db.run(`
    INSERT OR IGNORE INTO config (key, value, description)
    VALUES 
      ('auto_reply_enabled', 'true', 'Czy automatyczne odpowiedzi są włączone'),
      ('llm_model', 'llama2', 'Model LLM używany do analizy'),
      ('email_check_interval', '60', 'Interwał sprawdzania nowych wiadomości (w sekundach)')
  `);
});

// Zamknięcie połączenia z bazą danych
db.close((err) => {
  if (err) {
    console.error('Błąd podczas zamykania bazy danych:', err.message);
  } else {
    console.log('Inicjalizacja bazy danych zakończona pomyślnie.');
  }
});