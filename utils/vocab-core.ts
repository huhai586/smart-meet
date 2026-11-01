/** One word the user looked up while learning, with the sentence it was heard in. */
export interface VocabEntry {
  /** normalizeWord(word); the identity of the entry. */
  key: string;
  word: string;
  translation: string;
  /** The caption line the word was first looked up in. */
  sentence: string;
  meetingName: string;
  firstSeenAt: number;
  lastSeenAt: number;
  /** How many times the user looked it up; a word that keeps coming back is the one that needs work. */
  count: number;
  /** Other forms of the word that were looked up and folded into this entry ("shipped" under "ship"). */
  forms?: string[];
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

/**
 * Adds a lookup: a new entry, or one more count on the entry the word belongs to (see findEntry), where a
 * differently spelled form is recorded under `forms` and the first translation is kept.
 */
export const upsertLookup = (entries: VocabEntry[], input: LookupInput, now: number): VocabEntry[] => {
  const key = normalizeWord(input.word);
  if (!key) return entries;

  const existing = findEntry(entries, input.word);
  if (!existing) {
    return [
      ...entries,
      {
        key,
        word: input.word.replace(EDGE_NON_WORD, ''),
        translation: input.translation ?? '',
        sentence: input.sentence ?? '',
        meetingName: input.meetingName ?? '',
        firstSeenAt: now,
        lastSeenAt: now,
        count: 1,
      },
    ];
  }

  const spelled = input.word.replace(EDGE_NON_WORD, '');
  const forms = key === existing.key ? existing.forms : [...new Set([...(existing.forms ?? []), spelled])];

  return entries.map((entry) =>
    entry === existing
      ? {
          ...entry,
          translation: entry.translation || input.translation || '',
          sentence: entry.sentence || input.sentence || '',
          meetingName: entry.meetingName || input.meetingName || '',
          lastSeenAt: now,
          count: entry.count + 1,
          ...(forms ? { forms } : {}),
        }
      : entry,
  );
};

/** Removes the entry the word belongs to, whichever of its forms is given. */
export const removeEntry = (entries: VocabEntry[], word: string): VocabEntry[] => {
  const target = findEntry(entries, word);
  return target ? entries.filter((entry) => entry !== target) : entries;
};

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
