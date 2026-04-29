import { useState, useEffect } from 'react';
import { getConfigValue, setConfigValue, onConfigChanged } from '~/utils/appConfig';

// 默认翻译频率（秒）
const DEFAULT_FREQUENCY = 2.5;

/**
 * 管理翻译频率的Hook
 */
export const useTranslationFrequency = (): [number, (frequency: number) => void] => {
  const [frequency, setFrequencyState] = useState<number>(DEFAULT_FREQUENCY);

  useEffect(() => {
    getConfigValue('translationFrequency').then((v) => setFrequencyState(v ?? DEFAULT_FREQUENCY));

    const unsubscribe = onConfigChanged((changes) => {
      const field = changes['translationFrequency'] as { value: number } | undefined;
      if (field !== undefined) setFrequencyState(field.value);
    });
    return unsubscribe;
  }, []);

  const setFrequency = (newFrequency: number) => {
    setFrequencyState(newFrequency);
    setConfigValue('translationFrequency', newFrequency);
  };

  return [frequency, setFrequency];
};

/**
 * 获取当前翻译频率
 */
export const getTranslationFrequency = async (): Promise<number> => {
  return getConfigValue('translationFrequency').then((v) => v ?? DEFAULT_FREQUENCY);
};

export const frequencyToMs = (frequency: number): number => {
  return frequency * 1000;
}; 