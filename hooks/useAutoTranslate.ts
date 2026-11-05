import { useState, useEffect, useCallback, useRef } from 'react';
import { getCurrentTranslationProvider } from './useTranslationProvider';
import { translateText } from '../utils/unified-translation';
import { getTranslationFrequency, frequencyToMs } from './useTranslationFrequency';
import useI18n from "../utils/i18n";
import { getConfigValue, setConfigValue, onConfigChanged } from '../utils/appConfig';

// 存储在Chrome存储中的键名
const STORAGE_KEY = 'autoTranslateEnabled';

// 只自动翻译最近这段时间内产生的内容（打开侧边栏时不会批量翻译历史字幕）
const AUTO_TRANSLATE_WINDOW_MS = 20 * 1000;

/**
 * 管理自动翻译开关的Hook
 * @returns [enabled, setEnabled] - 当前状态和设置状态的函数
 */
export const useAutoTranslate = (): [boolean, (enabled: boolean) => void] => {
  const [enabled, setEnabledState] = useState<boolean>(false);

  useEffect(() => {
    getConfigValue('autoTranslateEnabled').then((v) => setEnabledState(v ?? false));

    const unsubscribe = onConfigChanged((changes) => {
      const field = changes['autoTranslateEnabled'] as { value: boolean } | undefined;
      if (field !== undefined) setEnabledState(field.value);
    });
    return unsubscribe;
  }, []);

  const setEnabled = (newEnabled: boolean) => {
    setEnabledState(newEnabled);
    setConfigValue('autoTranslateEnabled', newEnabled);
  };

  return [enabled, setEnabled];
};

/**
 * 获取当前自动翻译状态
 * @returns Promise<boolean> - 当前状态
 */
export const getAutoTranslateEnabled = async (): Promise<boolean> => {
  return getConfigValue('autoTranslateEnabled');
};

/**
 * 自动翻译内容的Hook
 * @param content - 需要翻译的内容
 * @param timestamp - 内容产生的时间戳
 * @returns 翻译相关的状态和方法
 */
export const useAutoTranslateContent = (content: string, timestamp: number) => {
  const { t } = useI18n();
  const [autoTranslatedContent, setAutoTranslatedContent] = useState<string>('');
  const [isAutoTranslating, setIsAutoTranslating] = useState(false);
  
  // 用于管理翻译逻辑的refs
  const autoTranslateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranslatedContentRef = useRef<string>('');
  const pendingTextRef = useRef<string>('');

  // 检查内容是否在自动翻译的时间窗口内产生
  const isContentRecent = useCallback((contentTimestamp: number): boolean => {
    return contentTimestamp > Date.now() - AUTO_TRANSLATE_WINDOW_MS;
  }, []);

  // 执行翻译的核心函数
  const executeTranslation = useCallback(async (textToTranslate: string) => {
    try {
      setIsAutoTranslating(true);
      lastTranslatedContentRef.current = textToTranslate;
      
      // Errors stay in the console: auto translation runs on every caption and must not toast each failure.
      const translatedText = await translateText(textToTranslate, { silent: true });
      
      // 检查是否是错误消息
      const isErrorMessage = translatedText.includes(t('translation_failed')) || 
                            translatedText.includes(t('translation_service_not_configured')) ||
                            translatedText.includes(t('translation_network_error')) ||
                            translatedText.includes(t('translation_service_unavailable'));
      
      if (!isErrorMessage) {
        setAutoTranslatedContent(translatedText);
      }
    } catch (error) {
      console.error('Auto translation error:', error);
    } finally {
      // 获取用户配置的翻译频率并转换为毫秒
      const frequency = await getTranslationFrequency();
      const delayMs = frequencyToMs(frequency);
      
      setTimeout(() => {
        setIsAutoTranslating(false);
        if (pendingTextRef.current) {
          const pendingText = pendingTextRef.current;
          pendingTextRef.current = ''; // 清空pending
          executeTranslation(pendingText);
        }
      }, delayMs);      
      // 翻译完成后检查是否有pending的文本需要处理
    }
  }, [t]);

  // 自动翻译函数 - 带pending机制
  const performAutoTranslation = useCallback(async (textToTranslate: string) => {
    if (!textToTranslate || textToTranslate === lastTranslatedContentRef.current) {
      return;
    }

    // 如果当前正在翻译，将新请求存储到pending
    if (isAutoTranslating) {
      pendingTextRef.current = textToTranslate;
      return;
    }

    // 如果没有正在进行的翻译，立即执行
    await executeTranslation(textToTranslate);
  }, [isAutoTranslating, executeTranslation]);

  // 监听内容变化，执行自动翻译
  useEffect(() => {
    const checkAutoTranslate = async () => {
      const autoTranslateEnabled = await getAutoTranslateEnabled();
      
      // 检查内容是否已经被翻译过
      if (content && content === lastTranslatedContentRef.current) {
        return;
      }
      
      // 检查是否启用自动翻译、有内容、且内容是最近20秒内产生的
      if (autoTranslateEnabled && content && isContentRecent(timestamp)) {
        console.log('Content is recent, performing auto translation');
        performAutoTranslation(content);
      } else {
        // 如果自动翻译被禁用或内容过旧，清除翻译内容和pending
        if (!autoTranslateEnabled) {
          console.log('Auto translate disabled, clearing content');
        } else if (!isContentRecent(timestamp)) {
          console.log('Content is too old (>20 seconds), skipping translation');
        }
        setAutoTranslatedContent('');
        lastTranslatedContentRef.current = '';
        pendingTextRef.current = '';
      }
    };

    checkAutoTranslate();

    // 清理函数
    return () => {
       
    };
  }, [content, timestamp, performAutoTranslation, isContentRecent]);

  // 测试翻译提供商获取功能
  useEffect(() => {
    const testTranslationProvider = async () => {
      try {
        const provider = await getCurrentTranslationProvider();
        console.log(`[useAutoTranslateContent] Test - Current provider: ${provider}`);

      } catch (error) {
        console.error('[useAutoTranslateContent] Test - Error getting provider:', error);
      }
    };

    testTranslationProvider();
  }, []); // 只在组件挂载时执行一次

  // 清理函数 - 当组件卸载时清理所有状态
  const cleanup = useCallback(() => {
    if (autoTranslateTimeoutRef.current) {
      clearTimeout(autoTranslateTimeoutRef.current);
    }
    setAutoTranslatedContent('');
    lastTranslatedContentRef.current = '';
    pendingTextRef.current = '';
  }, []);

  return {
    autoTranslatedContent,
    isAutoTranslating,
    cleanup
  };
}; 