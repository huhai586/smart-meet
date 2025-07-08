import { useState, useEffect } from 'react';

// 存储在Chrome存储中的键名
const STORAGE_KEY = 'translationProvider';

// 翻译服务提供商类型
export type TranslationProvider = 'google' | 'microsoft' | 'ai';

// 默认翻译服务提供商
const defaultProvider: TranslationProvider = 'google';

/**
 * 管理翻译服务提供商的Hook
 * @returns [provider, setProvider] - 当前提供商和设置提供商的函数
 */
export const useTranslationProvider = (): [TranslationProvider, (provider: TranslationProvider) => void] => {
  const [provider, setProviderState] = useState<TranslationProvider>(defaultProvider);

  // 初始化时从Chrome存储中加载设置
  useEffect(() => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      const translationProvider = result[STORAGE_KEY] || defaultProvider;
      setProviderState(translationProvider);
    });
  }, []);

  // 设置提供商并保存到Chrome存储
  const setProvider = (newProvider: TranslationProvider) => {
    setProviderState(newProvider);
    chrome.storage.sync.set({ [STORAGE_KEY]: newProvider }, () => {
      console.log(`Translation provider set to ${newProvider}`);
    });
  };

  return [provider, setProvider];
};

/**
 * 获取当前翻译服务提供商
 * @returns Promise<TranslationProvider> - 当前提供商
 */
export const getCurrentTranslationProvider = async (): Promise<TranslationProvider> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] || defaultProvider);
    });
  });
};

/**
 * 获取翻译服务提供商的显示名称
 * @param provider - 提供商类型
 * @returns 显示名称
 */
export const getProviderDisplayName = (provider: TranslationProvider): string => {
  switch (provider) {
    case 'google':
      return 'Google Translate';
    case 'microsoft':
      return 'Microsoft Translator';
    case 'ai':
      return 'AI Translation';
    default:
      return 'Google Translate';
  }
}; 