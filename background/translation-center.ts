/**
 * The translation center: every translation in the extension runs here, so the provider choice, the
 * meeting language and the local translator cache are one state for the side panel and the Meet tab
 * alike. Only AI translation stays in the pages, since it needs the AI service they set up.
 *
 * The source language is the meeting language setting. In auto mode it is, in order: the caption
 * language Meet reports, else the language most recent caption lines are detected in (see
 * utils/meeting-language), else, before enough lines came in, the line's own confident detection or
 * the previous meeting's language.
 */
import { getConfigValue, onConfigChanged } from '~utils/appConfig';
import { getCurrentLanguage } from '~hooks/useTranslationLanguage';
import { getCurrentTranslationProvider, type TranslationProvider } from '~hooks/useTranslationProvider';
import { isSameLanguage } from '~utils/language-code';
import {
  DEFAULT_MEETING_LANGUAGE,
  MEETING_LANGUAGE_AUTO,
  addSample,
  dominantLanguage,
  meetingCodeFromUrl,
  toSample,
  toTranslationLanguage,
  type LanguageSample,
} from '~utils/meeting-language';
import {
  MeetingLanguageSource,
  RESOLVED_MEETING_LANGUAGE_KEY,
  TranslateFailure,
  TranslationCenterAction,
  type MeetLanguageMessage,
  type ResolvedMeetingLanguage,
  type TranslateRequest,
  type TranslateResponse,
} from '~utils/translation-center';
import { translateByGoogle } from '~utils/translators/google-translator';
import { translateByMicrosoft } from '~utils/translators/microsoft-translator';
import { translateByDeepL } from '~utils/translators/deepl-translator';
import {
  checkTranslatorAvailability,
  detectLanguage,
  isLocalModelMissing,
  translateLocally,
} from '~utils/translators/local-translator';

/** chrome.storage.session: per-meeting state, so it survives the service worker being stopped. */
const MEETING_STATE_KEY = 'meetingLanguageState';
/** chrome.storage.local: the language the last meeting settled on, the best guess for the next one. */
const LAST_MEETING_LANGUAGE_KEY = 'lastMeetingLanguage';

interface MeetingState {
  /** The Meet tab of the meeting, to forget it when the tab closes. */
  tabId?: number;
  /** The caption language Meet reports, as a translation language. */
  meetLanguage?: string;
  samples: LanguageSample[];
  /** What the samples settled on. */
  current: string | null;
}

type MeetingStates = Record<string, MeetingState>;

interface MeetingRef {
  code: string;
  tabId?: number;
}

let meetingStates: Promise<MeetingStates> | undefined;

const loadMeetingStates = (): Promise<MeetingStates> =>
  (meetingStates ??= chrome.storage.session
    .get(MEETING_STATE_KEY)
    .then((stored) => (stored[MEETING_STATE_KEY] as MeetingStates | undefined) ?? {}));

const saveMeetingStates = async (): Promise<void> => {
  await chrome.storage.session.set({ [MEETING_STATE_KEY]: await loadMeetingStates() });
};

const meetingState = async (meeting: MeetingRef): Promise<MeetingState> => {
  const states = await loadMeetingStates();
  const state = (states[meeting.code] ??= { samples: [], current: null });
  if (meeting.tabId !== undefined) state.tabId = meeting.tabId;
  return state;
};

const publishResolved = (resolved: ResolvedMeetingLanguage): Promise<void> =>
  chrome.storage.session.set({ [RESOLVED_MEETING_LANGUAGE_KEY]: resolved });

/** The meeting a request is about: the sender's own Meet tab, else (side panel) the Meet tab in view. */
const findMeeting = async (sender: chrome.runtime.MessageSender): Promise<MeetingRef | null> => {
  const ownCode = meetingCodeFromUrl(sender.tab?.url);
  if (ownCode) return { code: ownCode, tabId: sender.tab?.id };

  const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  const activeCode = meetingCodeFromUrl(activeTab?.url);
  if (activeCode) return { code: activeCode, tabId: activeTab.id };

  const meetTabs = (await chrome.tabs.query({ url: 'https://meet.google.com/*' }))
    .filter((tab) => meetingCodeFromUrl(tab.url));
  if (meetTabs.length !== 1) return null;
  return { code: meetingCodeFromUrl(meetTabs[0].url) as string, tabId: meetTabs[0].id };
};

/** Adds the line to the meeting's statistics; returns the meeting language they now point to. */
const learnFromLine = async (state: MeetingState, sample: LanguageSample): Promise<string | null> => {
  state.samples = addSample(state.samples, sample);
  state.current = dominantLanguage(state.samples, state.current);
  await saveMeetingStates();
  if (state.current) {
    await publishResolved({ language: state.current, via: MeetingLanguageSource.STATS });
    await chrome.storage.local.set({ [LAST_MEETING_LANGUAGE_KEY]: state.current });
  }
  return state.current;
};

