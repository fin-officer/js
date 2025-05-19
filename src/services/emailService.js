/**
 * Serwis do przetwarzania wiadomości email
 */
const log4js = require('log4js');
const { EmailMessage, EmailStatus } = require('../models/emailMessage');
const { ToneAnalysis, Sentiment, Urgency } = require('../models/toneAnalysis');
const llmService = require('./llmService');
const { getDb } = require('../utils/dbUtils');

const logger = log4js.getLogger('emailService');

/**
 * Przetwarza wiadomość email, wykonując analizę tonu
 * @param {Object} exchange - Obiekt wymiany Camel
 */
function processEmail(exchange) {
  try {
    logger.debug('Przetwarzanie wiadomości email');
    
    // Pobranie wiadomości z wymiany
    const email = extractEmailFromExchange(exchange);
    
    // Aktualizacja statusu w bazie danych
    updateEmailStatus(email.id, EmailStatus.PROCESSING);
    
    // Analiza tonu wiadomości przez LLM
    const content = email.content || '';
    const toneAnalysis = llmService.analyzeTone(content);
    
    // Tworzenie przetworzonej wiadomości
    const processedEmail = email.copy({
      toneAnalysis,
      processedDate: new Date(),
      status: EmailStatus.PROCESSED
    });
    
    // Zapisanie wyników analizy w bazie danych
    saveAnalysisResults(processedEmail);
    
    // Ustawienie przetworzonej wiadomości jako body wymiany
    exchange.message.body = processedEmail;
    
    logger.debug('Przetwarzanie wiadomości zakończone', processedEmail.id);
  } catch (error) {
    logger.error('Błąd podczas przetwarzania wiadomości:', error);
    throw error;
  }
}

/**
 * Wyodrębnia wiadomość email z obiektu wymiany Camel
 * @param {Object} exchange - Obiekt wymiany Camel
 * @returns {EmailMessage} - Wiadomość email
 */
function extractEmailFromExchange(exchange) {
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
    email.id = saveEmailToDatabase(email);
  }
  
  return email;
}

/**
 * Zapisuje wiadomość email w bazie danych
 * @param {EmailMessage} email - Wiadomość email
 * @returns {number} - ID zapisanej wiadomości
 */
function saveEmailToDatabase(email) {
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
    logger.error('Błąd podczas zapisywania wiadomości w bazie danych:', error);
    throw error;
  }
}

/**
 * Aktualizuje status wiadomości w bazie danych
 * @param {number} id - ID wiadomości
 * @param {string} status - Nowy status
 */
function updateEmailStatus(id, status) {
  try {
    const db = getDb();
    
    const stmt = db.prepare(`
      UPDATE emails SET status = ? WHERE id = ?
    `);
    
    stmt.run(status, id);
  } catch (error) {
    logger.error(`Błąd podczas aktualizacji statusu wiadomości ${id}:`, error);
    throw error;
  }
}

/**
 * Zapisuje wyniki analizy w bazie danych
 * @param {EmailMessage} email - Przetworzona wiadomość email
 */
function saveAnalysisResults(email) {
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
  } catch (error) {
    logger.error(`Błąd podczas zapisywania wyników analizy dla wiadomości ${email.id}:`, error);
    throw error;
  }
}

/**
 * Decyduje, czy należy wysłać automatyczną odpowiedź na podstawie analizy
 * @param {Object} exchange - Obiekt wymiany Camel
 * @returns {boolean} - Czy wysłać automatyczną odpowiedź
 */
function shouldAutoReply(exchange) {
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
    logger.error('Błąd podczas podejmowania decyzji o automatycznej odpowiedzi:', error);
    return false;
  }
}

/**
 * Generuje tekst odpowiedzi na podstawie analizy wiadomości
 * @param {Object} exchange - Obiekt wymiany Camel
 */
