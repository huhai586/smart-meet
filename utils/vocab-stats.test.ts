import { describe, expect, it } from 'vitest';
import { groupLookups, type LookupRecord } from './vocab-core';
import {
    allMeetings,
    dayKey,
    filterEntries,
    groupByMeetingDay,
    meetingsOf,
    NO_FILTERS,
    sortEntries,
    summarize,
} from './vocab-stats';

const DAY = 24 * 60 * 60 * 1000;
const noon = (month: number, day: number) => new Date(2026, month - 1, day, 12).getTime();
const NOW = noon(11, 10);

let counter = 0;
const lookup = (word: string, at: number, meetingName = 'Sync', sentence = `We said ${word}.`, translation = ''): LookupRecord => ({
    id: `r${++counter}`,
    word,
    translation,
    sentence,
    meetingName,
    at,
});

const entries = () =>
    groupLookups([
        lookup('ship', noon(11, 1), 'Sync', 'We plan to ship it.', '发布'),
        lookup('shipped', noon(11, 5), 'Planning', 'It shipped late.'),
        lookup('ship', noon(11, 9), 'Sync'),
        lookup('budget', noon(11, 9), 'Planning', 'Fix the budget.', '预算'),
        lookup('roadmap', noon(11, 2), 'Customer'),
    ]);

describe('summarize', () => {
    it('counts words, lookups, new words this week and frequent words', () => {
        expect(summarize(entries(), NOW)).toEqual({ words: 3, lookups: 5, newThisWeek: 1, frequentWords: 1 });
    });

    it('is all zero without words', () => {
        expect(summarize([], NOW)).toEqual({ words: 0, lookups: 0, newThisWeek: 0, frequentWords: 0 });
    });
});

describe('meetings', () => {
    it('lists the distinct meetings of a word', () => {
        const ship = entries().find((e) => e.key === 'ship')!;
        expect(meetingsOf(ship).sort()).toEqual(['Planning', 'Sync']);
    });

    it('lists every meeting, the most recently used first', () => {
        expect(allMeetings(entries())).toEqual(['Planning', 'Sync', 'Customer']);
    });
});

describe('filterEntries', () => {
    it('keeps everything without filters', () => {
        expect(filterEntries(entries(), NO_FILTERS)).toHaveLength(3);
    });

    it('filters by how often a word was looked up', () => {
        expect(filterEntries(entries(), { ...NO_FILTERS, frequency: 'frequent' }).map((e) => e.key)).toEqual(['ship']);
        expect(filterEntries(entries(), { ...NO_FILTERS, frequency: 'once' }).map((e) => e.key).sort()).toEqual(['budget', 'roadmap']);
    });

    it('filters by meeting: a word counts if any lookup of it was there', () => {
        expect(filterEntries(entries(), { ...NO_FILTERS, meeting: 'Customer' }).map((e) => e.key)).toEqual(['roadmap']);
        expect(filterEntries(entries(), { ...NO_FILTERS, meeting: 'Planning' }).map((e) => e.key).sort()).toEqual(['budget', 'ship']);
    });

    it('filters by time on the latest lookup', () => {
        expect(filterEntries(entries(), { ...NO_FILTERS, since: NOW - 3 * DAY }).map((e) => e.key).sort()).toEqual(['budget', 'ship']);
    });

    it('searches the word, its forms, the translation and the sentences, ignoring case', () => {
        expect(filterEntries(entries(), { ...NO_FILTERS, query: 'SHIPPED' }).map((e) => e.key)).toEqual(['ship']);
        expect(filterEntries(entries(), { ...NO_FILTERS, query: '预算' }).map((e) => e.key)).toEqual(['budget']);
        expect(filterEntries(entries(), { ...NO_FILTERS, query: 'fix the' }).map((e) => e.key)).toEqual(['budget']);
        expect(filterEntries(entries(), { ...NO_FILTERS, query: 'nothing like this' })).toEqual([]);
    });

    it('combines filters', () => {
        expect(filterEntries(entries(), { ...NO_FILTERS, frequency: 'once', meeting: 'Planning' }).map((e) => e.key)).toEqual(['budget']);
    });
});

describe('sortEntries', () => {
    it('sorts by lookups, most recent, or alphabet', () => {
        expect(sortEntries(entries(), 'count')[0].key).toBe('ship');
        expect(sortEntries(entries(), 'recent').map((e) => e.key)).toEqual(['ship', 'budget', 'roadmap']);
        expect(sortEntries(entries(), 'alpha').map((e) => e.key)).toEqual(['budget', 'roadmap', 'ship']);
    });

    it('does not change the list it is given', () => {
        const list = entries();
        const before = list.map((e) => e.key);
        sortEntries(list, 'alpha');
        expect(list.map((e) => e.key)).toEqual(before);
    });
});

describe('groupByMeetingDay', () => {
    it('groups lookups by meeting and day, newest day first, oldest lookup first inside', () => {
        const groups = groupByMeetingDay(entries());
        expect(groups.map((g) => `${g.day} ${g.meeting}`)).toEqual([
            `${dayKey(noon(11, 9))} Planning`,
            `${dayKey(noon(11, 9))} Sync`,
            `${dayKey(noon(11, 5))} Planning`,
            `${dayKey(noon(11, 2))} Customer`,
            `${dayKey(noon(11, 1))} Sync`,
        ]);
        expect(groups[3].items.map((item) => item.entry.key)).toEqual(['roadmap']);
    });

    it('keeps every lookup of every word', () => {
        const total = groupByMeetingDay(entries()).reduce((sum, group) => sum + group.items.length, 0);
        expect(total).toBe(5);
    });
});
