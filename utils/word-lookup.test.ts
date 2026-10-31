import { describe, expect, it } from 'vitest';
import { wordAtOffset } from './word-lookup';

describe('wordAtOffset', () => {
    const text = 'Can you hear me, don\'t go?';

    it('returns the word the caret is inside, without punctuation', () => {
        expect(wordAtOffset(text, text.indexOf('hear') + 2)).toBe('hear');
        expect(wordAtOffset(text, text.indexOf('me') + 1)).toBe('me');
    });

    it('keeps contractions whole', () => {
        expect(wordAtOffset(text, text.indexOf('don') + 1)).toBe("don't");
    });

    it('accepts the caret at the end of a word', () => {
        expect(wordAtOffset(text, text.indexOf('hear') + 4)).toBe('hear');
        expect(wordAtOffset(text, text.length - 1)).toBe('go');
    });

    it('is empty on spaces, punctuation and out-of-range offsets', () => {
        expect(wordAtOffset('hello  world', 6)).toBe('');
        expect(wordAtOffset('hi, ', 3)).toBe('');
        expect(wordAtOffset('', 0)).toBe('');
        expect(wordAtOffset('hello', 99)).toBe('');
    });

    it('splits languages written without spaces', () => {
        expect(wordAtOffset('今天天气很好', 2)).not.toBe('');
        expect(wordAtOffset('今天天气很好', 2).length).toBeLessThan(6);
    });
});
