import { getCurrentLanguage } from '../../hooks/useTranslationLanguage';
import { getLocalTranslatorConfig } from '../../hooks/useTranslationProvider';

// Minimal ambient type declarations for Chrome's built-in Translator API
// (avoids requiring @types/dom-chromium-ai)
declare global {
  interface TranslatorAvailabilityOptions {
    sourceLanguage: string;
    targetLanguage: string;
  }

  interface TranslatorCreateOptions {
    sourceLanguage: string;
    targetLanguage: string;
    monitor?: (monitor: EventTarget) => void;
  }

  interface ChromeTranslator {
    translate(text: string): Promise<string>;
    translateStreaming(text: string): AsyncIterable<string>;
    destroy(): void;
  }

  interface TranslatorConstructor {
    availability(options: TranslatorAvailabilityOptions): Promise<string>;
    create(options: TranslatorCreateOptions): Promise<ChromeTranslator>;
  }

  const Translator: TranslatorConstructor;
}

// Cache translator instances per language pair to avoid unnecessary re-creation
const translatorCache = new Map<string, ChromeTranslator>();

const getCacheKey = (sourceLanguage: string, targetLanguage: string) =>
  `${sourceLanguage}→${targetLanguage}`;

/**
 * Get (or create) a cached Translator instance for the given language pair.
 * Re-creates if the languages have changed.
 */
export const getOrCreateTranslator = async (
  sourceLanguage: string,
  targetLanguage: string
): Promise<ChromeTranslator> => {
  const key = getCacheKey(sourceLanguage, targetLanguage);
  const cached = translatorCache.get(key);
  if (cached) return cached;

  const translator = await (Translator as TranslatorConstructor).create({
    sourceLanguage,
    targetLanguage,
  });

  translatorCache.set(key, translator);
  return translator;
};

/**
 * Destroy all cached translator instances (call when extension is being torn down).
 */
export const destroyAllTranslators = (): void => {
  for (const translator of translatorCache.values()) {
    translator.destroy();
  }
  translatorCache.clear();
};

/**
 * Check if Chrome's built-in Translator API is available in this environment.
 */
export const isLocalTranslatorSupported = (): boolean => {
  return typeof (globalThis as any).Translator !== 'undefined';
};

/**
 * Check the availability of a language pair.
 * Returns 'available' | 'downloadable' | 'unavailable'.
 */
export const checkTranslatorAvailability = async (
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> => {
  if (!isLocalTranslatorSupported()) return 'unavailable';
  return (Translator as TranslatorConstructor).availability({ sourceLanguage, targetLanguage });
};

/**
 * Local (Chrome built-in AI) translation service.
 * Matches the signature expected by useAutoTranslate.
 */
export const translateByLocal = async (text: string): Promise<string> => {
  if (!isLocalTranslatorSupported()) {
    throw new Error('Chrome AI Translator is not supported in this browser');
  }

  // Dispatch loading start event (consistent with other translators)
  window.dispatchEvent(new CustomEvent('global-loading-event', { detail: { loading: true } }));

  try {
    const [targetLanguage, config] = await Promise.all([
      getCurrentLanguage(),
      getLocalTranslatorConfig(),
    ]);

    const sourceLanguage = config.sourceLanguage || 'en';
    const targetCode = targetLanguage.code;

    const translator = await getOrCreateTranslator(sourceLanguage, targetCode);
    const result = await translator.translate(text);
    return result;
  } finally {
    window.dispatchEvent(new CustomEvent('global-loading-event', { detail: { loading: false } }));
  }
};

export default translateByLocal;
