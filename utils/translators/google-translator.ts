import { translate } from '@vitalets/google-translate-api';
import { getCurrentLanguage } from '../../hooks/useTranslationLanguage';

/**
 * Google翻译服务工具函数
 * @param text - 需要翻译的文本
 * @returns Promise<string> - 翻译结果
 */
export const translateByGoogle = async (text: string): Promise<string> => {
  console.log('Using Google Translate for:', text);
  
  try {
    // 获取目标语言
    const targetLanguage = await getCurrentLanguage();
    const targetLangCode = targetLanguage.code;
    
    // 使用@vitalets/google-translate-api进行翻译
    // translate(text, { from: 'auto', to: targetLangCode })
    const result = await translate(text, { 
      from: 'auto', // 自动检测源语言
      to: targetLangCode 
    });
    
    // 根据文档，返回结果包含text字段
    const translatedText = result.text;
    console.log('Google translation successful:', translatedText);
    return translatedText;
    
  } catch (error) {
    console.error('Google翻译错误:', error);
    
    // 根据错误类型返回相应的错误消息
    if (error.name === 'TooManyRequestsError') {
      throw new Error('Google翻译请求过于频繁，请稍后再试');
    } else if (error.code === 429) {
      throw new Error('Google翻译服务暂时不可用，请稍后再试');
    } else {
      throw new Error('Google翻译服务出现问题，请稍后再试');
    }
  }
}; 