/**
 * Serwis do przetwarzania wiadomości email
 */
const log4js = require('log4js');
const path = require('path');
const fs = require('fs').promises;
const { EmailMessage, EmailStatus } = require('../models/emailMessage');
const { Sentiment, Urgency } = require('../models/toneAnalysis');
const { getDb } = require('../utils/dbUtils');

const logger = log4js.getLogger('emailService');

class EmailService {
  /**
   * Konstruktor serwisu email
   * @param {Object} llmService - Serwis do komunikacji z LLM
   * @param {Object} advancedReplyService - Serwis do zaawansowanych odpowiedzi
   * @param {string} dbPath - Ścieżka do bazy danych
   * @param {string} archivePath - Ścieżka do katalogu archiwów
   */
  constructor(llmService, advancedReplyService, dbPath, archivePath = 'data/archive') {
    this.llmService = llmService;
    this.advancedReplyService = advancedReplyService;
    this.dbPath = dbPath;
    this.archivePath = archivePath;

    // Inicjalizacja
    this.init();
  }

  /**
   * Inicjalizacja serwisu
   */
  async init() {
    try {
      // Utwórz katalog archiwum, jeśli nie istnieje
      await fs.mkdir(this.archivePath, { recursive: true });
      logger.info(`Utworzono katalog archiwum: ${this.archivePath}`);
    } catch (error) {
      logger.error(`Błąd podczas inicjalizacji EmailService: ${error.message}`);
    }
  }

  /**
   * Przetwarza wiadomość email, wykonując analizę tonu
   * @param {Object} exchange - Obiekt wymiany Camel
   */
  processEmail(exchange) {
    try {
      logger.debug('Przetwarzanie wiadomości email');

      // Pobranie wiadomości z wymiany
      const email = this.extractEmailFromExchange(exchange);

      // Aktualizacja statusu w bazie danych
      this.updateEmailStatus(email.id, EmailStatus.PROCESSING);

      // Analiza tonu wiadomości przez LLM
      const content = email.content || '';
      const toneAnalysis = this.llmService.analyzeTone(content);

      logger.info(`Analiza tonu zakończona: sentyment=${toneAnalysis.sentiment}, pilność=${toneAnalysis.urgency}`);

      // Archiwizacja wiadomości
      this.archiveEmail(email, toneAnalysis);

      // Tworzenie przetworzonej wiadomości
      const processedEmail = email.copy({
        toneAnalysis,
        processedDate: new Date(),
        status: EmailStatus.PROCESSED
      });

      // Zapisanie wyników analizy w bazie danych
      this.saveAnalysisResults(processedEmail);

      // Ustawienie przetworzonej wiadomości jako body wymiany
      exchange.message.body = processedEmail;

      logger.debug(`Przetwarzanie wiadomości zakończone: ${processedEmail.id}`);
    } catch (error) {
      logger.error(`Błąd podczas przetwarzania wiadomości: ${error.message}`);

      // W przypadku błędu, staraj się zachować oryginalną wiadomość
      if (exchange && exchange.message && exchange.message.body) {
        const email = exchange.message.body;
        if (email.id) {
          this.updateEmailStatus(email.id, EmailStatus.ERROR);
        }
      }

      throw error;
    }
  }

  /**
   * Wyodrębnia wiadomość email z obiektu wymiany Camel
   * @param {Object} exchange - Obiekt wymiany Camel
   * @returns {EmailMessage} - Wiadomość email
   */
  extractEmailFromExchange(exchange) {
    let email;

    // Sprawdzenie, czy body to już obiekt EmailMessage
    if (exchange.message.body instanceof EmailMessage) {
      email = exchange.message.body;
    } else {
      // Jeśli nie, tworzymy nowy obiekt EmailMessage z danych w wymianie
      const headers = exchange.message.headers;
      const content = exchange.message.body || '';

      email = new EmailMessage({
        from: headers.from,
        to: headers.to,
        subject: headers.subject || '',
        content: content
      });

      // Zapisanie wiadomości w bazie danych i pobranie ID
      email.id = this.saveEmailToDatabase(email);
    }

    return email;
  }

