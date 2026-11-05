import type { LanguageDetection } from '../meeting-language';

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

  interface ChromeLanguageDetector {
    detect(text: string): Promise<{ detectedLanguage: string; confidence: number }[]>;
  }

  interface LanguageDetectorConstructor {
    availability(): Promise<string>;
    create(): Promise<ChromeLanguageDetector>;
  }

  const LanguageDetector: LanguageDetectorConstructor | undefined;
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

/** Chrome reports these while the on-device model for a language pair is not on the machine yet. */
const MODEL_MISSING_STATES = new Set(['downloadable', 'downloading']);

export const isLocalModelMissing = (availability: string): boolean => MODEL_MISSING_STATES.has(availability);

let languageDetector: ChromeLanguageDetector | null = null;

/**
 * The language `text` is most likely written in, from Chrome's built-in detector, or null when the
 * detector is missing or not downloaded. How much to trust it is the caller's call (see
 * utils/meeting-language).
 */
export const detectLanguage = async (text: string): Promise<LanguageDetection | null> => {
  try {
    if (!languageDetector) {
      const Detector = (globalThis as any).LanguageDetector as LanguageDetectorConstructor | undefined;
      if (!Detector || (await Detector.availability()) !== 'available') return null;
      languageDetector = await Detector.create();
    }
    const [best] = await languageDetector.detect(text);
    return best ?? null;
  } catch {
    return null;
  }
};

/**
 * Translates with Chrome's built-in AI. The caller has checked that the model for the pair is on the
 * machine: creating a translator for a missing one needs a user gesture and would only fail.
 */
export const translateLocally = async (
  text: string,
  sourceLanguage: string,
  targetLanguage: string,
): Promise<string> => {
  if (!isLocalTranslatorSupported()) {
    throw new Error('Chrome AI Translator is not supported in this browser');
  }
  const translator = await getOrCreateTranslator(sourceLanguage, targetLanguage);
  return translator.translate(text);
};
