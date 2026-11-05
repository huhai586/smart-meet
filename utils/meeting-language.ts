/**
 * The meeting language: what the captions are written in, i.e. the source language of every
 * translation. It is a setting (a language, or "auto"); in auto mode the translation center takes
 * it from Google Meet's own caption language setting, and when that can't be read, from statistics
 * over the language detected in recent caption lines.
 */

/** The setting value that asks the translation center to work the language out itself. */
export const MEETING_LANGUAGE_AUTO = 'auto';

/** Most meetings are in English, so a user who never chose gets English, not detection. */
export const DEFAULT_MEETING_LANGUAGE = 'en';

/** Thresholds of the auto-mode statistics. */
export const MeetingLanguageStats = {
  /** Only the most recent samples count, so the meeting can change language. */
  WINDOW: 30,
  /** Fewer samples than this decide nothing yet. */
  MIN_SAMPLES: 5,
  /** A language must hold this share of the window to become the meeting language. */
  DOMINANT_SHARE: 0.6,
  /** Detection below this confidence is not a sample. */
  MIN_CONFIDENCE: 0.8,
  /** Shorter lines are detected unreliably ("Mm-hmm" comes back as romanized Arabic). */
  MIN_CHARS: 20,
  /** CJK text says more per character. */
  MIN_CJK_CHARS: 6,
} as const;

export interface LanguageDetection {
  detectedLanguage: string;
  confidence: number;
}

/** One caption line whose language was detected with confidence. */
export interface LanguageSample {
  text: string;
  language: string;
}

const isTraditionalChinese = (code: string) => /hant|tw|hk|mo/i.test(code);

/**
 * A language code reduced to what translators take: the base language, except that Simplified and
 * Traditional Chinese stay apart ('zh' / 'zh-Hant').
 */
export const toTranslationLanguage = (code: string): string => {
  const lower = code.toLowerCase();
  const base = lower.split('-')[0];
  // Meet names Mandarin 'cmn' and Cantonese 'yue'; both are written in Chinese characters.
  if (base === 'zh' || base === 'cmn' || base === 'yue') {
    return base === 'yue' || isTraditionalChinese(lower) ? 'zh-Hant' : 'zh';
  }
  return base;
};

const CJK_CHAR = /[぀-ヿ㐀-鿿가-힯]/g;

/** The sample a detected caption line gives, or null when the detection is too weak to count. */
export const toSample = (text: string, detection: LanguageDetection | null | undefined): LanguageSample | null => {
  if (!detection) return null;
  const { detectedLanguage, confidence } = detection;
  if (!detectedLanguage || detectedLanguage === 'und') return null;
  // Romanized variants ('ar-Latn', 'hi-Latn') are what short English interjections get mistaken for.
  if (/-latn$/i.test(detectedLanguage)) return null;
  if (confidence < MeetingLanguageStats.MIN_CONFIDENCE) return null;
  const trimmed = text.trim();
  const cjkChars = trimmed.match(CJK_CHAR)?.length ?? 0;
  if (trimmed.length < MeetingLanguageStats.MIN_CHARS && cjkChars < MeetingLanguageStats.MIN_CJK_CHARS) return null;
  return { text: trimmed, language: toTranslationLanguage(detectedLanguage) };
};

/**
 * The window with `sample` added. A caption line grows as people speak and is translated at every
 * step, so a sample that extends the previous one replaces it instead of counting again.
 */
export const addSample = (samples: LanguageSample[], sample: LanguageSample): LanguageSample[] => {
  const last = samples[samples.length - 1];
  const rest = last && sample.text.startsWith(last.text) ? samples.slice(0, -1) : samples;
  return [...rest, sample].slice(-MeetingLanguageStats.WINDOW);
};

/**
 * The meeting language the window points to. A language takes over only when it holds the required
 * share of enough samples; until then the `current` one stays, so stray detections never flip it.
 */
export const dominantLanguage = (samples: LanguageSample[], current: string | null = null): string | null => {
  if (samples.length < MeetingLanguageStats.MIN_SAMPLES) return current;
  const counts = new Map<string, number>();
  for (const { language } of samples) counts.set(language, (counts.get(language) ?? 0) + 1);
  const [top, topCount] = [...counts].sort((a, b) => b[1] - a[1])[0];
  return topCount / samples.length >= MeetingLanguageStats.DOMINANT_SHARE ? top : current;
};

/** How many samples in the window are in `language`; shown next to the detected language. */
export const countSamples = (samples: LanguageSample[], language: string): number =>
  samples.filter((sample) => sample.language === language).length;

/** Meet serves meetings as /abc-defg-hij and /meet/abc-defg-hij. */
const MEETING_PATH = /^\/(?:meet\/)?([a-z0-9]+-[a-z0-9]+-[a-z0-9]+)\/?$/i;

/** The meeting code in a Meet URL, or null for any other page. */
export const meetingCodeFromUrl = (url: string | undefined): string | null => {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.hostname !== 'meet.google.com') return null;
    return parsed.pathname.match(MEETING_PATH)?.[1].toLowerCase() ?? null;
  } catch {
    return null;
  }
};
