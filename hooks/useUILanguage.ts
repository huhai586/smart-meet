import { useState, useEffect } from 'react';
import { defaultLanguage, getLanguageByCode } from '../utils/languages';
import type { Language } from '../utils/languages';
import { setCachedLanguage, triggerLanguageChange } from '../utils/i18n';

// Storage key for UI language
const STORAGE_KEY = 'uiLanguage';

/**
 * Hook to manage UI language
 * @returns [language, setLanguage] - Current UI language and function to set it
 */
export const useUILanguage = (): [Language, (language: Language) => void] => {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  // Load language from Chrome storage on initialization
  useEffect(() => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) {
        const lang = getLanguageByCode(result[STORAGE_KEY]);
        setLanguageState(lang);
        // Update UI language cache
        setCachedLanguage(lang);
      } else {
        // If UI language is not set, check if translation language is set
        chrome.storage.sync.get(['translationLanguage'], (transResult) => {
          if (transResult['translationLanguage']) {
            // Use translation language as initial UI language for backward compatibility
            const transLang = getLanguageByCode(transResult['translationLanguage']);
            setLanguageState(transLang);
            setCachedLanguage(transLang);
            // Save it as UI language
            chrome.storage.sync.set({ [STORAGE_KEY]: transLang.code });
          } else {
            // Use default language
            setLanguageState(defaultLanguage);
            setCachedLanguage(defaultLanguage);
          }
        });
      }
    });
  }, []);

  // Set language and save to Chrome storage
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    // Update UI language cache
    setCachedLanguage(newLanguage);
    // Trigger language change event
    triggerLanguageChange(newLanguage.code);
    
    chrome.storage.sync.set({ [STORAGE_KEY]: newLanguage.code }, () => {
      console.log(`UI language set to ${newLanguage.name}`);
    });
  };

  return [language, setLanguage];
};

/**
 * Get current UI language
 * @returns Promise<Language> - Current language
 */
export const getCurrentUILanguage = async (): Promise<Language> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) {
        const lang = getLanguageByCode(result[STORAGE_KEY]);
        // Update UI language cache
        setCachedLanguage(lang);
        resolve(lang);
      } else {
        // If UI language is not set, check if translation language is set
        chrome.storage.sync.get(['translationLanguage'], (transResult) => {
          if (transResult['translationLanguage']) {
            // Use translation language as initial UI language for backward compatibility
            const transLang = getLanguageByCode(transResult['translationLanguage']);
            setCachedLanguage(transLang);
            // Save it as UI language
            chrome.storage.sync.set({ [STORAGE_KEY]: transLang.code });
            resolve(transLang);
          } else {
            // Use default language
            setCachedLanguage(defaultLanguage);
            resolve(defaultLanguage);
          }
        });
      }
    });
  });
};

export default useUILanguage; 