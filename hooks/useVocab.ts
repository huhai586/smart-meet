import { useSyncExternalStore } from 'react';
import { getVocabRecords, onVocabChanged } from '~/utils/vocab';
import { groupLookups, vocabLookupSet, type LookupRecord, type VocabEntry } from '~/utils/vocab-core';

// One shared copy: every caption line reads the saved words, so each must not load and listen on its own.
let entries: VocabEntry[] = [];
let lookupSet = new Set<string>();
let started = false;
const listeners = new Set<() => void>();

const update = (records: LookupRecord[]) => {
  entries = groupLookups(records);
  lookupSet = vocabLookupSet(entries);
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  if (!started) {
    started = true;
    getVocabRecords().then(update);
    onVocabChanged(update);
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

/** The saved words, kept current as lookups happen anywhere in the extension. */
export const useVocab = (): VocabEntry[] => useSyncExternalStore(subscribe, () => entries);

/** What a caption word is compared against to decide whether to mark it as already looked up. */
export const useVocabLookupSet = (): Set<string> => useSyncExternalStore(subscribe, () => lookupSet);

export default useVocab;
