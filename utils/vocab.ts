import { getTranslatedWords } from './translate';
import {
  findEntry,
  removeEntry,
  upsertLookup,
  type LookupInput,
  type VocabEntry,
} from './vocab-core';

/**
 * Vocabulary lives in chrome.storage.local, not in appConfig: appConfig is a single chrome.storage.sync
 * item (about 8 KB), which sentences per word would overflow.
 */
export const VOCAB_STORAGE_KEY = 'vocabEntries';
const VOCAB_MIGRATED_KEY = 'vocabMigratedFromTranslatedWords';

// Lookups can land in quick succession; one write at a time keeps the read-modify-write from losing any.
let writeQueue: Promise<unknown> = Promise.resolve();
const serialized = <T>(task: () => Promise<T>): Promise<T> => {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => undefined);
  return run;
};

const readEntries = async (): Promise<VocabEntry[]> => {
  const stored = await chrome.storage.local.get(VOCAB_STORAGE_KEY);
  return Array.isArray(stored[VOCAB_STORAGE_KEY]) ? stored[VOCAB_STORAGE_KEY] : [];
};

const writeEntries = (entries: VocabEntry[]) => chrome.storage.local.set({ [VOCAB_STORAGE_KEY]: entries });

/** Words saved before entries existed were plain strings; keep them, without a sentence. */
const migrateLegacyWords = async (): Promise<void> => {
  const { [VOCAB_MIGRATED_KEY]: migrated } = await chrome.storage.local.get(VOCAB_MIGRATED_KEY);
  if (migrated) return;

  const legacyWords = await getTranslatedWords();
  const now = Date.now();
  let entries = await readEntries();
  // Forms of one word that were saved separately come out as a single entry.
  for (const word of legacyWords) entries = upsertLookup(entries, { word }, now);
  await writeEntries(entries);
  await chrome.storage.local.set({ [VOCAB_MIGRATED_KEY]: true });
};

export const getVocab = (): Promise<VocabEntry[]> =>
  serialized(async () => {
    await migrateLegacyWords();
    return readEntries();
  });

/** Records one lookup and returns the entry as it now stands (so the caller can show the count). */
export const recordLookup = (input: LookupInput): Promise<VocabEntry | undefined> =>
  serialized(async () => {
    await migrateLegacyWords();
    const entries = upsertLookup(await readEntries(), input, Date.now());
    await writeEntries(entries);
    return findEntry(entries, input.word);
  });

export const removeVocabWord = (word: string): Promise<void> =>
  serialized(async () => {
    await writeEntries(removeEntry(await readEntries(), word));
  });

/** Fires for changes made from any extension page or content script. */
export const onVocabChanged = (callback: (entries: VocabEntry[]) => void): (() => void) => {
  const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    const change = changes[VOCAB_STORAGE_KEY];
    if (area === 'local' && change) callback(Array.isArray(change.newValue) ? change.newValue : []);
  };
  chrome.storage.onChanged.addListener(listener);
  return () => chrome.storage.onChanged.removeListener(listener);
};

export const clearVocab = (): Promise<void> => serialized(() => writeEntries([]));
