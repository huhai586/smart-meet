import { translate } from 'microsoft-translate-api';
import { getCurrentLanguage } from '../../hooks/useTranslationLanguage';
import messageManager from '../message-manager';
import { getTranslation } from '../i18n';
import { getCurrentUILanguage } from '../../hooks/useUILanguage';

// Microsoft翻译API支持的语言代码映射
const microsoftLangCodes = {
  af: "af",
  am: "am", 
  ar: "ar",
  as: "as",
  az: "az",
  ba: "ba",
  bg: "bg",
  bho: "bho",
  bn: "bn",
  bo: "bo",
  brx: "brx",
  bs: "bs",
  ca: "ca",
  cs: "cs",
  cy: "cy",
  da: "da",
  de: "de",
  doi: "doi",
  dsb: "dsb",
  dv: "dv",
  el: "el",
  en: "en",
  es: "es",
  et: "et",
  eu: "eu",
  fa: "fa",
  fi: "fi",
  fil: "fil",
  fj: "fj",
  fo: "fo",
  fr: "fr",
  "fr-CA": "fr-CA",
  ga: "ga",
  gl: "gl",
  gom: "gom",
  gu: "gu",
  ha: "ha",
  he: "he",
  hi: "hi",
  hne: "hne",
  hr: "hr",
  hsb: "hsb",
  ht: "ht",
  hu: "hu",
  hy: "hy",
  id: "id",
  ig: "ig",
  ikt: "ikt",
  is: "is",
  it: "it",
  iu: "iu",
  "iu-Latn": "iu-Latn",
  ja: "ja",
  ka: "ka",
  kk: "kk",
  km: "km",
  kmr: "kmr",
  kn: "kn",
  ko: "ko",
  ks: "ks",
  ku: "ku",
  ky: "ky",
  ln: "ln",
  lo: "lo",
  lt: "lt",
  lug: "lug",
  lv: "lv",
  lzh: "lzh",
  mai: "mai",
  mg: "mg",
  mi: "mi",
  mk: "mk",
  ml: "ml",
  "mn-Cyrl": "mn-Cyrl",
  "mn-Mong": "mn-Mong",
  mni: "mni",
  mr: "mr",
  ms: "ms",
  mt: "mt",
  mww: "mww",
  my: "my",
  nb: "nb",
  ne: "ne",
  nl: "nl",
  nso: "nso",
  nya: "nya",
  or: "or",
  otq: "otq",
  pa: "pa",
  pl: "pl",
  prs: "prs",
  ps: "ps",
  pt: "pt",
  "pt-PT": "pt-PT",
  ro: "ro",
  ru: "ru",
  run: "run",
  rw: "rw",
  sd: "sd",
  si: "si",
  sk: "sk",
  sl: "sl",
  sm: "sm",
  sn: "sn",
  so: "so",
  sq: "sq",
  "sr-Cyrl": "sr-Cyrl",
  "sr-Latn": "sr-Latn",
  st: "st",
  sv: "sv",
  sw: "sw",
  ta: "ta",
  te: "te",
  th: "th",
  ti: "ti",
  tk: "tk",
  "tlh-Latn": "tlh-Latn",
  "tlh-Piqd": "tlh-Piqd",
  tn: "tn",
  to: "to",
  tr: "tr",
  tt: "tt",
  ty: "ty",
  ug: "ug",
  uk: "uk",
  ur: "ur",
  uz: "uz",
  vi: "vi",
  xh: "xh",
  yo: "yo",
  yua: "yua",
  yue: "yue",
  "zh-Hans": "zh-Hans",
  "zh-Hant": "zh-Hant",
  zu: "zu"
};

// 语言代码映射函数
const mapToMicrosoftLangCode = (langCode: string): string => {
  // 特殊处理中文
  if (langCode === 'zh' || langCode === 'zh-CN') {
    return 'zh-Hans';
  }
  if (langCode === 'zh-TW' || langCode === 'zh-HK') {
    return 'zh-Hant';
  }
  
  // 检查是否在支持的语言列表中
  if (microsoftLangCodes[langCode as keyof typeof microsoftLangCodes]) {
    return langCode;
  }
  
  // 如果不支持，默认返回英语
  console.warn(`Language code ${langCode} not supported by Microsoft Translator, falling back to English`);
  return 'en';
};

/**
 * Microsoft翻译服务工具函数
 * @param text - 需要翻译的文本
 * @returns Promise<string> - 翻译结果
 */
export const translateByMicrosoft = async (text: string): Promise<string> => {
  console.log('Using Microsoft Translator for:', text);
  
  // 发送加载开始事件
  const loadingEvent = new CustomEvent('global-loading-event', { detail: { loading: true } });
  window.dispatchEvent(loadingEvent);
  
  try {
    // 获取目标语言
    const targetLanguage = await getCurrentLanguage();
    const originalLangCode = targetLanguage.code;
    
    // 映射到Microsoft支持的语言代码
    const targetLangCode = mapToMicrosoftLangCode(originalLangCode);
    
    console.log(`Original language code: ${originalLangCode}, Microsoft language code: ${targetLangCode}`);
    
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
    
    // 根据错误类型返回相应的错误消息
    if (error.message?.includes('rate limit') || error.message?.includes('quota') || 
        error.message?.includes('429') || error.name === 'TooManyRequestsError' || 
        error.code === 429) {
      // 获取当前UI语言并显示多语言错误提示
      const currentUILanguage = await getCurrentUILanguage();
      const errorMessage = getTranslation('google_translate_rate_limit_error', currentUILanguage.code);
      messageManager.error(errorMessage);
      throw new Error('Microsoft翻译请求过于频繁，请稍后再试');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('网络错误，请检查您的网络连接');
    } else if (error.message?.includes('unauthorized') || error.message?.includes('403')) {
      throw new Error('Microsoft翻译服务认证失败');
    } else {
      throw new Error('Microsoft翻译服务暂时不可用');
    }
  } finally {
    // 发送加载完成事件
    const finishEvent = new CustomEvent('global-loading-event', { detail: { loading: false } });
    window.dispatchEvent(finishEvent);
  }
}; 