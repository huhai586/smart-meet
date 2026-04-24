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

export const translateByDeepL = async (text: string): Promise<string> => {
  const loadingEvent = new CustomEvent('global-loading-event', { detail: { loading: true } });
  window.dispatchEvent(loadingEvent);

  try {
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
  } finally {
    const finishEvent = new CustomEvent('global-loading-event', { detail: { loading: false } });
    window.dispatchEvent(finishEvent);
  }
};
