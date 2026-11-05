import { useEffect, useState } from 'react';
import { getConfigValue, onConfigChanged, setConfigValue } from '~/utils/appConfig';
import { DEFAULT_MEETING_LANGUAGE, MEETING_LANGUAGE_AUTO } from '~/utils/meeting-language';
import { RESOLVED_MEETING_LANGUAGE_KEY, type ResolvedMeetingLanguage } from '~/utils/translation-center';
import { supportedLanguages } from '~/utils/languages';

/** The meeting language setting: a language code, or MEETING_LANGUAGE_AUTO. */
export const useMeetingLanguage = (): [string, (value: string) => void] => {
  const [value, setValue] = useState<string>(DEFAULT_MEETING_LANGUAGE);

  useEffect(() => {
    getConfigValue('meetingLanguage').then(setValue);
    return onConfigChanged((changes) => {
      if (changes.meetingLanguage) setValue((changes.meetingLanguage as { value: string }).value);
    });
  }, []);

  const update = (next: string) => {
    setValue(next);
    setConfigValue('meetingLanguage', next);
  };

  return [value, update];
};

/** What auto mode settled on in the latest meeting (kept by the background translation center). */
export const useResolvedMeetingLanguage = (): ResolvedMeetingLanguage | null => {
  const [resolved, setResolved] = useState<ResolvedMeetingLanguage | null>(null);

  useEffect(() => {
    chrome.storage.session.get(RESOLVED_MEETING_LANGUAGE_KEY).then((stored) => {
      setResolved((stored[RESOLVED_MEETING_LANGUAGE_KEY] as ResolvedMeetingLanguage | undefined) ?? null);
    });
    const onChanged = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== 'session' || !(RESOLVED_MEETING_LANGUAGE_KEY in changes)) return;
      setResolved((changes[RESOLVED_MEETING_LANGUAGE_KEY].newValue as ResolvedMeetingLanguage | undefined) ?? null);
    };
    chrome.storage.onChanged.addListener(onChanged);
    return () => chrome.storage.onChanged.removeListener(onChanged);
  }, []);

  return resolved;
};

/** A language's own name ('English', '中文'); codes outside the list stay as they are. */
export const languageNativeName = (code: string): string =>
  supportedLanguages.find((language) => language.code === code)?.nativeName ?? code;

/** The language translations currently come from: the setting, or what auto mode resolved. */
export const effectiveMeetingLanguage = (setting: string, resolved: ResolvedMeetingLanguage | null): string =>
  setting === MEETING_LANGUAGE_AUTO ? resolved?.language ?? DEFAULT_MEETING_LANGUAGE : setting;
