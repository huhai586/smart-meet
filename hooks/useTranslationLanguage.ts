import { useState, useEffect } from 'react';
import { defaultLanguage, getLanguageByCode } from '../utils/languages';
import type { Language } from '../utils/languages';

// 存储在Chrome存储中的键名
const STORAGE_KEY = 'translationLanguage';

// 确保默认翻译语言为中文
const defaultTranslationLanguage: Language = defaultLanguage; // 中文

/**
 * 管理翻译语言的Hook
 * @returns [language, setLanguage] - 当前语言和设置语言的函数
 */
export const useTranslationLanguage = (): [Language, (language: Language) => void] => {
  const [language, setLanguageState] = useState<Language>(defaultTranslationLanguage);

  // 初始化时从Chrome存储中加载语言设置
  useEffect(() => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      if (result[STORAGE_KEY]) {
        const lang = getLanguageByCode(result[STORAGE_KEY]);
        setLanguageState(lang);
      } else {
        // 如果未设置翻译语言，使用默认翻译语言（中文）
        setLanguageState(defaultTranslationLanguage);
        // 保存默认翻译语言
        chrome.storage.sync.set({ [STORAGE_KEY]: defaultTranslationLanguage.code });
      }
    });
  }, []);

  // 设置语言并保存到Chrome存储
  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    // 移除UI语言缓存更新
    // 移除语言变更事件触发
    
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
        resolve(lang);
      } else {
        // 如果未设置翻译语言，使用默认翻译语言（中文）
        // 保存默认翻译语言
        chrome.storage.sync.set({ [STORAGE_KEY]: defaultTranslationLanguage.code });
        resolve(defaultTranslationLanguage);
      }
    });
  });
};

export default useTranslationLanguage; 