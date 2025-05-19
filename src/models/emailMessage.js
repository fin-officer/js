/**
 * Model wiadomości email
 */
class EmailMessage {
  /**
   * Konstruktor modelu wiadomości email
   * @param {Object} params - Parametry wiadomości email
   * @param {string} params.id - Identyfikator wiadomości (opcjonalny)
   * @param {string} params.from - Adres nadawcy
   * @param {string} params.to - Adres odbiorcy
   * @param {string} params.subject - Temat wiadomości (opcjonalny)
   * @param {string} params.content - Treść wiadomości (opcjonalny)
   * @param {Date} params.receivedDate - Data odbioru (domyślnie: teraz)
   * @param {Date} params.processedDate - Data przetworzenia (opcjonalny)
   * @param {Object} params.toneAnalysis - Wynik analizy tonu (opcjonalny)
   * @param {string} params.status - Status przetwarzania (domyślnie: RECEIVED)
   */
  constructor({ 
    id = null, 
    from, 
    to, 
    subject = null, 
    content = null, 
    receivedDate = new Date(), 
    processedDate = null, 
    toneAnalysis = null, 
    status = EmailStatus.RECEIVED 
  }) {
    this.id = id;
    this.from = from;
    this.to = to;
    this.subject = subject;
    this.content = content;
    this.receivedDate = receivedDate;
    this.processedDate = processedDate;
    this.toneAnalysis = toneAnalysis;
    this.status = status;
  }
  
  /**
   * Tworzy kopię wiadomości z nowymi właściwościami
   * @param {Object} newProps - Nowe właściwości
   * @returns {EmailMessage} - Nowy obiekt wiadomości
   */
  copy(newProps = {}) {
    return new EmailMessage({
      id: this.id,
      from: this.from,
      to: this.to,
      subject: this.subject,
      content: this.content,
      receivedDate: this.receivedDate,
      processedDate: this.processedDate,
      toneAnalysis: this.toneAnalysis,
      status: this.status,
      ...newProps
    });
  }
  
  /**
   * Konwertuje obiekt z bazy danych na model EmailMessage
   * @param {Object} dbObject - Obiekt z bazy danych
   * @returns {EmailMessage} - Nowy obiekt wiadomości
   */
  static fromDb(dbObject) {
    return new EmailMessage({
      id: dbObject.id,
      from: dbObject.from_address,
      to: dbObject.to_address,
      subject: dbObject.subject,
      content: dbObject.content,
      receivedDate: dbObject.received_date ? new Date(dbObject.received_date) : new Date(),
      processedDate: dbObject.processed_date ? new Date(dbObject.processed_date) : null,
      toneAnalysis: dbObject.tone_analysis ? JSON.parse(dbObject.tone_analysis) : null,
      status: dbObject.status || EmailStatus.RECEIVED
    });
  }
  
  /**
   * Konwertuje model na obiekt do zapisu w bazie danych
   * @returns {Object} - Obiekt do zapisu w bazie danych
   */
  toDb() {
    return {
      id: this.id,
      from_address: this.from,
      to_address: this.to,
      subject: this.subject,
      content: this.content,
      received_date: this.receivedDate.toISOString(),
      processed_date: this.processedDate ? this.processedDate.toISOString() : null,
      tone_analysis: this.toneAnalysis ? JSON.stringify(this.toneAnalysis) : null,
      status: this.status
    };
  }
}

/**
 * Statusy przetwarzania wiadomości email
 */
const EmailStatus = {
  RECEIVED: 'RECEIVED',      // Wiadomość została otrzymana
  PROCESSING: 'PROCESSING',  // Wiadomość jest przetwarzana
  PROCESSED: 'PROCESSED',    // Wiadomość została przetworzona
  REPLIED: 'REPLIED',        // Wysłano odpowiedź na wiadomość
  ERROR: 'ERROR'             // Wystąpił błąd podczas przetwarzania
};

module.exports = {
  EmailMessage,
  EmailStatus
};