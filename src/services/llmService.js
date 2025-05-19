/**
 * Serwis do komunikacji z API modelu językowego (LLM)
 */
const log4js = require('log4js');
const axios = require('axios');
const { ToneAnalysis, Sentiment, Emotion, Urgency, Formality } = require('../models/toneAnalysis');

const logger = log4js.getLogger('llmService');

// URL API i model LLM pobrane ze zmiennych środowiskowych
const API_URL = process.env.LLM_API_URL || 'http://localhost:11434';
const MODEL = process.env.LLM_MODEL || 'llama2';

/**
 * Analizuje ton wiadomości email
 * @param {string} content - Treść wiadomości email
 * @returns {ToneAnalysis} - Wynik analizy tonu
 */
function analyzeTone(content) {
  if (!content || content.trim() === '') {
    logger.warn('Pusta treść wiadomości, zwracanie domyślnej analizy');
    return ToneAnalysis.createDefault();
  }
  
  try {
    logger.debug('Analizowanie tonu wiadomości...');
    
    // W produkcyjnej wersji wysłalibyśmy tutaj zapytanie do API LLM
    // Dla uproszczenia zaślepka zwraca zaślepkę wyniku
    
    // const response = callLlmApi(createAnalysisPrompt(content));
    // return parseAnalysisResponse(response);
    
    // Zaślepka dla celów demonstracyjnych
    return mockAnalysis(content);
  } catch (error) {
    logger.error('Błąd podczas analizy tonu:', error);
    return ToneAnalysis.createDefault();
  }
}

/**
 * Tworzy prompt dla modelu LLM do analizy tonu
 * @param {string} content - Treść wiadomości email
 * @returns {string} - Prompt dla modelu LLM
 */
function createAnalysisPrompt(content) {
  return `
    Przeanalizuj poniższą wiadomość email i podaj:
    1. Ogólny sentyment (VERY_NEGATIVE, NEGATIVE, NEUTRAL, POSITIVE, VERY_POSITIVE)
    2. Główne emocje (ANGER, FEAR, HAPPINESS, SADNESS, SURPRISE, DISGUST, NEUTRAL) z wartościami od 0 do 1
    3. Pilność (LOW, NORMAL, HIGH, CRITICAL)
    4. Formalność (VERY_INFORMAL, INFORMAL, NEUTRAL, FORMAL, VERY_FORMAL)
    5. Główne tematy (lista słów kluczowych)
    6. Krótkie podsumowanie treści
    
    Odpowiedź podaj w formacie JSON.
    
    Wiadomość:
    ${content}
  `;
}

/**
 * Wywołuje API modelu językowego
 * @param {string} prompt - Prompt dla modelu LLM
 * @returns {string} - Odpowiedź modelu LLM
 */
async function callLlmApi(prompt) {
  try {
    logger.debug('Wysyłanie zapytania do API LLM...');
    
    const response = await axios.post(`${API_URL}/api/generate`, {
      model: MODEL,
      prompt: prompt,
      temperature: 0.7,
      max_tokens: 1000
    });
    
    if (response.status === 200 && response.data) {
      logger.debug('Otrzymano odpowiedź z API LLM');
      return response.data.response || '';
    } else {
      logger.error('Błąd podczas wywołania API LLM:', response.status);
      throw new Error(`Błąd API LLM: ${response.status}`);
    }
  } catch (error) {
    logger.error('Błąd podczas wywołania API LLM:', error);
    throw error;
  }
}

/**
 * Parsuje odpowiedź API do modelu ToneAnalysis
 * @param {string} response - Odpowiedź API
 * @returns {ToneAnalysis} - Wynik analizy tonu
 */
