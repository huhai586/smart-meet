import { useState, useEffect } from 'react';
import { getConfigValue, setConfigValue } from '~/utils/appConfig';

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
 */
export const useTranslationProvider = (): [TranslationProvider, (provider: TranslationProvider) => void] => {
  const [provider, setProviderState] = useState<TranslationProvider>(defaultProvider);

  useEffect(() => {
    getConfigValue('translationProvider').then((v) => {
      const p = v || defaultProvider;
      setProviderState(VALID_PROVIDERS.includes(p as TranslationProvider) ? (p as TranslationProvider) : defaultProvider);
    });
  }, []);

  const setProvider = (newProvider: TranslationProvider) => {
    if (!VALID_PROVIDERS.includes(newProvider)) {
      console.error(`[setProvider] Invalid provider: ${newProvider}`);
      return;
    }
    setProviderState(newProvider);
    setConfigValue('translationProvider', newProvider);
  };

  return [provider, setProvider];
};

/**
 * 获取当前翻译服务提供商
 */
export const getCurrentTranslationProvider = async (): Promise<TranslationProvider> => {
  const p = await getConfigValue('translationProvider');
  const resolved = p || defaultProvider;
  return VALID_PROVIDERS.includes(resolved as TranslationProvider) ? (resolved as TranslationProvider) : defaultProvider;
};

/**
 * 获取翻译服务提供商的显示名称
 */
export const getProviderDisplayName = (provider: TranslationProvider): string => {
  switch (provider) {
    case 'google': return 'Google Translate';
    case 'microsoft': return 'Microsoft Translator';
    case 'ai': return 'AI Translation';
    case 'deepl': return 'DeepL';
    case 'local': return 'Local AI Translation';
    default: return 'Google Translate';
  }
};

/**
 * 管理 DeepL 配置的 Hook
 */
export const useDeepLConfig = (): [DeepLConfig, (config: DeepLConfig) => void] => {
  const [config, setConfigState] = useState<DeepLConfig>({ auth_key: '' });

  useEffect(() => {
    getConfigValue('deeplConfig').then((v) => {
      if (v) setConfigState(v);
    });
  }, []);

  const setConfig = (newConfig: DeepLConfig) => {
    setConfigState(newConfig);
    setConfigValue('deeplConfig', newConfig);
  };

  return [config, setConfig];
};

/**
 * 获取 DeepL auth_key
 */
export const getDeepLAuthKey = async (): Promise<string> => {
  const v = await getConfigValue('deeplConfig');
  return v?.auth_key ?? '';
};

/**
 * 管理 LocalTranslator 配置的 Hook
 */
export const useLocalTranslatorConfig = (): [LocalTranslatorConfig, (config: LocalTranslatorConfig) => void] => {
  const [config, setConfigState] = useState<LocalTranslatorConfig>({ sourceLanguage: 'en' });

  useEffect(() => {
    getConfigValue('localTranslatorConfig').then((v) => {
      if (v) setConfigState(v);
    });
  }, []);

  const setConfig = (newConfig: LocalTranslatorConfig) => {
    setConfigState(newConfig);
    setConfigValue('localTranslatorConfig', newConfig);
  };

  return [config, setConfig];
};

/**
 * 获取 LocalTranslator 配置
 */
export const getLocalTranslatorConfig = async (): Promise<LocalTranslatorConfig> => {
  const v = await getConfigValue('localTranslatorConfig');
  return v ?? { sourceLanguage: 'en' };
};
