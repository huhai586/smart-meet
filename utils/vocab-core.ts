/**
 * One lookup: the word as it was spelled, the sentence it was heard in, and when. What the user saved is
 * this append-only log; the words, their counts and their forms are worked out from it (groupLookups).
 * Merging two logs, for another device, is then just the union of their ids.
 */
export interface LookupRecord {
  id: string;
  word: string;
  translation: string;
  sentence: string;
  meetingName: string;
  at: number;
}

/** A word and every time it was looked up, worked out from the lookup log. */
export interface VocabEntry {
  /** normalizeWord of the first spelling; the identity of the entry. */
  key: string;
  /** The shortest spelling it was looked up with, which is usually the base form. */
  word: string;
  /** The first translation that came back. */
  translation: string;
  /** The first sentence that was kept. */
  sentence: string;
  /** The first meeting name that was kept. */
  meetingName: string;
  firstSeenAt: number;
  lastSeenAt: number;
  /** How many times the user looked it up; a word that keeps coming back is the one that needs work. */
  count: number;
  /** Other spellings that were looked up and counted towards this entry ("shipped" under "ship"). */
  forms: string[];
  /** Every lookup, oldest first. */
  occurrences: LookupRecord[];
}

export interface LookupInput {
  word: string;
  translation?: string;
  sentence?: string;
  meetingName?: string;
}

const EDGE_NON_WORD = /^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu;
/** Two of the same consonant at the end, as in "shipp" from "shipped". */
const DOUBLED_CONSONANT = /([^aeiou\W\d_])\1$/;
/** Stems shorter than this match far too much ("is" from "isn't", "s" from "sing"). */
const MIN_STEM_LENGTH = 3;