function generateReply(exchange) {
  try {
    const email = exchange.message.body;
    const analysis = email.toneAnalysis;
    
    let replyText;
    
    if (!analysis) {
      replyText = DEFAULT_REPLY;
    } else {
      // Generowanie odpowiedzi na podstawie analizy
      switch (analysis.urgency) {
        case Urgency.CRITICAL:
          replyText = URGENT_REPLY;
          break;
        case Urgency.HIGH:
          replyText = HIGH_PRIORITY_REPLY;
          break;
        default:
          switch (analysis.sentiment) {
            case Sentiment.VERY_NEGATIVE:
              replyText = VERY_NEGATIVE_REPLY;
              break;
            case Sentiment.NEGATIVE:
              replyText = NEGATIVE_REPLY;
              break;
            case Sentiment.POSITIVE:
            case Sentiment.VERY_POSITIVE:
              replyText = POSITIVE_REPLY;
              break;
            default:
              replyText = DEFAULT_REPLY;
          }
      }
    }
    
    // Personalizacja odpowiedzi
    replyText = replyText.replace('{subject}', email.subject || '')
                         .replace('{summary}', analysis ? analysis.summaryText : '')
                         .replace('{from}', email.from);
    
    // Ustawienie treści odpowiedzi w wymianie
    exchange.message.body = replyText;
    
    // Aktualizacja statusu w bazie danych
    updateEmailStatus(email.id, EmailStatus.REPLIED);
    
    logger.debug(`Wygenerowano odpowiedź dla wiadomości ${email.id}`);
  } catch (error) {
    logger.error('Błąd podczas generowania odpowiedzi:', error);
    exchange.message.body = DEFAULT_REPLY;
  }
}

// Szablony odpowiedzi
const DEFAULT_REPLY = `
Witaj,

Dziękujemy za wiadomość. To jest automatyczna odpowiedź.

Otrzymaliśmy Twoją wiadomość o temacie: "{subject}"

Zajmiemy się nią tak szybko, jak to możliwe.

Pozdrawiamy,
System Email LLM Processor
`;

const URGENT_REPLY = `
Witaj,

Dziękujemy za wiadomość. To jest automatyczna odpowiedź.

Otrzymaliśmy Twoją pilną wiadomość o temacie: "{subject}"

Zauważyliśmy, że sprawa jest krytycznie ważna. Zajmiemy się nią priorytetowo.

Pozdrawiamy,
System Email LLM Processor
`;

const HIGH_PRIORITY_REPLY = `
Witaj,

Dziękujemy za wiadomość. To jest automatyczna odpowiedź.

Otrzymaliśmy Twoją ważną wiadomość o temacie: "{subject}"

Zauważyliśmy, że sprawa jest pilna. Zajmiemy się nią tak szybko, jak to możliwe.

Pozdrawiamy,
System Email LLM Processor
`;

const NEGATIVE_REPLY = `
Witaj,

Dziękujemy za wiadomość. To jest automatyczna odpowiedź.

Otrzymaliśmy Twoją wiadomość o temacie: "{subject}"

Przepraszamy za wszelkie niedogodności. Postaramy się rozwiązać problem jak najszybciej.

Pozdrawiamy,
System Email LLM Processor
`;

const VERY_NEGATIVE_REPLY = `
Witaj,

Dziękujemy za wiadomość. To jest automatyczna odpowiedź.

Otrzymaliśmy Twoją wiadomość o temacie: "{subject}"

Bardzo nam przykro, że pojawił się problem. Z najwyższym priorytetem zajmiemy się Twoją sprawą.

Pozdrawiamy,
System Email LLM Processor
`;

const POSITIVE_REPLY = `
Witaj,

Dziękujemy za wiadomość. To jest automatyczna odpowiedź.

Otrzymaliśmy Twoją wiadomość o temacie: "{subject}"

Dziękujemy za pozytywne informacje. Odpowiemy na Twoją wiadomość wkrótce.

Pozdrawiamy,
System Email LLM Processor
`;

module.exports = {
  processEmail,
  shouldAutoReply,
  generateReply
};