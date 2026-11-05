/**
 * Messages between the pages that show translations (side panel, Meet content scripts) and the
 * translation center in the background service worker, which owns provider choice, the meeting
 * language and the local model cache for every page at once.
 */

export const TranslationCenterAction = {
  /** Page → center: translate a text. */
  TRANSLATE: 'translation-center:translate',
  /** Meet content script → center: the caption language set in Meet (null when it can't be read). */
  MEET_LANGUAGE: 'translation-center:meet-language',
} as const;

export interface TranslateRequest {
  action: typeof TranslationCenterAction.TRANSLATE;
  text: string;
  /** The caption line `text` was cut from; language detection needs more than one word. */
  context?: string;
}

export interface MeetLanguageMessage {
  action: typeof TranslationCenterAction.MEET_LANGUAGE;
  language: string | null;
}

export const TranslateFailure = {
  /** The on-device model for the meeting language → target pair is not downloaded. */
  LOCAL_MODEL_MISSING: 'local_model_missing',
  FAILED: 'failed',
} as const;

export type TranslateResponse =
  | { ok: true; text: string }
  | { ok: false; reason: (typeof TranslateFailure)[keyof typeof TranslateFailure]; message: string };

/** How auto mode found the meeting language. */
export const MeetingLanguageSource = {
  /** Read from Google Meet's caption language setting. */
  MEET: 'meet',
  /** Concluded from the language detected in recent caption lines. */
  STATS: 'stats',
} as const;

/** What auto mode settled on in the latest meeting; shown next to the setting. */
export interface ResolvedMeetingLanguage {
  language: string;
  via: (typeof MeetingLanguageSource)[keyof typeof MeetingLanguageSource];
  /** STATS only: samples in `language` out of `total` in the window. */
  count?: number;
  total?: number;
}

/** chrome.storage.session key of the ResolvedMeetingLanguage; absent while nothing is resolved. */
export const RESOLVED_MEETING_LANGUAGE_KEY = 'resolvedMeetingLanguage';
