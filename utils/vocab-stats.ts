import type { LookupRecord, VocabEntry } from './vocab-core';

/** A word looked up this many times or more counts as one that keeps coming back. */
export const FREQUENT_THRESHOLD = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export type FrequencyFilter = 'all' | 'frequent' | 'once';
export type SortKey = 'count' | 'recent' | 'alpha';

export interface VocabFilters {
  query: string;
  frequency: FrequencyFilter;
  /** Only words looked up in this meeting; empty for any. */
  meeting: string;
  /** Only words looked up at or after this time; 0 for any. */
  since: number;
}

export const NO_FILTERS: VocabFilters = { query: '', frequency: 'all', meeting: '', since: 0 };

export interface VocabSummary {
  words: number;
  lookups: number;
  /** Words first looked up in the last seven days. */
  newThisWeek: number;
  frequentWords: number;
}

export const summarize = (entries: VocabEntry[], now: number): VocabSummary => ({
  words: entries.length,
  lookups: entries.reduce((total, entry) => total + entry.count, 0),
  newThisWeek: entries.filter((entry) => entry.firstSeenAt >= now - 7 * DAY_MS).length,
  frequentWords: entries.filter((entry) => entry.count >= FREQUENT_THRESHOLD).length,
});

/** The distinct meetings a word was looked up in. */
export const meetingsOf = (entry: VocabEntry): string[] => [
  ...new Set(entry.occurrences.map((occurrence) => occurrence.meetingName).filter(Boolean)),
];

/** Every meeting that has a lookup in it, most recently used first. */
export const allMeetings = (entries: VocabEntry[]): string[] => {
  const lastUsed = new Map<string, number>();
  for (const { occurrences } of entries) {
    for (const { meetingName, at } of occurrences) {
      if (meetingName) lastUsed.set(meetingName, Math.max(at, lastUsed.get(meetingName) ?? 0));
    }
  }
  return [...lastUsed.keys()].sort((a, b) => lastUsed.get(b)! - lastUsed.get(a)! || a.localeCompare(b));
};

export const filterEntries = (entries: VocabEntry[], filters: VocabFilters): VocabEntry[] => {
  const query = filters.query.trim().toLowerCase();
  return entries.filter((entry) => {
    if (filters.frequency === 'frequent' && entry.count < FREQUENT_THRESHOLD) return false;
    if (filters.frequency === 'once' && entry.count !== 1) return false;
    if (filters.meeting && !entry.occurrences.some((o) => o.meetingName === filters.meeting)) return false;
    if (filters.since && entry.lastSeenAt < filters.since) return false;
    if (!query) return true;
    return [entry.word, entry.translation, ...entry.forms, ...entry.occurrences.map((o) => o.sentence)]
      .some((text) => text.toLowerCase().includes(query));
  });
};

export const sortEntries = (entries: VocabEntry[], key: SortKey): VocabEntry[] =>
  [...entries].sort((a, b) => {
    if (key === 'alpha') return a.word.localeCompare(b.word);
    if (key === 'recent') return b.lastSeenAt - a.lastSeenAt || b.count - a.count;
    return b.count - a.count || b.lastSeenAt - a.lastSeenAt;
  });

const pad = (value: number) => String(value).padStart(2, '0');

/** The local calendar day of a time, as YYYY-MM-DD. */
export const dayKey = (time: number): string => {
  const date = new Date(time);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export interface MeetingDayGroup {
  /** Empty when the lookups came without a meeting name. */
  meeting: string;
  day: string;
  items: { entry: VocabEntry; occurrence: LookupRecord }[];
}

/** Lookups grouped by the meeting and the day they were made, newest day first. */
export const groupByMeetingDay = (entries: VocabEntry[]): MeetingDayGroup[] => {
  const groups = new Map<string, MeetingDayGroup>();
  for (const entry of entries) {
    for (const occurrence of entry.occurrences) {
      const day = dayKey(occurrence.at);
      const id = `${day}\u0000${occurrence.meetingName}`;
      const group = groups.get(id) ?? { meeting: occurrence.meetingName, day, items: [] };
      group.items.push({ entry, occurrence });
      groups.set(id, group);
    }
  }
  return [...groups.values()]
    .map((group) => ({ ...group, items: group.items.sort((a, b) => a.occurrence.at - b.occurrence.at) }))
    .sort(
      (a, b) =>
        b.day.localeCompare(a.day) ||
        b.items[b.items.length - 1].occurrence.at - a.items[a.items.length - 1].occurrence.at ||
        a.meeting.localeCompare(b.meeting),
    );
};
