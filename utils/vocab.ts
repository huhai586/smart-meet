import { getTranslatedWords } from './translate';
import {
  appendLookup,
  findEntry,
  groupLookups,
  recordsFromLegacyEntries,
  recordsFromLegacyWords,
  removeWordRecords,
  type LegacyVocabEntry,
  type LookupInput,
  type LookupRecord,
  type VocabEntry,
} from './vocab-core';

/**
 * Vocabulary is the log of every lookup, in chrome.storage.local, not in appConfig: appConfig is a single
 * chrome.storage.sync item (about 8 KB), which a sentence per lookup would overflow.
 */
export const VOCAB_STORAGE_KEY = 'vocabLookups';
/** Where the words were kept before the log: one entry per word with a count. */
const LEGACY_ENTRIES_KEY = 'vocabEntries';
const LEGACY_ENTRIES_CONVERTED_KEY = 'vocabEntriesConvertedToLookups';
const LEGACY_WORDS_MIGRATED_KEY = 'vocabMigratedFromTranslatedWords';

// Lookups can land in quick succession; one write at a time keeps the read-modify-write from losing any.
let writeQueue: Promise<unknown> = Promise.resolve();
const serialized = <T>(task: () => Promise<T>): Promise<T> => {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => undefined);
  return run;
};

const newLookupId = () => (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const readRecords = async (): Promise<LookupRecord[]> => {
  const stored = await chrome.storage.local.get(VOCAB_STORAGE_KEY);
  return Array.isArray(stored[VOCAB_STORAGE_KEY]) ? stored[VOCAB_STORAGE_KEY] : [];
};

const writeRecords = (records: LookupRecord[]) => chrome.storage.local.set({ [VOCAB_STORAGE_KEY]: records });

/** Adds the converted lines that are not in the log yet (ids tell). */
const mergeRecords = (records: LookupRecord[], incoming: LookupRecord[]): LookupRecord[] => {
  const known = new Set(records.map((record) => record.id));
  return [...records, ...incoming.filter((record) => !known.has(record.id))];
};

/** Brings every older way of keeping the words into the log, once each. */
const migrateLegacy = async (): Promise<void> => {
  const flags = await chrome.storage.local.get([LEGACY_ENTRIES_CONVERTED_KEY, LEGACY_WORDS_MIGRATED_KEY, LEGACY_ENTRIES_KEY]);
  let records = await readRecords();
  let changed = false;

  // Words saved as plain strings, before entries existed
  if (!flags[LEGACY_WORDS_MIGRATED_KEY]) {
    records = mergeRecords(records, recordsFromLegacyWords(await getTranslatedWords(), Date.now()));
    await chrome.storage.local.set({ [LEGACY_WORDS_MIGRATED_KEY]: true });
    changed = true;
  }

  // Entries with a count, kept before the log
  if (!flags[LEGACY_ENTRIES_CONVERTED_KEY]) {
    const entries: LegacyVocabEntry[] = Array.isArray(flags[LEGACY_ENTRIES_KEY]) ? flags[LEGACY_ENTRIES_KEY] : [];
    records = mergeRecords(records, recordsFromLegacyEntries(entries));
    await chrome.storage.local.remove(LEGACY_ENTRIES_KEY);
    await chrome.storage.local.set({ [LEGACY_ENTRIES_CONVERTED_KEY]: true });
    changed = true;
  }

  if (changed) await writeRecords(records);
};

export const getVocabRecords = (): Promise<LookupRecord[]> =>
  serialized(async () => {
    await migrateLegacy();
    return readRecords();
  });

/** The words, worked out from the log. */
export const getVocab = async (): Promise<VocabEntry[]> => groupLookups(await getVocabRecords());

/** Records one lookup and returns the word as it now stands (so the caller can show the count). */
export const recordLookup = (input: LookupInput): Promise<VocabEntry | undefined> =>
  serialized(async () => {
    await migrateLegacy();
    const records = appendLookup(await readRecords(), input, Date.now(), newLookupId());
    await writeRecords(records);
    return findEntry(groupLookups(records), input.word);
  });

/** Removes the word with every lookup of it. */
export const removeVocabWord = (word: string): Promise<void> =>
  serialized(async () => {
    await writeRecords(removeWordRecords(await readRecords(), word));
  });

export const clearVocab = (): Promise<void> => serialized(() => writeRecords([]));

/** Fires with the whole log for changes made from any extension page or content script. */
export const onVocabChanged = (callback: (records: LookupRecord[]) => void): (() => void) => {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    const change = changes[VOCAB_STORAGE_KEY];
    if (area === 'local' && change) callback(Array.isArray(change.newValue) ? change.newValue : []);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
};
