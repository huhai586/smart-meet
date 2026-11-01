import { describe, expect, it } from 'vitest';
import {
    appendLookup,
    groupLookups,
    matchesVocab,
    normalizeWord,
    recordsFromLegacyEntries,
    recordsFromLegacyWords,
    removeWordRecords,
    sortForDisplay,
    splitAroundWord,
    vocabLookupSet,
    wordCandidates,
    type LookupRecord,
    type VocabEntry,
} from './vocab-core';

const record = (overrides: Partial<LookupRecord> = {}): LookupRecord => ({
    id: 'r1',
    word: 'budget',
    translation: '预算',
    sentence: 'We need to fix the budget.',
    meetingName: 'Planning',
    at: 100,
    ...overrides,
});

describe('normalizeWord', () => {
    it('lowercases and strips surrounding punctuation', () => {
        expect(normalizeWord('Hello,')).toBe('hello');
        expect(normalizeWord('"quoted!"')).toBe('quoted');
        expect(normalizeWord('(done).')).toBe('done');
    });

    it('keeps inner apostrophes and drops a possessive', () => {
        expect(normalizeWord("don’t")).toBe("don't");
        expect(normalizeWord("John's")).toBe('john');
    });

    it('is empty for pure punctuation', () => {
        expect(normalizeWord('...')).toBe('');
    });
});

describe('wordCandidates / matchesVocab', () => {
    const set = vocabLookupSet([{ word: 'negotiate' }, { word: 'budget' }, { word: 'carry' }]);

    it('matches the same word in any case', () => {
        expect(matchesVocab('Budget', set)).toBe(true);
    });

    it('matches common inflections of a saved word', () => {
        expect(matchesVocab('negotiated', set)).toBe(true);
        expect(matchesVocab('negotiating', set)).toBe(true);
        expect(matchesVocab('budgets', set)).toBe(true);
        expect(matchesVocab('carries', set)).toBe(true);
        expect(matchesVocab('carried', set)).toBe(true);
    });

    it('matches inflections that double the last consonant', () => {
        const doubled = vocabLookupSet([{ word: 'ship' }, { word: 'plan' }, { word: 'run' }]);
        expect(matchesVocab('shipped', doubled)).toBe(true);
        expect(matchesVocab('shipping', doubled)).toBe(true);
        expect(matchesVocab('planned', doubled)).toBe(true);
        expect(matchesVocab('running', doubled)).toBe(true);
        expect(matchesVocab('shipped', vocabLookupSet([{ word: 'table' }]))).toBe(false);
    });

    it('matches when the saved word is the inflected one', () => {
        const inflectedSaved = vocabLookupSet([{ word: 'negotiating' }]);
        expect(matchesVocab('negotiate', inflectedSaved)).toBe(true);
    });

    it('does not match unrelated words', () => {
        expect(matchesVocab('budge', set)).toBe(false);
        expect(matchesVocab('table', set)).toBe(false);
    });

    it('ignores stems that are too short to be meaningful', () => {
        expect(wordCandidates('sing')).toEqual(['sing']);
        expect(matchesVocab('sing', vocabLookupSet([{ word: 's' }]))).toBe(false);
    });
});

describe('appendLookup', () => {
    it('adds one lookup with the word trimmed of punctuation', () => {
        const result = appendLookup([], { word: 'Budget,', translation: '预算', sentence: 'S', meetingName: 'M' }, 5, 'id-1');
        expect(result).toEqual([{ id: 'id-1', word: 'Budget', translation: '预算', sentence: 'S', meetingName: 'M', at: 5 }]);
    });

    it('does not touch the log it is given', () => {
        const log = [record()];
        appendLookup(log, { word: 'x' }, 9, 'id-2');
        expect(log).toHaveLength(1);
    });

    it('ignores input that has no word in it', () => {
        const log = [record()];
        expect(appendLookup(log, { word: '...' }, 9, 'id-2')).toBe(log);
    });
});

