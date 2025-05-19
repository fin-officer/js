/**
 * Narzędzie do parsowania wiadomości email
 */
const log4js = require('log4js');
const emailParser = require('email-parser');
const { Readable } = require('stream');

const logger = log4js.getLogger('emailParser');

/**
 * Ekstrahuje treść z wiadomości email
 * @param {Object} message - Obiekt wiadomości MIME
 * @returns {string} - Ekstrahowana treść wiadomości
 */
function extractContent(message) {
  try {
    if (!message) return '';
    
    if (typeof message === 'string') {
      return message;
    }
    
    // Jeśli wiadomość to obiekt MIME
    const content = extractContentFromMime(message);
    return content;
  } catch (error) {
    logger.error('Błąd podczas parsowania treści wiadomości:', error);
    return 'Nie można odczytać treści wiadomości.';
  }
}

/**
 * Ekstrahuje treść z obiektu MIME
 * @param {Object} mimeMessage - Obiekt wiadomości MIME
 * @returns {string} - Ekstrahowana treść wiadomości
 */
function extractContentFromMime(mimeMessage) {
  // Sprawdzenie typu wiadomości
  if (mimeMessage.isMimeType && mimeMessage.isMimeType('text/plain')) {
    return mimeMessage.getContent().toString();
  } else if (mimeMessage.isMimeType && mimeMessage.isMimeType('text/html')) {
    return extractTextFromHtml(mimeMessage.getContent().toString());
  } else if (mimeMessage.isMimeType && mimeMessage.isMimeType('multipart/*')) {
    return extractTextFromMultipart(mimeMessage);
  } else if (mimeMessage.content) {
    return mimeMessage.content.toString();
  }
  
  return 'Nieobsługiwany format wiadomości';
}

/**
 * Ekstrahuje tekst z zawartości HTML
 * @param {string} html - Treść HTML
 * @returns {string} - Ekstrahowany tekst
 */
function extractTextFromHtml(html) {
  // Prosta implementacja - w produkcyjnej wersji użylibyśmy biblioteki jak jsoup
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Ekstrahuje tekst z wieloczęściowej wiadomości
 * @param {Object} multipart - Obiekt wieloczęściowej wiadomości
 * @returns {string} - Ekstrahowany tekst
 */
function extractTextFromMultipart(multipart) {
  try {
    const result = [];
    
    for (let i = 0; i < multipart.getCount(); i++) {
      const bodyPart = multipart.getBodyPart(i);
      
      if (bodyPart.isMimeType('text/plain')) {
        result.push(bodyPart.getContent().toString());
      } else if (bodyPart.isMimeType('text/html')) {
        result.push(extractTextFromHtml(bodyPart.getContent().toString()));
      } else if (bodyPart.isMimeType('multipart/*')) {
        result.push(extractTextFromMultipart(bodyPart));
      }
    }
    
    return result.join('\n\n');
  } catch (error) {
    logger.error('Błąd podczas ekstrahowania tekstu z wieloczęściowej wiadomości:', error);
    return 'Nie można odczytać wieloczęściowej wiadomości.';
  }
}

/**
 * Pobiera załączniki z wiadomości email
 * @param {Object} message - Obiekt wiadomości email
 * @returns {Array<EmailAttachment>} - Lista załączników
 */
function extractAttachments(message) {
  try {
    if (!message) return [];
    
    if (message.isMimeType && message.isMimeType('multipart/*')) {
      const attachments = [];
      
      for (let i = 0; i < message.getCount(); i++) {
        const bodyPart = message.getBodyPart(i);
        
        if (bodyPart.getDisposition() === 'ATTACHMENT' || bodyPart.getFileName()) {
          const fileName = bodyPart.getFileName() || `attachment-${i}`;
          const contentType = bodyPart.getContentType() || 'application/octet-stream';
          const inputStream = bodyPart.getInputStream();
          
          // Odczytanie danych z inputStream
          const chunks = [];
          let chunk;
          while ((chunk = inputStream.read()) !== -1) {
            chunks.push(Buffer.from([chunk]));
          }
          
          const data = Buffer.concat(chunks);
          
          attachments.push(new EmailAttachment(fileName, contentType, data));
        }
      }
      
      return attachments;
    }
    
    return [];
  } catch (error) {
    logger.error('Błąd podczas ekstrahowania załączników:', error);
    return [];
  }
}

/**
 * Klasa reprezentująca załącznik email
 */
class EmailAttachment {
  /**
   * Konstruktor załącznika email
   * @param {string} fileName - Nazwa pliku
   * @param {string} contentType - Typ zawartości MIME
   * @param {Buffer} data - Dane załącznika
   */
  constructor(fileName, contentType, data) {
    this.fileName = fileName;
    this.contentType = contentType;
    this.data = data;
  }
  
  /**
   * Zapisuje załącznik do pliku
   * @param {string} outputPath - Ścieżka docelowa
   * @returns {Promise<string>} - Ścieżka zapisanego pliku
   */
  async saveToFile(outputPath) {
    try {
      const fs = require('fs').promises;
      await fs.writeFile(outputPath, this.data);
      return outputPath;
    } catch (error) {
      logger.error(`Błąd podczas zapisywania załącznika ${this.fileName}:`, error);
      throw error;
    }
  }
}

/**
 * Parsuje nagłówki wiadomości email
 * @param {Object} message - Obiekt wiadomości email
 * @returns {Object} - Sparsowane nagłówki
 */
function parseHeaders(message) {
  try {
    if (!message || !message.getHeader) return {};
    
    const headers = {};
    const allHeaderLines = message.getHeader('');
    
    if (!allHeaderLines) return {};
    
    for (const header of ['From', 'To', 'Subject', 'Date', 'Message-ID', 'Reply-To', 'References', 'In-Reply-To']) {
      headers[header.toLowerCase()] = message.getHeader(header);
    }
    
    return headers;
  } catch (error) {
    logger.error('Błąd podczas parsowania nagłówków wiadomości:', error);
    return {};
  }
}

/**
 * Parsuje kompletną wiadomość email
 * @param {Object|string} message - Obiekt wiadomości lub surowa treść
 * @returns {Object} - Sparsowana wiadomość
 */
function parseEmail(message) {
  try {
    if (!message) return null;
    
    // Jeśli wiadomość to string, parsujemy go
    if (typeof message === 'string') {
      const parsedEmail = emailParser.parse(message);
      return {
        from: parsedEmail.from,
        to: parsedEmail.to,
        subject: parsedEmail.subject,
        date: parsedEmail.date,
        content: parsedEmail.text || extractTextFromHtml(parsedEmail.html),
        attachments: []
      };
    }
    
    // Jeśli wiadomość to obiekt MIME
    const headers = parseHeaders(message);
    const content = extractContent(message);
    const attachments = extractAttachments(message);
    
    return {
      from: headers.from,
      to: headers.to,
      subject: headers.subject,
      date: headers.date ? new Date(headers.date) : new Date(),
      messageId: headers['message-id'],
      replyTo: headers['reply-to'],
      references: headers.references,
      inReplyTo: headers['in-reply-to'],
      content: content,
      attachments: attachments
    };
  } catch (error) {
    logger.error('Błąd podczas parsowania wiadomości email:', error);
    return null;
  }
}

module.exports = {
  extractContent,
  extractAttachments,
  parseHeaders,
  parseEmail,
  EmailAttachment
};