  /**
   * Zapisuje wiadomość email w bazie danych
   * @param {EmailMessage} email - Wiadomość email
   * @returns {number} - ID zapisanej wiadomości
   */
  saveEmailToDatabase(email) {
    try {
      const db = getDb();

      const stmt = db.prepare(`
        INSERT INTO emails (from_address, to_address, subject, content, received_date, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      const info = stmt.run(
        email.from,
        email.to,
        email.subject || '',
        email.content || '',
        email.receivedDate.toISOString(),
        email.status
      );

      return info.lastInsertRowid;
    } catch (error) {
      logger.error(`Błąd podczas zapisywania wiadomości w bazie danych: ${error.message}`);
      throw error;
    }
  }

  /**
   * Aktualizuje status wiadomości w bazie danych
   * @param {number} id - ID wiadomości
   * @param {string} status - Nowy status
   */
  updateEmailStatus(id, status) {
    try {
      const db = getDb();

      const stmt = db.prepare(`
        UPDATE emails SET status = ? WHERE id = ?
      `);

      stmt.run(status, id);
      logger.debug(`Zaktualizowano status wiadomości ${id} na ${status}`);
    } catch (error) {
      logger.error(`Błąd podczas aktualizacji statusu wiadomości ${id}: ${error.message}`);
    }
  }

  /**
   * Zapisuje wyniki analizy w bazie danych
   * @param {EmailMessage} email - Przetworzona wiadomość email
   */
  saveAnalysisResults(email) {
    try {
      const db = getDb();

      const stmt = db.prepare(`
        UPDATE emails 
        SET tone_analysis = ?, processed_date = ?, status = ?
        WHERE id = ?
      `);

      stmt.run(
        email.toneAnalysis ? email.toneAnalysis.toJson() : null,
        email.processedDate.toISOString(),
        email.status,
        email.id
      );

      logger.debug(`Zapisano wyniki analizy dla wiadomości ${email.id}`);
    } catch (error) {
      logger.error(`Błąd podczas zapisywania wyników analizy dla wiadomości ${email.id}: ${error.message}`);
    }
  }

  /**
   * Decyduje, czy należy wysłać automatyczną odpowiedź na podstawie analizy
   * @param {Object} exchange - Obiekt wymiany Camel
   * @returns {boolean} - Czy wysłać automatyczną odpowiedź
   */
  shouldAutoReply(exchange) {
    try {
      const email = exchange.message.body;
      const analysis = email.toneAnalysis;

      if (!analysis) return false;

      // Przykładowa logika decyzji o automatycznej odpowiedzi
      // W rzeczywistej implementacji możemy mieć bardziej złożoną logikę
      const shouldReply = (
        analysis.urgency === Urgency.HIGH ||
        analysis.urgency === Urgency.CRITICAL ||
        analysis.sentiment === Sentiment.NEGATIVE ||
        analysis.sentiment === Sentiment.VERY_NEGATIVE
      );

      logger.debug(`Decyzja o automatycznej odpowiedzi dla wiadomości ${email.id}: ${shouldReply}`);
      return shouldReply;
    } catch (error) {
      logger.error(`Błąd podczas podejmowania decyzji o automatycznej odpowiedzi: ${error.message}`);
      return false;
    }
  }

  /**
   * Generuje tekst odpowiedzi na podstawie analizy wiadomości
   * @param {Object} exchange - Obiekt wymiany Camel
   */
  async generateReply(exchange) {
    try {
      const email = exchange.message.body;

      // Użyj zaawansowanego serwisu odpowiedzi do generowania treści
      let replyText = await this.advancedReplyService.generateReply(email, email.toneAnalysis);

      // Ustawienie treści odpowiedzi w wymianie
      exchange.message.body = replyText;

      // Aktualizacja statusu w bazie danych
      this.updateEmailStatus(email.id, EmailStatus.REPLIED);

      logger.debug(`Wygenerowano odpowiedź dla wiadomości ${email.id}`);
    } catch (error) {
      logger.error(`Błąd podczas generowania odpowiedzi: ${error.message}`);

      // W przypadku błędu, użyj domyślnej odpowiedzi
      const email = exchange.message.body;
      const defaultReply = DEFAULT_REPLY
        .replace('{subject}', email.subject || '')
        .replace('{from}', email.from);

      exchange.message.body = defaultReply;
    }
  }

  /**
   * Archiwizuje wiadomość email do pliku
   * @param {EmailMessage} email - Wiadomość email
   * @param {Object} analysis - Analiza tonu
   */
  async archiveEmail(email, analysis) {
    try {
      // Przygotuj katalog archiwum
      await fs.mkdir(this.archivePath, { recursive: true });

      // Przygotuj nazwę pliku: timestamp_od_email.txt
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const safeEmail = email.from.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}_${safeEmail}.txt`;

      // Przygotuj zawartość archiwum
      let archiveContent = '';
      archiveContent += `From: ${email.from}\n`;
      archiveContent += `To: ${email.to}\n`;
      archiveContent += `Subject: ${email.subject || ''}\n`;
      archiveContent += `Received: ${email.receivedDate.toISOString()}\n`;
      archiveContent += `Status: ${email.status}\n`;

      if (analysis) {
        archiveContent += `Sentiment: ${analysis.sentiment}\n`;
        archiveContent += `Urgency: ${analysis.urgency}\n`;
      }

      archiveContent += '\n'; // Pusta linia oddzielająca nagłówki od treści
      archiveContent += email.content || '';

      // Zapisz plik
      const archiveFile = path.join(this.archivePath, fileName);
      await fs.writeFile(archiveFile, archiveContent, 'utf8');

      logger.info(`Wiadomość zarchiwizowana: ${archiveFile}`);
    } catch (error) {
      logger.error(`Błąd podczas archiwizacji wiadomości: ${error.message}`);
    }
  }
}

// Domyślna odpowiedź używana w przypadku błędów
const DEFAULT_REPLY = `
Witaj,

Dziękujemy za wiadomość o temacie: "{subject}".

Otrzymaliśmy Twoją wiadomość i zajmiemy się nią wkrótce.

Pozdrawiamy,
Zespół Obsługi Klienta
`;

module.exports = EmailService;