function parseAnalysisResponse(response) {
  try {
    // Wyodrębnienie części JSON z odpowiedzi, jeśli jest zagnieżdżona w tekście
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    const jsonString = jsonMatch ? jsonMatch[0] : response;
    
    // Parsowanie JSON
    const data = JSON.parse(jsonString);
    
    return new ToneAnalysis({
      sentiment: data.sentiment || Sentiment.NEUTRAL,
      emotions: data.emotions || { [Emotion.NEUTRAL]: 1.0 },
      urgency: data.urgency || Urgency.NORMAL,
      formality: data.formality || Formality.NEUTRAL,
      topTopics: data.topTopics || [],
      summaryText: data.summaryText || ""
    });
  } catch (error) {
    logger.error('Błąd podczas parsowania odpowiedzi API:', error);
    return ToneAnalysis.createDefault();
  }
}

/**
 * Zaślepka analizy tonu dla celów demonstracyjnych
 * @param {string} content - Treść wiadomości email
 * @returns {ToneAnalysis} - Zaślepka wyniku analizy tonu
 */
function mockAnalysis(content) {
  // Proste określenie sentymentu na podstawie słów kluczowych
  const lowerContent = content.toLowerCase();
  
  let sentiment = Sentiment.NEUTRAL;
  let urgency = Urgency.NORMAL;
  let emotions = { [Emotion.NEUTRAL]: 0.8 };
  
  // Wykrywanie sentymentu
  if (lowerContent.includes('problem') || lowerContent.includes('error') || lowerContent.includes('issue')) {
    sentiment = Sentiment.NEGATIVE;
    emotions[Emotion.SADNESS] = 0.5;
    emotions[Emotion.NEUTRAL] = 0.3;
  } else if (lowerContent.includes('angry') || lowerContent.includes('frustrated') || lowerContent.includes('terrible')) {
    sentiment = Sentiment.VERY_NEGATIVE;
    emotions[Emotion.ANGER] = 0.7;
    emotions[Emotion.SADNESS] = 0.2;
  } else if (lowerContent.includes('thanks') || lowerContent.includes('good') || lowerContent.includes('happy')) {
    sentiment = Sentiment.POSITIVE;
    emotions[Emotion.HAPPINESS] = 0.6;
    emotions[Emotion.NEUTRAL] = 0.4;
  } else if (lowerContent.includes('excellent') || lowerContent.includes('amazing') || lowerContent.includes('great')) {
    sentiment = Sentiment.VERY_POSITIVE;
    emotions[Emotion.HAPPINESS] = 0.8;
    emotions[Emotion.SURPRISE] = 0.2;
  }
  
  // Wykrywanie pilności
  if (lowerContent.includes('urgent') || lowerContent.includes('asap') || lowerContent.includes('immediately')) {
    urgency = Urgency.HIGH;
  } else if (lowerContent.includes('critical') || lowerContent.includes('emergency')) {
    urgency = Urgency.CRITICAL;
  } else if (lowerContent.includes('when you have time') || lowerContent.includes('no rush')) {
    urgency = Urgency.LOW;
  }
  
  // Wykrywanie formalności
  let formality = Formality.NEUTRAL;
  if (lowerContent.includes('dear sir') || lowerContent.includes('yours sincerely') || lowerContent.includes('to whom it may concern')) {
    formality = Formality.FORMAL;
  } else if (lowerContent.includes('hey') || lowerContent.includes('btw') || lowerContent.includes('lol')) {
    formality = Formality.INFORMAL;
  }
  
  // Prosty ekstraktor tematów - pobiera cztery najczęstsze słowa
  const words = lowerContent.split(/\W+/).filter(w => w.length > 3 && !['from', 'this', 'that', 'with', 'have', 'your'].includes(w));
  const wordCounts = {};
  words.forEach(word => {
    wordCounts[word] = (wordCounts[word] || 0) + 1;
  });
  
  const topTopics = Object.entries(wordCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(entry => entry[0]);
  
  // Proste podsumowanie - pierwsze 100 znaków + "..."
  const summaryText = content.length > 100 
    ? `${content.substring(0, 100)}...` 
    : content;
  
  return new ToneAnalysis({
    sentiment,
    emotions,
    urgency,
    formality,
    topTopics,
    summaryText
  });
}

module.exports = {
  analyzeTone
};