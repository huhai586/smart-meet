import { useState, useEffect } from 'react';
import { defaultLanguage, getLanguageByCode } from '../utils/languages';
import type { Language } from '../utils/languages';
import { getConfigValue, setConfigValue } from '~/utils/appConfig';

// 确保默认翻译语言为中文
const defaultTranslationLanguage: Language = defaultLanguage;

/**
 * 管理翻译语言的Hook
 */
export const useTranslationLanguage = (): [Language, (language: Language) => void] => {
  const [language, setLanguageState] = useState<Language>(defaultTranslationLanguage);

  useEffect(() => {
    getConfigValue('translationLanguage').then((code) => {
      if (code) {
        setLanguageState(getLanguageByCode(code));
      } else {
        setLanguageState(defaultTranslationLanguage);
        setConfigValue('translationLanguage', defaultTranslationLanguage.code);
      }
    });
  }, []);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    setConfigValue('translationLanguage', newLanguage.code);
  };

  return [language, setLanguage];
};

/**
 * 获取当前翻译语言
 */
export const getCurrentLanguage = async (): Promise<Language> => {
  const code = await getConfigValue('translationLanguage');
  if (code) {
    return getLanguageByCode(code);
  }
  await setConfigValue('translationLanguage', defaultTranslationLanguage.code);
  return defaultTranslationLanguage;
};

export default useTranslationLanguage;
