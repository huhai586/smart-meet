import { useState, useEffect } from 'react';
import { defaultLanguage, getLanguageByCode, supportedLanguages } from '../utils/languages';
import type { Language } from '../utils/languages';
import { setCachedLanguage, triggerLanguageChange } from '../utils/i18n';
import { getConfigValue, setConfigValue } from '~/utils/appConfig';

// 默认UI语言设置为英文
const defaultUILanguage: Language = supportedLanguages.find(lang => lang.code === 'en') || defaultLanguage;

/**
 * Hook to manage UI language
 */
export const useUILanguage = (): [Language, (language: Language) => void] => {
  const [language, setLanguageState] = useState<Language>(defaultUILanguage);

  useEffect(() => {
    getConfigValue('uiLanguage').then((code) => {
      if (code) {
        const lang = getLanguageByCode(code);
        setLanguageState(lang);
        setCachedLanguage(lang);
      } else {
        setLanguageState(defaultUILanguage);
        setCachedLanguage(defaultUILanguage);
      }
    });
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setCachedLanguage(newLanguage);
    triggerLanguageChange(newLanguage.code);
    setConfigValue('uiLanguage', newLanguage.code);
  };

  return [language, setLanguage];
};

/**
 * Get current UI language
 */
export const getCurrentUILanguage = async (): Promise<Language> => {
  const code = await getConfigValue('uiLanguage');
  if (code) {
    const lang = getLanguageByCode(code);
    setCachedLanguage(lang);
    return lang;
  }
  setCachedLanguage(defaultUILanguage);
  await setConfigValue('uiLanguage', defaultUILanguage.code);
  return defaultUILanguage;
};

export default useUILanguage;
