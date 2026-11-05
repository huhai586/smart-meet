import { getCurrentTranslationProvider } from '../hooks/useTranslationProvider';
import translateByAI from './translate-signal-words';
import { TranslateFailure, TranslationCenterAction, type TranslateRequest, type TranslateResponse } from './translation-center';
import { getCurrentUILanguage } from '../hooks/useUILanguage';
import { getTranslation } from './i18n';
import messageManager from './message-manager';
import { LocalModelNotInstalledError, promptLocalModelDownload } from './local-model-prompt';

export interface TranslateOptions {
  silent?: boolean;
  /** Text the translated text came from; lets language detection see more than a single word. */
  context?: string;
}

const setLoading = (loading: boolean) =>
  window.dispatchEvent(new CustomEvent('global-loading-event', { detail: { loading } }));

const translateInCenter = async (text: string, context?: string): Promise<string> => {
  const request: TranslateRequest = { action: TranslationCenterAction.TRANSLATE, text, context };
  setLoading(true);
  try {
    const response = (await chrome.runtime.sendMessage(request)) as TranslateResponse | undefined;
    if (!response) throw new Error('Translation service unavailable');
    if (response.ok) return response.text;
    // Without strictNullChecks TypeScript does not narrow on `ok`.
    const failure = response as Extract<TranslateResponse, { ok: false }>;
    if (failure.reason === TranslateFailure.LOCAL_MODEL_MISSING) throw await promptLocalModelDownload();
    throw new Error(failure.message);
  } finally {
    setLoading(false);
  }
};

/**
 * 统一的自动翻译接口
 * 内部处理使用Google、微软或AI服务的选择逻辑
 * @param text - 需要翻译的文本
 * @param options.silent - 失败时不弹出全局错误提示（调用方自己展示错误）
 * @param options.context - 原文所在的完整文本，用于本地翻译识别源语言
 * @returns Promise<string> - 翻译结果
 */
export const translateText = async (text: string, options: TranslateOptions = {}): Promise<string> => {
  if (!text || !text.trim()) {
    throw new Error('Text to translate cannot be empty');
  }

  try {
    const provider = await getCurrentTranslationProvider();
    // AI translation needs the AI service this page set up; every other provider runs in the
    // background translation center.
    const translatedText = provider === 'ai'
      ? await translateByAI(text)
      : await translateInCenter(text, options.context);

    console.log(`[translateText] Translation completed with ${provider}: ${translatedText.substring(0, 100)}...`);
    return translatedText;
    
  } catch (error) {
    // Already announced with a link to settings; a generic "unavailable" toast would only replace it.
    if (error instanceof LocalModelNotInstalledError) throw error;
    console.error('[translateText] Translation error:', error);
    
    // 获取当前UI语言以显示本地化错误消息
    const currentUILanguage = await getCurrentUILanguage();
    
    // 根据错误类型返回相应的本地化错误消息
    let errorMessage: string;
    
    if (error?.message?.includes('rate limit') || 
        error?.message?.includes('quota') || 
        error?.message?.includes('429') ||
        error?.message?.includes('频繁')) {
      errorMessage = getTranslation('google_translate_rate_limit_error', currentUILanguage.code);
    } else if (error?.message?.includes('network') || 
               error?.message?.includes('fetch') ||
               error?.message?.includes('网络')) {
      errorMessage = getTranslation('translation_network_error', currentUILanguage.code) || 
                    'Network error, please check your connection';
    } else if (error?.message?.includes('unauthorized') || 
               error?.message?.includes('403') ||
               error?.message?.includes('认证')) {
      errorMessage = getTranslation('translation_service_unauthorized', currentUILanguage.code) || 
                    'Translation service authentication failed';
    } else if (error?.message?.includes('AI service not ready') ||
               error?.message?.includes('AI service not configured')) {
      errorMessage = getTranslation('ai_service_not_configured_message', currentUILanguage.code);
    } else {
      errorMessage = getTranslation('translation_service_unavailable', currentUILanguage.code) || 
                    'Translation service temporarily unavailable';
    }
    
    // 显示错误消息给用户
    if (!options.silent) messageManager.error(errorMessage);
    
    // 抛出错误以便调用者处理
    throw new Error(errorMessage);
  }
};

/**
 * 批量翻译接口
 * @param texts - 需要翻译的文本数组
 * @returns Promise<string[]> - 翻译结果数组
 */
export const translateTexts = async (texts: string[]): Promise<string[]> => {
  if (!texts || texts.length === 0) {
    return [];
  }

  const results: string[] = [];
  
  // 为避免API限制，逐个翻译
  for (const text of texts) {
    try {
      const translatedText = await translateText(text);
      results.push(translatedText);
    } catch (error) {
      console.error(`[translateTexts] Failed to translate text: ${text}`, error);
      results.push(`Translation failed: ${text}`);
    }
  }
  
  return results;
};

/**
 * 翻译单个单词（用于单词卡片）
 * @param word - 需要翻译的单词
 * @returns Promise<string> - 翻译结果
 */
export const translateWord = async (word: string, options: TranslateOptions = {}): Promise<string> => {
  if (!word || !word.trim()) {
    throw new Error('Word to translate cannot be empty');
  }

  // 清理单词，移除标点符号
  const cleanWord = word.replace(/[.,!?;:]$/, '').trim();
  
  try {
    const translatedText = await translateText(cleanWord, options);
    return translatedText;
  } catch (error) {
    console.error(`[translateWord] Failed to translate word: ${cleanWord}`, error);
    throw error;
  }
};

export default {
  translateText,
  translateTexts,
  translateWord
}; 