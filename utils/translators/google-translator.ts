import { translate } from '@vitalets/google-translate-api';
import { getCurrentLanguage } from '../../hooks/useTranslationLanguage';

/**
 * Google翻译服务工具函数. Runs in the background translation center, so it shows nothing itself:
 * the page that asked turns the thrown error into a message.
 */
export const translateByGoogle = async (text: string): Promise<string> => {
  const targetLanguage = await getCurrentLanguage();
  try {
    // Google detects the source language better than we can tell it, so it always gets 'auto'.
    const result = await translate(text, { from: 'auto', to: targetLanguage.code });
    return result.text;
  } catch (error) {
    console.error('Google翻译错误:', error);
    if (error.name === 'TooManyRequestsError' || error.code === 429) {
      throw new Error('Google翻译请求过于频繁，请稍后再试');
    }
    throw new Error('Google翻译服务出现问题，请稍后再试');
  }
};