describe('groupLookups', () => {
    it('makes one entry per word, with every lookup as an occurrence', () => {
        const entries = groupLookups([
            record({ id: 'a', at: 1, sentence: 'First sentence.' }),
            record({ id: 'b', at: 2, sentence: 'Second sentence.', meetingName: 'Other' }),
        ]);
        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({ key: 'budget', word: 'budget', count: 2, firstSeenAt: 1, lastSeenAt: 2, sentence: 'First sentence.', meetingName: 'Planning', forms: [] });
        expect(entries[0].occurrences.map((o) => o.sentence)).toEqual(['First sentence.', 'Second sentence.']);
    });

    it('keeps the first translation and fills one that was missing', () => {
        const kept = groupLookups([record({ id: 'a', at: 1 }), record({ id: 'b', at: 2, translation: '预算费' })]);
        expect(kept[0].translation).toBe('预算');

        const filled = groupLookups([record({ id: 'a', at: 1, translation: '' }), record({ id: 'b', at: 2, translation: '预算' })]);
        expect(filled[0].translation).toBe('预算');
    });

    it('counts another form of a word towards the same entry and lists the form once', () => {
        const entries = groupLookups([
            record({ id: 'a', at: 1, word: 'ship', translation: '发布' }),
            record({ id: 'b', at: 2, word: 'shipped', translation: '已发布' }),
            record({ id: 'c', at: 3, word: 'Shipping' }),
            record({ id: 'd', at: 4, word: 'shipped' }),
        ]);
        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({ key: 'ship', word: 'ship', translation: '发布', count: 4, forms: ['shipped', 'Shipping'] });
    });

    it('folds the base form into an entry that started as an inflection', () => {
        const entries = groupLookups([record({ id: 'a', at: 1, word: 'negotiating' }), record({ id: 'b', at: 2, word: 'negotiate' })]);
        expect(entries).toHaveLength(1);
        expect(entries[0]).toMatchObject({ key: 'negotiating', word: 'negotiate', count: 2, forms: ['negotiating'] });
    });

    it('keeps unrelated words apart', () => {
        const entries = groupLookups([record({ id: 'a', word: 'ship' }), record({ id: 'b', word: 'shop' })]);
        expect(entries.map((e) => e.key)).toEqual(['ship', 'shop']);
    });

    it('gives the same words whatever order the lines arrive in', () => {
        const lines = [record({ id: 'a', at: 1, word: 'ship' }), record({ id: 'b', at: 2, word: 'shipped' }), record({ id: 'c', at: 3, word: 'budget' })];
        expect(groupLookups([...lines].reverse())).toEqual(groupLookups(lines));
    });

    it('skips lines that have no word', () => {
        expect(groupLookups([record({ word: '...' })])).toEqual([]);
    });
});

describe('removeWordRecords', () => {
    const log = [record({ id: 'a', word: 'ship' }), record({ id: 'b', word: 'shipped' }), record({ id: 'c', word: 'budget' })];

    it('removes every lookup of the word, through any of its forms', () => {
        expect(removeWordRecords(log, 'shipped').map((r) => r.id)).toEqual(['c']);
        expect(removeWordRecords(log, 'ship').map((r) => r.id)).toEqual(['c']);
    });

    it('leaves the log alone for a word that is not in it', () => {
        expect(removeWordRecords(log, 'table')).toBe(log);
    });
});

describe('legacy data', () => {
    const legacy = { key: 'budget', word: 'budget', translation: '预算', sentence: 'We need to fix the budget.', meetingName: 'Planning', firstSeenAt: 10, lastSeenAt: 90, count: 3 };

    it('turns an old entry into as many lookups as it counted', () => {
        const records = recordsFromLegacyEntries([legacy]);
        expect(records).toHaveLength(3);
        expect(records[0]).toMatchObject({ translation: '预算', sentence: 'We need to fix the budget.', at: 10 });
        expect(records[1]).toMatchObject({ translation: '', sentence: '', meetingName: 'Planning', at: 90 });
        expect(groupLookups(records)[0]).toMatchObject({ count: 3, firstSeenAt: 10, lastSeenAt: 90 });
    });

    it('converts the same way twice, so a repeat does not add anything', () => {
        expect(recordsFromLegacyEntries([legacy])).toEqual(recordsFromLegacyEntries([legacy]));
    });

    it('turns a plain word list into one lookup per word', () => {
        const records = recordsFromLegacyWords(['Budget,', 'budget', '...'], 50);
        expect(groupLookups(records).map((e) => [e.key, e.count])).toEqual([['budget', 2]]);
    });
});

describe('sortForDisplay', () => {
    const a = { key: 'a', count: 1, lastSeenAt: 10 } as VocabEntry;
    const b = { key: 'b', count: 3, lastSeenAt: 5 } as VocabEntry;
    const c = { key: 'c', count: 3, lastSeenAt: 8 } as VocabEntry;

    it('puts the most looked-up words first, then the most recent', () => {
        expect(sortForDisplay([a, b, c]).map((e) => e.key)).toEqual(['c', 'b', 'a']);
    });
});

describe('splitAroundWord', () => {
    it('cuts the sentence around the word, keeping its original case', () => {
        expect(splitAroundWord('We fix the Budget today', 'budget')).toEqual({ before: 'We fix the ', match: 'Budget', after: ' today' });
    });

    it('only matches whole words', () => {
        expect(splitAroundWord('The budgets grew', 'budget')).toBeNull();
        expect(splitAroundWord('A budget, then more.', 'budget')).toEqual({ before: 'A ', match: 'budget', after: ', then more.' });
    });

    it('handles words with regex characters and a missing sentence', () => {
        expect(splitAroundWord('what is c++ here', 'c++')).toEqual({ before: 'what is ', match: 'c++', after: ' here' });
        expect(splitAroundWord('', 'budget')).toBeNull();
    });
});
