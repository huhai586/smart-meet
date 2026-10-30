import { describe, expect, it } from 'vitest';
import {
  findBestMatchLanguage,
  getPreferredTranslationLanguage,
  normalizeLanguageCode,
} from './language-preferences';

describe('normalizeLanguageCode', () => {
  it.each([
    ['zh-Hant', 'zh'],
    ['pt-BR', 'pt'],
    ['en-GB', 'en'],
    ['JA', 'ja'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeLanguageCode(input)).toBe(expected);
  });
});

describe('findBestMatchLanguage', () => {
  it('prioritizes the browser UI language over accepted fallback languages', () => {
    expect(findBestMatchLanguage('ja-JP', ['en-US', 'zh-CN']).code).toBe('ja');
  });

  it('uses an accepted language when the browser UI language is unsupported', () => {
    expect(findBestMatchLanguage('nl-NL', ['fr-CA', 'en-US']).code).toBe('fr');
  });

  it('falls back to English when none of the languages match', () => {
    expect(findBestMatchLanguage('nl-NL', ['sv-SE']).code).toBe('en');
  });
});

describe('getPreferredTranslationLanguage', () => {
  it('keeps the UI language for non-English supported languages', () => {
    expect(getPreferredTranslationLanguage('ja')).toBe('ja');
  });

  it('uses Chinese for English and unknown UI languages', () => {
    expect(getPreferredTranslationLanguage('en')).toBe('zh');
    expect(getPreferredTranslationLanguage('nl')).toBe('zh');
  });
});
