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
  
  // For extreme performance, only check the first character for RTL languages
  const firstChar = cleanText.charAt(0);
  
  // Arabic characters detection (first character only)
  if (/[\u0600-\u06ff]/.test(firstChar)) {
    // Check if it's Persian by looking for specific Persian characters in the text
    if (/[\u06cc\u06a9\u06af]/.test(cleanText)) {
      return 'fa';
    }
    return 'ar';
  }
  
  // Hebrew characters detection (first character only)
  if (/[\u0590-\u05FF]/.test(firstChar)) {
    return 'he';
  }
  
  // Chinese characters detection (first character only)
  if (/[\u4e00-\u9fff]/.test(firstChar)) {
    return 'zh';
  }
  
  // Japanese characters detection (first character only)
  if (/[\u3040-\u309f\u30a0-\u30ff]/.test(firstChar)) {
    return 'ja';
  }
  
  // Korean characters detection (first character only)
  if (/[\uac00-\ud7af]/.test(firstChar)) {
    return 'ko';
  }
  
  // Hindi characters detection (first character only)
  if (/[\u0900-\u097f]/.test(firstChar)) {
    return 'hi';
  }
  
  // Thai characters detection (first character only)
  if (/[\u0e00-\u0e7f]/.test(firstChar)) {
    return 'th';
  }
  
  // Vietnamese characters detection (first character only)
  if (/[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/.test(firstChar)) {
    return 'vi';
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

/**
 * Check if a language code is RTL (Right-to-Left)
 * @param langCode - Language code to check
 * @returns boolean - True if the language is RTL
 */
export const isRTLLanguage = (langCode: string): boolean => {
  // List of RTL language codes
  const rtlLanguages = [
    'ar',  // Arabic
    'fa',  // Persian (Farsi)
    'he',  // Hebrew
    'ur',  // Urdu
    'yi',  // Yiddish
    'ku',  // Kurdish
    'ps',  // Pashto
    'sd',  // Sindhi
    'dv',  // Divehi
    'ug',  // Uyghur
    'arc', // Aramaic
    'syr', // Syriac
    'sam', // Samaritan
    'mand' // Mandaic
  ];
  
  return rtlLanguages.includes(langCode.toLowerCase());
}; 