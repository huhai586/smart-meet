import { translate } from 'microsoft-translate-api';
import { getCurrentLanguage } from '../../hooks/useTranslationLanguage';

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

/** Microsoft's code for a source language, or null (auto-detect) when it doesn't know the language. */
const toMicrosoftSourceCode = (langCode: string | undefined): string | null => {
  if (!langCode) return null;
  const code = mapToMicrosoftLangCode(langCode);
  return code === 'en' && !langCode.toLowerCase().startsWith('en') ? null : code;
};

/**
 * Microsoft翻译服务工具函数. Runs in the background translation center, so it shows nothing itself.
 * @param sourceLanguage - the meeting language; omitted, Microsoft detects it
 */
export const translateByMicrosoft = async (text: string, sourceLanguage?: string): Promise<string> => {
  const targetLanguage = await getCurrentLanguage();
  const targetLangCode = mapToMicrosoftLangCode(targetLanguage.code);
  try {
    const result = await translate(text, toMicrosoftSourceCode(sourceLanguage), targetLangCode);
    return result[0].translations[0].text;
  } catch (error) {
    console.error('Microsoft翻译错误:', error);
    if (error.message?.includes('rate limit') || error.message?.includes('quota') ||
        error.message?.includes('429') || error.name === 'TooManyRequestsError' ||
        error.code === 429) {
      throw new Error('Microsoft翻译请求过于频繁，请稍后再试');
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      throw new Error('网络错误，请检查您的网络连接');
    } else if (error.message?.includes('unauthorized') || error.message?.includes('403')) {
      throw new Error('Microsoft翻译服务认证失败');
    }
    throw new Error('Microsoft翻译服务暂时不可用');
  }
};
