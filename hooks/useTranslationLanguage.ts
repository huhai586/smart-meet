import { useState, useEffect } from 'react';
import { defaultLanguage, getLanguageByCode } from '../utils/languages';
import type { Language } from '../utils/languages';
import { setCachedLanguage, triggerLanguageChange } from '../utils/i18n';

// 存储在Chrome存储中的键名
const STORAGE_KEY = 'translationLanguage';

/**
 * 管理翻译语言的Hook
 * @returns [language, setLanguage] - 当前语言和设置语言的函数
 */
export const useTranslationLanguage = (): [Language, (language: Language) => void] => {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);

  // 初始化时从Chrome存储中加载语言设置
  useEffect(() => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) {
        const lang = getLanguageByCode(result[STORAGE_KEY]);
        setLanguageState(lang);
        // 同时更新UI语言缓存
        setCachedLanguage(lang);
      }
    });
  }, []);

  // 设置语言并保存到Chrome存储
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    // 同时更新UI语言缓存
    setCachedLanguage(newLanguage);
    // 触发语言变更事件
    triggerLanguageChange(newLanguage.code);
    
    chrome.storage.sync.set({ [STORAGE_KEY]: newLanguage.code }, () => {
      console.log(`Translation language set to ${newLanguage.name}`);
    });
  };

  return [language, setLanguage];
};

/**
 * 获取当前翻译语言
 * @returns Promise<Language> - 当前语言
 */
export const getCurrentLanguage = async (): Promise<Language> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) {
        const lang = getLanguageByCode(result[STORAGE_KEY]);
        // 同时更新UI语言缓存
        setCachedLanguage(lang);
        resolve(lang);
      } else {
        // 同时更新UI语言缓存
        setCachedLanguage(defaultLanguage);
        resolve(defaultLanguage);
      }
    });
  });
};

export default useTranslationLanguage; 