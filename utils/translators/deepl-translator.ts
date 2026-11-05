import { getCurrentLanguage } from '../../hooks/useTranslationLanguage';
import { getDeepLAuthKey } from '../../hooks/useTranslationProvider';

// DeepL target language code mapping
// See: https://developers.deepl.com/docs/resources/supported-languages
const DEEPL_LANG_MAP: Record<string, string> = {
  zh: 'ZH-HANS',
  'zh-CN': 'ZH-HANS',
  'zh-TW': 'ZH-HANT',
  en: 'EN-US',
  pt: 'PT-BR',
  'pt-BR': 'PT-BR',
  'pt-PT': 'PT-PT',
};

const mapToDeepLCode = (langCode: string): string => {
  if (DEEPL_LANG_MAP[langCode]) {
    return DEEPL_LANG_MAP[langCode];
  }
  return langCode.toUpperCase();
};

/** DeepL takes source languages without a region or script ('EN', 'ZH', 'PT'). */
const toDeepLSourceCode = (langCode: string): string => langCode.split('-')[0].toUpperCase();

/**
 * Runs in the background translation center, so it shows nothing itself.
 * @param sourceLanguage - the meeting language; omitted, DeepL detects it
 */
export const translateByDeepL = async (text: string, sourceLanguage?: string): Promise<string> => {
  const authKey = await getDeepLAuthKey();
  if (!authKey) {
    throw new Error('DeepL auth key not configured');
  }

  const targetLanguage = await getCurrentLanguage();
  const targetLangCode = mapToDeepLCode(targetLanguage.code);

  // Free accounts use api-free.deepl.com; keys end with ':fx'
  const isFree = authKey.endsWith(':fx');
  const baseUrl = isFree
    ? 'https://api-free.deepl.com/v2/translate'
    : 'https://api.deepl.com/v2/translate';

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${authKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: [text],
      target_lang: targetLangCode,
      ...(sourceLanguage ? { source_lang: toDeepLSourceCode(sourceLanguage) } : {}),
    }),
  });

  if (!response.ok) {
    if (response.status === 403) {
      throw new Error('DeepL auth key is invalid or unauthorized');
    } else if (response.status === 429) {
      throw new Error('DeepL rate limit exceeded, please try again later');
    } else if (response.status === 456) {
      throw new Error('DeepL translation quota exceeded');
    }
    throw new Error(`DeepL API error: ${response.status}`);
  }

  const data = await response.json();
  const translatedText: string = data.translations[0].text;
  return translatedText;
};
