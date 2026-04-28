import { useState, useEffect } from 'react';

// 存储在Chrome存储中的键名
const STORAGE_KEY = 'translationProvider';
const DEEPL_CONFIG_KEY = 'deeplConfig';
const LOCAL_TRANSLATOR_CONFIG_KEY = 'localTranslatorConfig';

// 翻译服务提供商类型
export type TranslationProvider = 'google' | 'microsoft' | 'ai' | 'deepl' | 'local';

export interface DeepLConfig {
  auth_key: string;
}

export interface LocalTranslatorConfig {
  sourceLanguage: string;
}

// 默认翻译服务提供商
const defaultProvider: TranslationProvider = 'microsoft';

const VALID_PROVIDERS: TranslationProvider[] = ['google', 'microsoft', 'ai', 'deepl', 'local'];

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
    console.log(`[setProvider] Setting translation provider to: ${newProvider}`);
    
    // 验证提供商值的有效性
    if (!VALID_PROVIDERS.includes(newProvider)) {
      console.error(`[setProvider] Invalid provider: ${newProvider}`);
      return;
    }
    
    // 立即更新本地状态
    setProviderState(newProvider);
    
    // 保存到Chrome存储
    chrome.storage.sync.set({ [STORAGE_KEY]: newProvider }, () => {
      // 检查Chrome runtime错误
      if (chrome.runtime.lastError) {
        console.error(`[setProvider] Chrome runtime error:`, chrome.runtime.lastError);
        // 如果保存失败，恢复到之前的状态
        setProviderState(provider);
        return;
      }
      
      console.log(`[setProvider] Translation provider saved to storage: ${newProvider}`);
      console.log(`Translation provider set to ${newProvider}`);
      
      // 验证保存是否成功
      chrome.storage.sync.get([STORAGE_KEY], (result) => {
        if (chrome.runtime.lastError) {
          console.error(`[setProvider] Verification failed:`, chrome.runtime.lastError);
          return;
        }
        
        console.log(`[setProvider] Verification - Storage now contains:`, result);
        
        if (result[STORAGE_KEY] !== newProvider) {
          console.error(`[setProvider] Storage verification failed! Expected: ${newProvider}, Got: ${result[STORAGE_KEY]}`);
        } else {
          console.log(`[setProvider] Storage verification successful!`);
        }
      });
    });
  };

  return [provider, setProvider];
};

/**
 * 获取当前翻译服务提供商
 * @returns Promise<TranslationProvider> - 当前提供商
 */
export const getCurrentTranslationProvider = async (): Promise<TranslationProvider> => {
  return new Promise((resolve, _reject) => {
    // 添加超时机制
    const timeout = setTimeout(() => {
      console.warn('[getCurrentTranslationProvider] Timeout, using default provider');
      resolve(defaultProvider);
    }, 5000); // 5秒超时

    try {
      chrome.storage.sync.get([STORAGE_KEY], (result) => {
        clearTimeout(timeout);
        
        // 检查Chrome runtime错误
        if (chrome.runtime.lastError) {
          console.error('[getCurrentTranslationProvider] Chrome runtime error:', chrome.runtime.lastError);
          resolve(defaultProvider);
          return;
        }

        const provider = result[STORAGE_KEY] || defaultProvider;
        console.log(`[getCurrentTranslationProvider] Storage result:`, result);
        console.log(`[getCurrentTranslationProvider] Selected provider: ${provider}`);
        
        // 验证提供商值的有效性
        if (!VALID_PROVIDERS.includes(provider as TranslationProvider)) {
          console.warn(`[getCurrentTranslationProvider] Invalid provider: ${provider}, using default`);
          resolve(defaultProvider);
          return;
        }
        
        resolve(provider as TranslationProvider);
      });
    } catch (error) {
      clearTimeout(timeout);
      console.error('[getCurrentTranslationProvider] Error accessing storage:', error);
      resolve(defaultProvider);
    }
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
    case 'deepl':
      return 'DeepL';
    case 'local':
      return 'Local AI Translation';
    default:
      return 'Google Translate';
  }
};

/**
 * 管理 DeepL 配置的 Hook
 */
export const useDeepLConfig = (): [DeepLConfig, (config: DeepLConfig) => void] => {
  const [config, setConfigState] = useState<DeepLConfig>({ auth_key: '' });

  useEffect(() => {
    chrome.storage.sync.get([DEEPL_CONFIG_KEY], (result) => {
      if (result[DEEPL_CONFIG_KEY]) {
        setConfigState(result[DEEPL_CONFIG_KEY]);
      }
    });
  }, []);

  const setConfig = (newConfig: DeepLConfig) => {
    setConfigState(newConfig);
    chrome.storage.sync.set({ [DEEPL_CONFIG_KEY]: newConfig });
  };

  return [config, setConfig];
};

/**
 * 获取 DeepL auth_key
 */
export const getDeepLAuthKey = async (): Promise<string> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([DEEPL_CONFIG_KEY], (result) => {
      resolve(result[DEEPL_CONFIG_KEY]?.auth_key ?? '');
    });
  });
};

/**
 * 管理 LocalTranslator 配置的 Hook
 */
export const useLocalTranslatorConfig = (): [LocalTranslatorConfig, (config: LocalTranslatorConfig) => void] => {
  const [config, setConfigState] = useState<LocalTranslatorConfig>({ sourceLanguage: 'en' });

  useEffect(() => {
    chrome.storage.sync.get([LOCAL_TRANSLATOR_CONFIG_KEY], (result) => {
      if (result[LOCAL_TRANSLATOR_CONFIG_KEY]) {
        setConfigState(result[LOCAL_TRANSLATOR_CONFIG_KEY]);
      }
    });
  }, []);

  const setConfig = (newConfig: LocalTranslatorConfig) => {
    setConfigState(newConfig);
    chrome.storage.sync.set({ [LOCAL_TRANSLATOR_CONFIG_KEY]: newConfig });
  };

  return [config, setConfig];
};

/**
 * 获取 LocalTranslator 配置
 */
export const getLocalTranslatorConfig = async (): Promise<LocalTranslatorConfig> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([LOCAL_TRANSLATOR_CONFIG_KEY], (result) => {
      resolve(result[LOCAL_TRANSLATOR_CONFIG_KEY] ?? { sourceLanguage: 'en' });
    });
  });
}; 