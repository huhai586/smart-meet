import { describe, expect, it } from 'vitest';
import {
    matchesVocab,
    normalizeWord,
    removeEntry,
    sortForDisplay,
    splitAroundWord,
    upsertLookup,
    vocabLookupSet,
    wordCandidates,
    type VocabEntry,
} from './vocab-core';

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

describe('upsertLookup', () => {
    const entry = (overrides: Partial<VocabEntry> = {}): VocabEntry => ({
        key: 'budget',
        word: 'budget',
        translation: '预算',
        sentence: 'We need to fix the budget.',
        meetingName: 'Planning',
        firstSeenAt: 1,
        lastSeenAt: 1,
        count: 1,
        ...overrides,
    });

    it('adds a new entry with count 1', () => {
        const result = upsertLookup([], { word: 'Budget,', translation: '预算', sentence: 'S', meetingName: 'M' }, 5);
        expect(result).toEqual([
            { key: 'budget', word: 'Budget', translation: '预算', sentence: 'S', meetingName: 'M', firstSeenAt: 5, lastSeenAt: 5, count: 1 },
        ]);
    });

    it('counts a repeat lookup and keeps the first translation, sentence and meeting', () => {
        const result = upsertLookup([entry()], { word: 'BUDGET', translation: '预算费', sentence: 'Later sentence', meetingName: 'Other' }, 9);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ count: 2, lastSeenAt: 9, firstSeenAt: 1, sentence: 'We need to fix the budget.', meetingName: 'Planning', translation: '预算' });
        expect(result[0].forms).toBeUndefined();
    });

    it('fills in a translation the entry never had', () => {
        const result = upsertLookup([entry({ translation: '' })], { word: 'budget', translation: '预算' }, 9);
        expect(result[0].translation).toBe('预算');
    });

    it('fills in a sentence that a migrated entry never had', () => {
        const result = upsertLookup([entry({ sentence: '', meetingName: '' })], { word: 'budget', sentence: 'New one', meetingName: 'M' }, 9);
        expect(result[0]).toMatchObject({ sentence: 'New one', meetingName: 'M' });
    });

    it('ignores input that has no word in it', () => {
        expect(upsertLookup([entry()], { word: '...' }, 9)).toEqual([entry()]);
    });
});

describe('removeEntry / sortForDisplay', () => {
    const a = { key: 'a', count: 1, lastSeenAt: 10 } as VocabEntry;
    const b = { key: 'b', count: 3, lastSeenAt: 5 } as VocabEntry;
    const c = { key: 'c', count: 3, lastSeenAt: 8 } as VocabEntry;

    it('removes by any spelling of the word', () => {
        expect(removeEntry([a, b], 'B!')).toEqual([a]);
    });

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

describe('merging forms of the same word', () => {
    const ship = (overrides: Partial<VocabEntry> = {}): VocabEntry => ({
        key: 'ship',
        word: 'ship',
        translation: '发布',
        sentence: 'We plan to ship the beta.',
        meetingName: 'Sync',
        firstSeenAt: 1,
        lastSeenAt: 1,
        count: 5,
        ...overrides,
    });

    it('counts an inflected form on the saved word instead of adding a second entry', () => {
        const result = upsertLookup([ship()], { word: 'shipped', translation: '已发布' }, 9);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ key: 'ship', word: 'ship', translation: '发布', count: 6, lastSeenAt: 9, forms: ['shipped'] });
    });

    it('folds the base form into an entry that was saved as an inflection', () => {
        const saved = ship({ key: 'negotiating', word: 'negotiating', count: 1 });
        const result = upsertLookup([saved], { word: 'negotiate' }, 9);
        expect(result).toHaveLength(1);
        expect(result[0]).toMatchObject({ key: 'negotiating', count: 2, forms: ['negotiate'] });
    });

    it('lists each other form once', () => {
        let entries = upsertLookup([ship()], { word: 'shipped' }, 2);
        entries = upsertLookup(entries, { word: 'Shipping,' }, 3);
        entries = upsertLookup(entries, { word: 'shipped' }, 4);
        expect(entries).toHaveLength(1);
        expect(entries[0].forms).toEqual(['shipped', 'Shipping']);
        expect(entries[0].count).toBe(8);
    });

    it('keeps unrelated words as separate entries', () => {
        const result = upsertLookup([ship()], { word: 'shop' }, 9);
        expect(result.map((entry) => entry.key)).toEqual(['ship', 'shop']);
    });

    it('removes the entry through any of its forms', () => {
        expect(removeEntry([ship()], 'shipped')).toEqual([]);
        expect(removeEntry([ship()], 'ship')).toEqual([]);
        expect(removeEntry([ship()], 'shop')).toHaveLength(1);
    });
});
