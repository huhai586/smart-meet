import { describe, expect, it } from 'vitest';
import { isSameLanguage } from './language-code';

describe('isSameLanguage', () => {
    it('ignores region subtags', () => {
        expect(isSameLanguage('en', 'en-US')).toBe(true);
        expect(isSameLanguage('pt', 'pt-BR')).toBe(true);
    });

    it('is false for different languages', () => {
        expect(isSameLanguage('en', 'zh')).toBe(false);
        expect(isSameLanguage('ja', 'ko')).toBe(false);
    });

    it('keeps Simplified and Traditional Chinese apart', () => {
        expect(isSameLanguage('zh', 'zh-CN')).toBe(true);
        expect(isSameLanguage('zh', 'zh-Hant')).toBe(false);
        expect(isSameLanguage('zh-Hant', 'zh-TW')).toBe(true);
    });
});
