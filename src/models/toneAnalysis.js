/**
 * Model analizy tonu wiadomości email
 */
class ToneAnalysis {
  /**
   * Konstruktor modelu analizy tonu
   * @param {Object} params - Parametry analizy tonu
   * @param {string} params.sentiment - Ogólny sentyment wiadomości
   * @param {Object} params.emotions - Mapa emocji i ich wartości
   * @param {string} params.urgency - Pilność wiadomości
   * @param {string} params.formality - Formalność wiadomości
   * @param {Array<string>} params.topTopics - Główne tematy wiadomości
   * @param {string} params.summaryText - Podsumowanie treści wiadomości
   */
  constructor({ 
    sentiment = Sentiment.NEUTRAL, 
    emotions = {}, 
    urgency = Urgency.NORMAL, 
    formality = Formality.NEUTRAL, 
    topTopics = [], 
    summaryText = ""
  }) {
    this.sentiment = sentiment;
    this.emotions = emotions;
    this.urgency = urgency;
    this.formality = formality;
    this.topTopics = topTopics;
    this.summaryText = summaryText;
  }
  
  /**
   * Tworzy obiekt analizy tonu z tekstu JSON
   * @param {string} json - String JSON z analizą tonu
   * @returns {ToneAnalysis} - Obiekt analizy tonu
   */
  static fromJson(json) {
    try {
      const data = JSON.parse(json);
      return new ToneAnalysis({
        sentiment: data.sentiment || Sentiment.NEUTRAL,
        emotions: data.emotions || { [Emotion.NEUTRAL]: 1.0 },
        urgency: data.urgency || Urgency.NORMAL,
        formality: data.formality || Formality.NEUTRAL,
        topTopics: data.topTopics || [],
        summaryText: data.summaryText || ""
      });
    } catch (error) {
      console.error('Błąd podczas parsowania JSON analizy tonu:', error);
      return ToneAnalysis.createDefault();
    }
  }
  
  /**
   * Konwertuje analizę tonu na tekst JSON
   * @returns {string} - String JSON z analizą tonu
   */
  toJson() {
    return JSON.stringify({
      sentiment: this.sentiment,
      emotions: this.emotions,
      urgency: this.urgency,
      formality: this.formality,
      topTopics: this.topTopics,
      summaryText: this.summaryText
    });
  }
  
  /**
   * Tworzy domyślny obiekt analizy tonu
   * @returns {ToneAnalysis} - Domyślny obiekt analizy tonu
   */
  static createDefault() {
    return new ToneAnalysis({
      sentiment: Sentiment.NEUTRAL,
      emotions: { [Emotion.NEUTRAL]: 1.0 },
      urgency: Urgency.NORMAL,
      formality: Formality.NEUTRAL,
      topTopics: [],
      summaryText: "Nie można przeanalizować treści wiadomości."
    });
  }
}

/**
 * Ogólny sentyment wiadomości
 */
const Sentiment = {
  VERY_NEGATIVE: 'VERY_NEGATIVE',
  NEGATIVE: 'NEGATIVE',
  NEUTRAL: 'NEUTRAL',
  POSITIVE: 'POSITIVE',
  VERY_POSITIVE: 'VERY_POSITIVE'
};

/**
 * Emocje wykryte w wiadomości
 */
const Emotion = {
  ANGER: 'ANGER',
  FEAR: 'FEAR',
  HAPPINESS: 'HAPPINESS',
  SADNESS: 'SADNESS',
  SURPRISE: 'SURPRISE',
  DISGUST: 'DISGUST',
  NEUTRAL: 'NEUTRAL'
};

/**
 * Pilność wiadomości
 */
const Urgency = {
  LOW: 'LOW',
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  CRITICAL: 'CRITICAL'
};

/**
 * Poziom formalności wiadomości
 */
const Formality = {
  VERY_INFORMAL: 'VERY_INFORMAL',
  INFORMAL: 'INFORMAL',
  NEUTRAL: 'NEUTRAL',
  FORMAL: 'FORMAL',
  VERY_FORMAL: 'VERY_FORMAL'
};

module.exports = {
  ToneAnalysis,
  Sentiment,
  Emotion,
  Urgency,
  Formality
};