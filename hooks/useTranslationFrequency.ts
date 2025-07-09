import { useState, useEffect } from 'react';

// 存储在Chrome存储中的键名
const STORAGE_KEY = 'translationFrequency';

// 默认翻译频率（秒）
const DEFAULT_FREQUENCY = 2.5;

/**
 * 管理翻译频率的Hook
 * @returns [frequency, setFrequency] - 当前频率和设置频率的函数
 */
export const useTranslationFrequency = (): [number, (frequency: number) => void] => {
  const [frequency, setFrequencyState] = useState<number>(DEFAULT_FREQUENCY);

  // 初始化时从Chrome存储中加载设置
  useEffect(() => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      const translationFrequency = result[STORAGE_KEY] ?? DEFAULT_FREQUENCY;
      setFrequencyState(translationFrequency);
    });
  }, []);

  // 设置频率并保存到Chrome存储
  const setFrequency = (newFrequency: number) => {
    setFrequencyState(newFrequency);
    chrome.storage.sync.set({ [STORAGE_KEY]: newFrequency }, () => {
      console.log(`Translation frequency set to ${newFrequency}s`);
    });
  };

  return [frequency, setFrequency];
};

/**
 * 获取当前翻译频率
 * @returns Promise<number> - 当前频率（秒）
 */
export const getTranslationFrequency = async (): Promise<number> => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      resolve(result[STORAGE_KEY] ?? DEFAULT_FREQUENCY);
    });
  });
};

/**
 * 将频率转换为毫秒
 * @param frequency - 频率（秒）
 * @returns 毫秒数
 */
export const frequencyToMs = (frequency: number): number => {
  return frequency * 1000;
}; 