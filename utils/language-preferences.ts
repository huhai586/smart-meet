import { supportedLanguages, type Language } from './languages';

const LANGUAGE_ALIASES: Record<string, string> = {
  'zh-cn': 'zh',
  'zh-hans': 'zh',
  'zh-tw': 'zh',
  'zh-hant': 'zh',
  'pt-br': 'pt',
  'pt-pt': 'pt',
  'es-es': 'es',
  'es-mx': 'es',
  'fr-fr': 'fr',
  'fr-ca': 'fr',
  'de-de': 'de',
  'de-at': 'de',
  'it-it': 'it',
  'ru-ru': 'ru',
  'ja-jp': 'ja',
  'ko-kr': 'ko',
  'ar-sa': 'ar',
  'hi-in': 'hi',
  'th-th': 'th',
  'vi-vn': 'vi',
  'fa-ir': 'fa',
};

const TRANSLATION_LANGUAGE_BY_UI_LANGUAGE: Record<string, string> = {
  zh: 'zh',
  en: 'zh',
  ja: 'ja',
  ko: 'ko',
  es: 'es',
  fr: 'fr',
  de: 'de',
  ru: 'ru',
  pt: 'pt',
  it: 'it',
  ar: 'ar',
  hi: 'hi',
  th: 'th',
  vi: 'vi',
  fa: 'fa',
};

export function normalizeLanguageCode(languageCode: string): string {
  const normalized = languageCode.toLowerCase();
  return LANGUAGE_ALIASES[normalized] || normalized.split('-')[0];
}

export function findBestMatchLanguage(
  browserLanguage: string,
  acceptedLanguages: string[],
  languages: Language[] = supportedLanguages,
): Language {
  for (const languageCode of [browserLanguage, ...acceptedLanguages]) {
    const normalizedCode = normalizeLanguageCode(languageCode);
    const match = languages.find((language) => language.code === normalizedCode);
    if (match) return match;
  }

  return languages.find((language) => language.code === 'en') || languages[0];
}

export function getPreferredTranslationLanguage(uiLanguageCode: string): string {
  return TRANSLATION_LANGUAGE_BY_UI_LANGUAGE[uiLanguageCode] || 'zh';
}