/** Lowercase, no surrounding punctuation, curly apostrophes straightened, possessive 's dropped. */
export const normalizeWord = (word: string): string =>
  word.toLowerCase().replace(/[’‘]/g, "'").replace(EDGE_NON_WORD, '').replace(/'s$/, '');

/** The word itself plus the base forms its common English endings could come from. */
export const wordCandidates = (word: string): string[] => {
  const base = normalizeWord(word);
  if (!base) return [];
  const stems = new Set<string>();
  const strip = (suffix: string, replacement = '') => {
    if (!base.endsWith(suffix)) return;
    const stem = base.slice(0, base.length - suffix.length);
    stems.add(stem + replacement);
    // "shipped" / "running": the final consonant was doubled before the ending
    if (!replacement && DOUBLED_CONSONANT.test(stem)) stems.add(stem.slice(0, -1));
  };
  strip('ies', 'y');
  strip('ied', 'y');
  strip('es');
  strip('s');
  strip('ed');
  strip('d');
  strip('ing');
  strip('ing', 'e');
  strip('ly');
  return [base, ...[...stems].filter((stem) => stem.length >= MIN_STEM_LENGTH && stem !== base)];
};

const sharesCandidate = (a: string, b: string): boolean => {
  const known = new Set(wordCandidates(a));
  return wordCandidates(b).some((candidate) => known.has(candidate));
};

/**
 * The entry a word belongs to: the same word, or another form of it by the same rule that decides what is
 * highlighted, so what the user sees marked is what a click counts towards. Like the highlighting, it can
 * be wrong now and then ("early" shares a stem with "ear").
 */
export const findEntry = <T extends Pick<VocabEntry, 'key' | 'word'>>(entries: T[], word: string): T | undefined => {
  const key = normalizeWord(word);
  return entries.find((entry) => entry.key === key) ?? entries.find((entry) => sharesCandidate(entry.word, word));
};

/** The set a caption word is compared against: every saved word and the stems it could be written as. */
export const vocabLookupSet = (entries: Pick<VocabEntry, 'word'>[]): Set<string> =>
  new Set(entries.flatMap((entry) => wordCandidates(entry.word)));

/** True when the caption word is a saved word, in the same form or a common inflection of it. */
export const matchesVocab = (word: string, lookupSet: Set<string>): boolean =>
  wordCandidates(word).some((candidate) => lookupSet.has(candidate));

const trimEdges = (word: string) => word.replace(EDGE_NON_WORD, '');

/** The log with one more lookup in it; unchanged when there is no word in the input. */
export const appendLookup = (records: LookupRecord[], input: LookupInput, now: number, id: string): LookupRecord[] => {
  if (!normalizeWord(input.word)) return records;
  return [
    ...records,
    {
      id,
      word: trimEdges(input.word),
      translation: input.translation ?? '',
      sentence: input.sentence ?? '',
      meetingName: input.meetingName ?? '',
      at: now,
    },
  ];
};

/**
 * Turns the lookup log into words. Lookups are taken oldest first, so the same log always gives the same
 * words, whichever device wrote which lines; a lookup of another form of a word (see findEntry) counts
 * towards the entry that is already there, and the first translation, sentence and meeting stay.
 */
export const groupLookups = (records: LookupRecord[]): VocabEntry[] => {
  const ordered = [...records].sort((a, b) => a.at - b.at || a.id.localeCompare(b.id));
  const entries: VocabEntry[] = [];

  for (const record of ordered) {
    const key = normalizeWord(record.word);
    if (!key) continue;

    const existing = findEntry(entries, record.word);
    if (!existing) {
      entries.push({
        key,
        word: record.word,
        translation: record.translation,
        sentence: record.sentence,
        meetingName: record.meetingName,
        firstSeenAt: record.at,
        lastSeenAt: record.at,
        count: 1,
        forms: [],
        occurrences: [record],
      });
      continue;
    }

    existing.occurrences.push(record);
    existing.count += 1;
    existing.lastSeenAt = record.at;
    existing.translation ||= record.translation;
    existing.sentence ||= record.sentence;
    existing.meetingName ||= record.meetingName;
    if (key !== existing.key && !existing.forms.some((form) => normalizeWord(form) === key)) existing.forms.push(record.word);
  }
  // Show the shortest spelling ("negotiate" rather than "negotiating") as the word; the key stays the first one.
  for (const entry of entries) {
    const spellings = [entry.word, ...entry.forms];
    const shortest = spellings.reduce((best, spelling) => (normalizeWord(spelling).length < normalizeWord(best).length ? spelling : best));
    entry.word = shortest;
    entry.forms = spellings.filter((spelling) => spelling !== shortest);
  }
  return entries;
};

/** The log without every lookup of the word, whichever of its forms is given. */
export const removeWordRecords = (records: LookupRecord[], word: string): LookupRecord[] => {
  const target = findEntry(groupLookups(records), word);
  if (!target) return records;
  const gone = new Set(target.occurrences.map((record) => record.id));
  return records.filter((record) => !gone.has(record.id));
};

/** The shape vocabulary was stored in before the lookup log: one entry per word, with a count. */
export interface LegacyVocabEntry {
  key: string;
  word: string;
  translation: string;
  sentence: string;
  meetingName: string;
  firstSeenAt: number;
  lastSeenAt: number;
  count: number;
}

/**
 * Old entries become that many lookups: the first carries the sentence and translation that were kept, the
 * rest are plain counts. Ids depend only on the entry, so converting twice gives the same records.
 */
export const recordsFromLegacyEntries = (entries: LegacyVocabEntry[]): LookupRecord[] =>
  entries.flatMap((entry) =>
    Array.from({ length: Math.max(1, entry.count) }, (_, index): LookupRecord => ({
      id: `legacy-${entry.key}-${index}`,
      word: entry.word,
      translation: index === 0 ? entry.translation : '',
      sentence: index === 0 ? entry.sentence : '',
      meetingName: entry.meetingName,
      at: index === 0 ? entry.firstSeenAt : entry.lastSeenAt,
    })),
  );

/** Words saved when vocabulary was a plain list of strings: one lookup each, with nothing else known. */
export const recordsFromLegacyWords = (words: string[], now: number): LookupRecord[] =>
  words.flatMap((word) => {
    const key = normalizeWord(word);
    return key ? [{ id: `legacy-word-${key}`, word: trimEdges(word), translation: '', sentence: '', meetingName: '', at: now }] : [];
  });

/** Most looked-up first, then most recent: the words that keep tripping the user come first. */
export const sortForDisplay = (entries: VocabEntry[]): VocabEntry[] =>
  [...entries].sort((a, b) => b.count - a.count || b.lastSeenAt - a.lastSeenAt);

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The sentence cut around the first whole-word occurrence of `word`, or null when it is not in there. */
export const splitAroundWord = (sentence: string, word: string): { before: string; match: string; after: string } | null => {
  if (!sentence || !word) return null;
  const found = new RegExp(`(^|[^\\p{L}\\p{N}])(${escapeRegExp(word)})(?![\\p{L}\\p{N}])`, 'iu').exec(sentence);
  if (!found) return null;
  const start = found.index + found[1].length;
  return { before: sentence.slice(0, start), match: found[2], after: sentence.slice(start + found[2].length) };
};