/** The language `text` is in, or undefined to let the provider detect it. */
const resolveSourceLanguage = async (
  request: TranslateRequest,
  provider: TranslationProvider,
  targetLanguage: string,
  sender: chrome.runtime.MessageSender,
): Promise<string | undefined> => {
  const setting = await getConfigValue('meetingLanguage');
  if (setting !== MEETING_LANGUAGE_AUTO) return setting;

  const meeting = await findMeeting(sender);
  const state = meeting ? await meetingState(meeting) : null;
  if (state?.meetLanguage) return state.meetLanguage;

  const line = request.context ?? request.text;
  const sample = toSample(line, await detectLanguage(line));
  const learned = state && sample ? await learnFromLine(state, sample) : state?.current;
  if (learned) return learned;

  // Too early to tell: trust a confident detection of this line if it can be translated...
  const canTranslateSample = sample && (provider !== 'local'
    || (await checkTranslatorAvailability(sample.language, targetLanguage)) === 'available');
  if (canTranslateSample) return sample.language;

  // ...else assume the language of the last meeting.
  const stored = await chrome.storage.local.get(LAST_MEETING_LANGUAGE_KEY);
  const last = stored[LAST_MEETING_LANGUAGE_KEY] as string | undefined;
  return last ?? (provider === 'local' ? DEFAULT_MEETING_LANGUAGE : undefined);
};

const translate = async (
  request: TranslateRequest,
  sender: chrome.runtime.MessageSender,
): Promise<TranslateResponse> => {
  try {
    const [provider, target] = await Promise.all([getCurrentTranslationProvider(), getCurrentLanguage()]);
    const source = await resolveSourceLanguage(request, provider, target.code, sender);
    // Already in the target language: nothing to translate (and Chrome has no same-language model).
    if (source && isSameLanguage(source, target.code)) return { ok: true, text: request.text };

    switch (provider) {
      case 'google':
        return { ok: true, text: await translateByGoogle(request.text) };
      case 'microsoft':
        return { ok: true, text: await translateByMicrosoft(request.text, source) };
      case 'deepl':
        return { ok: true, text: await translateByDeepL(request.text, source) };
      case 'local': {
        const from = source ?? DEFAULT_MEETING_LANGUAGE;
        if (isLocalModelMissing(await checkTranslatorAvailability(from, target.code))) {
          return { ok: false, reason: TranslateFailure.LOCAL_MODEL_MISSING, message: `${from} → ${target.code}` };
        }
        return { ok: true, text: await translateLocally(request.text, from, target.code) };
      }
      default:
        return { ok: false, reason: TranslateFailure.FAILED, message: `${provider} translation runs in the page` };
    }
  } catch (error) {
    console.error('[translation-center] Translation failed:', error);
    return { ok: false, reason: TranslateFailure.FAILED, message: (error as Error)?.message ?? String(error) };
  }
};

const setMeetLanguage = async (message: MeetLanguageMessage, sender: chrome.runtime.MessageSender) => {
  const code = meetingCodeFromUrl(sender.tab?.url);
  if (!code) return;
  const state = await meetingState({ code, tabId: sender.tab?.id });
  const language = message.language ? toTranslationLanguage(message.language) : undefined;
  if (state.meetLanguage === language) return;
  state.meetLanguage = language;
  await saveMeetingStates();
  if (language) await publishResolved({ language, via: MeetingLanguageSource.MEET });
};

/** A closed Meet tab ends its meeting. */
const forgetTab = async (tabId: number) => {
  const states = await loadMeetingStates();
  const codes = Object.keys(states).filter((code) => states[code].tabId === tabId);
  if (codes.length === 0) return;
  for (const code of codes) delete states[code];
  await saveMeetingStates();
};

/** A new meeting language setting starts every meeting over. */
const forgetAll = async () => {
  const states = await loadMeetingStates();
  for (const code of Object.keys(states)) delete states[code];
  await saveMeetingStates();
  await chrome.storage.session.remove(RESOLVED_MEETING_LANGUAGE_KEY);
};

export function initTranslationCenter() {
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message?.action === TranslationCenterAction.TRANSLATE) {
      translate(message as TranslateRequest, sender).then(sendResponse);
      return true; // keeps the channel open for the async response
    }
    if (message?.action === TranslationCenterAction.MEET_LANGUAGE) {
      setMeetLanguage(message as MeetLanguageMessage, sender);
    }
    return false;
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    forgetTab(tabId);
  });

  onConfigChanged((changes) => {
    if (changes.meetingLanguage) forgetAll();
  });
}
