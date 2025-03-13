import { useState, useEffect } from 'react';
import { defaultLanguage, getLanguageByCode, supportedLanguages } from '../utils/languages';
import type { Language } from '../utils/languages';
import { setCachedLanguage, triggerLanguageChange } from '../utils/i18n';

// Storage key for UI language
const STORAGE_KEY = 'uiLanguage';

// 默认UI语言设置为英文
const defaultUILanguage: Language = supportedLanguages.find(lang => lang.code === 'en') || defaultLanguage;

/**
 * Hook to manage UI language
 * @returns [language, setLanguage] - Current UI language and function to set it
 */
export const useUILanguage = (): [Language, (language: Language) => void] => {
  const [language, setLanguageState] = useState<Language>(defaultUILanguage);

  // Load language from Chrome storage on initialization
  useEffect(() => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) {
        const lang = getLanguageByCode(result[STORAGE_KEY]);
        setLanguageState(lang);
        // Update UI language cache
        setCachedLanguage(lang);
      } else {
        // 如果UI语言未设置，使用默认UI语言（英文）
        setLanguageState(defaultUILanguage);
        setCachedLanguage(defaultUILanguage);
        // 保存默认UI语言
        chrome.storage.sync.set({ [STORAGE_KEY]: defaultUILanguage.code });
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
        // 如果UI语言未设置，使用默认UI语言（英文）
        setCachedLanguage(defaultUILanguage);
        // 保存默认UI语言
        chrome.storage.sync.set({ [STORAGE_KEY]: defaultUILanguage.code });
        resolve(defaultUILanguage);
      }
    });
  });
};

export default useUILanguage; 