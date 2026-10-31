import { getCurrentLanguage } from '../../hooks/useTranslationLanguage';
import { getLocalTranslatorConfig } from '../../hooks/useTranslationProvider';
import { isSameLanguage } from '../language-code';
import { isLocalModelMissing, promptLocalModelDownload } from '../local-model-prompt';

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

/** Below this, the detector is guessing (short captions) and the configured source language is safer. */
const MIN_DETECTION_CONFIDENCE = 0.6;

let languageDetector: ChromeLanguageDetector | null = null;

/**
 * The language `text` is written in, via Chrome's built-in detector. People rarely speak in their UI
 * language, so a fixed source language fails whenever the meeting language differs. Falls back to
 * `fallback` when the detector is missing, not downloaded, or not confident.
 */
export const detectSourceLanguage = async (text: string, fallback: string): Promise<string> => {
  try {
    if (!languageDetector) {
      const Detector = (globalThis as any).LanguageDetector as LanguageDetectorConstructor | undefined;
      if (!Detector || (await Detector.availability()) !== 'available') return fallback;
      languageDetector = await Detector.create();
    }
    const [best] = await languageDetector.detect(text);
    const isConfident = best && best.detectedLanguage !== 'und' && best.confidence >= MIN_DETECTION_CONFIDENCE;
    return isConfident ? best.detectedLanguage : fallback;
  } catch {
    return fallback;
  }
};

/**
 * Local (Chrome built-in AI) translation service.
 * Matches the signature expected by useAutoTranslate.
 */
/** `context`: the text to detect the language from when `text` is just a word cut out of it. */
export const translateByLocal = async (text: string, context: string = text): Promise<string> => {
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

    const targetCode = targetLanguage.code;
    const sourceLanguage = await detectSourceLanguage(context, config.sourceLanguage || 'en');
    // Already in the target language: nothing to translate (and Chrome has no same-language model).
    if (isSameLanguage(sourceLanguage, targetCode)) return text;

    // Creating a translator for a missing model needs a user gesture and would only fail, so ask the
    // user to download it in settings instead.
    if (isLocalModelMissing(await checkTranslatorAvailability(sourceLanguage, targetCode))) {
      throw await promptLocalModelDownload();
    }

    const translator = await getOrCreateTranslator(sourceLanguage, targetCode);
    const result = await translator.translate(text);
    return result;
  } finally {
    window.dispatchEvent(new CustomEvent('global-loading-event', { detail: { loading: false } }));
  }
};

export default translateByLocal;
