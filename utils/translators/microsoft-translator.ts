import { translate } from 'microsoft-translate-api';
import { getCurrentLanguage } from '../../hooks/useTranslationLanguage';

/**
 * Microsoft翻译服务工具函数
 * @param text - 需要翻译的文本
 * @returns Promise<string> - 翻译结果
 */
export const translateByMicrosoft = async (text: string): Promise<string> => {
  console.log('Using Microsoft Translator for:', text);
  
  try {
    // 获取目标语言
    const targetLanguage = await getCurrentLanguage();
    const targetLangCode = targetLanguage.code;
    
    // 使用microsoft-translate-api进行翻译
    // translate(text, from, to) - from设为null表示自动检测
    const result = await translate(text, null, targetLangCode);
    console.warn(result);
    // 根据文档，返回格式是标准的，直接获取翻译结果
    const translatedText = result[0].translations[0].text;
    console.log('Microsoft translation successful:', translatedText);
    return translatedText;
    
  } catch (error) {
    console.error('Microsoft翻译错误:', error);
    
    // 根据错误类型返回不同的错误信息
    if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('网络错误，请检查您的网络连接');
    } else if (error.message?.includes('rate limit') || error.message?.includes('quota')) {
      throw new Error('Microsoft翻译服务配额已用完');
    } else if (error.message?.includes('unauthorized') || error.message?.includes('403')) {
      throw new Error('Microsoft翻译服务认证失败');
    } else {
      throw new Error('Microsoft翻译服务暂时不可用');
    }
  }
}; 