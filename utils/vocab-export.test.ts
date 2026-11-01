import { describe, expect, it } from 'vitest';
import { toAnkiText, toCsv } from './vocab-export';
import type { VocabEntry } from './vocab-core';

const entry = (overrides: Partial<VocabEntry> = {}): VocabEntry => ({
    key: 'budget',
    word: 'budget',
    translation: '预算',
    sentence: 'We need to fix the budget by Friday.',
    meetingName: 'Q4 Planning',
    firstSeenAt: Date.UTC(2026, 10, 1),
    lastSeenAt: Date.UTC(2026, 10, 1),
    count: 3,
    forms: [],
    occurrences: [],
    ...overrides,
});

describe('toAnkiText', () => {
    it('starts with the import directives', () => {
        const lines = toAnkiText([entry()]).split('\n');
        expect(lines.slice(0, 3)).toEqual(['#separator:tab', '#html:true', '#tags column:3']);
    });

    it('puts the sentence with the word in bold on the front and word plus translation on the back', () => {
        const [front, back, tag] = toAnkiText([entry()]).split('\n')[3].split('\t');
        expect(front).toBe('We need to fix the <b>budget</b> by Friday.');
        expect(back).toBe('<b>budget</b> — 预算');
        expect(tag).toBe('Q4_Planning');
    });

    it('escapes HTML coming from captions', () => {
        const [front] = toAnkiText([entry({ sentence: 'A <script> & budget', word: 'budget' })]).split('\n')[3].split('\t');
        expect(front).toBe('A &lt;script&gt; &amp; <b>budget</b>');
    });

    it('falls back to the bare word when no sentence was kept', () => {
        const [front, back] = toAnkiText([entry({ sentence: '', translation: '' })]).split('\n')[3].split('\t');
        expect(front).toBe('budget');
        expect(back).toBe('<b>budget</b>');
    });

    it('never lets a tab or newline break a row', () => {
        const rows = toAnkiText([entry({ sentence: 'line one\nline\ttwo budget' })]).trimEnd().split('\n');
        expect(rows).toHaveLength(4);
        expect(rows[3].split('\t')).toHaveLength(3);
    });
});

describe('toCsv', () => {
    it('writes a header, a byte-order mark and one row per word', () => {
        const csv = toCsv([entry()]);
        expect(csv.startsWith('﻿word,translation,sentence,meeting,lookups,first_seen\r\n')).toBe(true);
        expect(csv).toContain('budget,预算,We need to fix the budget by Friday.,Q4 Planning,3,2026-11-01\r\n');
    });

    it('quotes fields that contain commas, quotes or line breaks', () => {
        const csv = toCsv([entry({ sentence: 'He said, "wait"\nthen left' })]);
        expect(csv).toContain('"He said, ""wait""\nthen left"');
    });
});
