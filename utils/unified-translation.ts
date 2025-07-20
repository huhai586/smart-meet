import { getCurrentTranslationProvider } from '../hooks/useTranslationProvider';
import { translateByGoogle, translateByMicrosoft, translateByAI } from './translators';
import { getCurrentUILanguage } from '../hooks/useUILanguage';
import { getTranslation } from './i18n';
import messageManager from './message-manager';

/**
 * 统一的自动翻译接口
 * 内部处理使用Google、微软或AI服务的选择逻辑
 * @param text - 需要翻译的文本
 * @returns Promise<string> - 翻译结果
 */
export const translateText = async (text: string): Promise<string> => {
  if (!text || !text.trim()) {
    throw new Error('Text to translate cannot be empty');
  }

  try {
    // 获取当前选择的翻译服务提供商
    const provider = await getCurrentTranslationProvider();
    console.log(`[translateText] Using translation provider: ${provider}`);
    
    let translatedText: string;
    
    // 根据不同的提供商调用相应的翻译函数
    switch (provider) {
      case 'google':
        console.log('[translateText] Using Google Translate');
        translatedText = await translateByGoogle(text);
        break;
      case 'microsoft':
        console.log('[translateText] Using Microsoft Translator');
        translatedText = await translateByMicrosoft(text);
        break;
      case 'ai':
      default:
        console.log('[translateText] Using AI Translation');
        translatedText = await translateByAI(text);
        break;
    }
    
    console.log(`[translateText] Translation completed with ${provider}: ${translatedText.substring(0, 100)}...`);
    return translatedText;
    
  } catch (error) {
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
    messageManager.error(errorMessage);
    
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
export const translateWord = async (word: string): Promise<string> => {
  if (!word || !word.trim()) {
    throw new Error('Word to translate cannot be empty');
  }

  // 清理单词，移除标点符号
  const cleanWord = word.replace(/[.,!?;:]$/, '').trim();
  
  try {
    const translatedText = await translateText(cleanWord);
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