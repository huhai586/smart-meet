import { useSyncExternalStore } from 'react';
import { getVocab, onVocabChanged } from '~/utils/vocab';
import { vocabLookupSet, type VocabEntry } from '~/utils/vocab-core';

// One shared copy: every caption line reads the saved words, so each must not load and listen on its own.
let entries: VocabEntry[] = [];
let lookupSet = new Set<string>();
let started = false;
const listeners = new Set<() => void>();

const update = (next: VocabEntry[]) => {
  entries = next;
  lookupSet = vocabLookupSet(next);
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  if (!started) {
    started = true;
    getVocab().then(update);
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
