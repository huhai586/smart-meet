/**
 * Language detection utility
 * Detects the language of given text content
 */

import { supportedLanguages } from './languages';

/**
 * Simple language detection based on character patterns
 * This is a basic implementation that can be enhanced with more sophisticated algorithms
 */
export const detectLanguage = (text: string): string => {
  if (!text || text.trim().length === 0) {
    return 'en'; // Default to English for empty text
  }

  const cleanText = text.trim().toLowerCase();
  
  // Chinese characters detection
  if (/[\u4e00-\u9fff]/.test(cleanText)) {
    return 'zh';
  }
  
  // Japanese characters detection (Hiragana, Katakana, Kanji)
  if (/[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/.test(cleanText)) {
    return 'ja';
  }
  
  // Korean characters detection
  if (/[\uac00-\ud7af]/.test(cleanText)) {
    return 'ko';
  }
  
  // Arabic characters detection
  if (/[\u0600-\u06ff]/.test(cleanText)) {
    return 'ar';
  }
  
  // Persian characters detection
  if (/[\u0600-\u06ff]/.test(cleanText) && /[\u06cc\u06a9\u06af]/.test(cleanText)) {
    return 'fa';
  }
  
  // Hindi characters detection
  if (/[\u0900-\u097f]/.test(cleanText)) {
    return 'hi';
  }
  
  // Thai characters detection
  if (/[\u0e00-\u0e7f]/.test(cleanText)) {
    return 'th';
  }
  
  // Vietnamese characters detection
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(cleanText)) {
    return 'vi';
  }
  
  // Common European language patterns
  const words = cleanText.split(/\s+/);
  const commonWords = {
    'es': ['el', 'la', 'de', 'que', 'y', 'en', 'un', 'es', 'se', 'no', 'te', 'lo', 'le', 'da', 'su', 'por', 'son', 'con', 'para', 'una', 'del', 'al', 'como', 'las', 'pero', 'sus', 'ese', 'está', 'han', 'si'],
    'fr': ['le', 'de', 'et', 'à', 'un', 'il', 'être', 'et', 'en', 'avoir', 'que', 'pour', 'dans', 'ce', 'son', 'une', 'sur', 'avec', 'ne', 'se', 'pas', 'tout', 'plus', 'par', 'grand', 'quand', 'même', 'lui', 'nous', 'si'],
    'de': ['der', 'die', 'und', 'in', 'den', 'von', 'zu', 'das', 'mit', 'sich', 'des', 'auf', 'für', 'ist', 'im', 'dem', 'nicht', 'ein', 'eine', 'als', 'auch', 'es', 'an', 'werden', 'aus', 'er', 'hat', 'dass', 'sie', 'nach'],
    'it': ['il', 'di', 'che', 'e', 'la', 'per', 'un', 'in', 'con', 'del', 'da', 'a', 'al', 'le', 'si', 'dei', 'su', 'come', 'dalla', 'o', 'se', 'lui', 'ci', 'lo', 'questo', 'nel', 'della', 'ha', 'una', 'gli'],
    'pt': ['o', 'de', 'a', 'e', 'do', 'da', 'em', 'um', 'para', 'é', 'com', 'não', 'uma', 'os', 'no', 'se', 'na', 'por', 'mais', 'as', 'dos', 'como', 'mas', 'foi', 'ao', 'ele', 'das', 'tem', 'à', 'seu'],
    'ru': ['и', 'в', 'не', 'на', 'я', 'быть', 'с', 'а', 'о', 'от', 'по', 'это', 'она', 'они', 'к', 'но', 'мы', 'как', 'из', 'у', 'который', 'то', 'за', 'свой', 'что', 'её', 'так', 'вы', 'же', 'от']
  };
  
  // Check for common words in European languages
  for (const [lang, commonWordsArray] of Object.entries(commonWords)) {
    const matches = words.filter(word => commonWordsArray.includes(word)).length;
    if (matches > words.length * 0.1) { // If more than 10% of words are common words
      return lang;
    }
  }
  
  // Default to English if no specific language detected
  return 'en';
};

/**
 * Get language name for display
 */
export const getLanguageName = (langCode: string): string => {
  const language = supportedLanguages.find(lang => lang.code === langCode);
  return language ? language.name : 'Unknown';
};

/**
 * Check if a language code is supported
 */
export const isSupportedLanguage = (langCode: string): boolean => {
  return supportedLanguages.some(lang => lang.code === langCode);
}; 