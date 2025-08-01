import { useState, useEffect, useCallback } from "react"
import translations from './translations';
import { getCurrentUILanguage } from '../../hooks/useUILanguage';
import type { Language } from '../languages';
import { getLanguageByCode } from '../languages';

// 默认语言代码
const DEFAULT_LANGUAGE = 'en';

// 获取翻译文本
export const getTranslation = (key: string, langCode: string, params?: Record<string, string>): string => {
  // 获取指定语言的翻译
  const langTranslations = translations[langCode] || translations[DEFAULT_LANGUAGE];
  
  // 获取翻译文本
  let text = langTranslations[key] || key;
  
  // 替换参数
  if (params) {
    Object.entries(params).forEach(([paramKey, paramValue]) => {
      text = text.replace(`{${paramKey}}`, paramValue);
    });
  }
  
  return text;
};

// 创建一个全局缓存的当前UI语言
let cachedUILanguage: Language | null = null;

// 设置缓存的UI语言
export const setCachedLanguage = (language: Language): void => {
  cachedUILanguage = language;
};

// 获取缓存的UI语言代码
export const getCachedLanguageCode = (): string => {
  return cachedUILanguage?.code || DEFAULT_LANGUAGE;
};

// 翻译函数，使用当前缓存的UI语言
export const t = (key: string, params?: Record<string, string>): string => {
  return getTranslation(key, getCachedLanguageCode(), params);
};

// 创建一个事件总线，用于在组件之间通信
export const languageChangeListeners: Set<(langCode: string) => void> = new Set();

// 触发语言变更事件
export const triggerLanguageChange = (langCode: string): void => {
  languageChangeListeners.forEach(listener => listener(langCode));
};

// i18n Hook
export const useI18n = () => {
  const [langCode, setLangCode] = useState<string>(getCachedLanguageCode());
  
  // 初始化时从存储中加载UI语言设置
  useEffect(() => {
    const loadLanguage = async () => {
      const currentUILanguage = await getCurrentUILanguage();
      setCachedLanguage(currentUILanguage);
      setLangCode(currentUILanguage.code);
    };
    
    loadLanguage();
    
    // 监听来自其他组件的UI语言变更消息
    const handleMessage = (message) => {
      if (message.action === 'uiLanguageChanged') {
        const newLangCode = message.languageCode;
        const newLanguage = getLanguageByCode(newLangCode);
        if (newLanguage) {
          setCachedLanguage(newLanguage);
          setLangCode(newLangCode);
        }
      }
    };
    
    // 添加消息监听器
    chrome.runtime.onMessage.addListener(handleMessage);
    
    // 添加到事件总线
    const handleLanguageChange = (newLangCode: string) => {
      setLangCode(newLangCode);
    };
    languageChangeListeners.add(handleLanguageChange);
    
    // 清理函数
    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
      languageChangeListeners.delete(handleLanguageChange);
    };
  }, []);
  
  // 翻译函数
  const translate = useCallback((key: string, params?: Record<string, string>): string => {
    return getTranslation(key, langCode, params);
  }, [langCode]);
  
  return {
    t: translate,
    langCode
  };
};

export default useI18n; 