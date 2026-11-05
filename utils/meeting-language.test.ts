import { describe, expect, it } from 'vitest';
import {
  addSample,
  countSamples,
  dominantLanguage,
  meetingCodeFromUrl,
  toSample,
  toTranslationLanguage,
  type LanguageSample,
} from './meeting-language';

const LONG_EN = "Okay, let's start the meeting now.";
const sample = (language: string, text = `${language} line ${Math.random()}`): LanguageSample => ({ text, language });
const fill = (language: string, n: number) => Array.from({ length: n }, () => sample(language));

describe('toTranslationLanguage', () => {
  it('maps Meet caption codes to translator codes', () => {
    expect(toTranslationLanguage('en-US')).toBe('en');
    expect(toTranslationLanguage('ja-JP')).toBe('ja');
    expect(toTranslationLanguage('ar-x-LEVANT')).toBe('ar');
    expect(toTranslationLanguage('ss-latn-ZA')).toBe('ss');
  });

  it('keeps Simplified and Traditional Chinese apart', () => {
    expect(toTranslationLanguage('cmn-Hans-CN')).toBe('zh');
    expect(toTranslationLanguage('cmn-Hant-TW')).toBe('zh-Hant');
    expect(toTranslationLanguage('yue-Hant-HK')).toBe('zh-Hant');
    expect(toTranslationLanguage('zh')).toBe('zh');
  });
});

describe('toSample', () => {
  it('takes a long, confident line', () => {
    expect(toSample(LONG_EN, { detectedLanguage: 'en', confidence: 0.99 })).toEqual({ text: LONG_EN, language: 'en' });
  });

  it('skips short lines, which are detected unreliably', () => {
    expect(toSample('Mm-hmm', { detectedLanguage: 'ar-Latn', confidence: 0.76 })).toBeNull();
    expect(toSample('Okay', { detectedLanguage: 'en', confidence: 0.99 })).toBeNull();
  });

  it('accepts short CJK lines', () => {
    expect(toSample('我们开始开会吧', { detectedLanguage: 'zh', confidence: 0.95 })?.language).toBe('zh');
  });

  it('skips weak, undetermined and romanized detections', () => {
    expect(toSample(LONG_EN, { detectedLanguage: 'en', confidence: 0.6 })).toBeNull();
    expect(toSample(LONG_EN, { detectedLanguage: 'und', confidence: 1 })).toBeNull();
    expect(toSample(LONG_EN, { detectedLanguage: 'hi-Latn', confidence: 0.9 })).toBeNull();
    expect(toSample(LONG_EN, null)).toBeNull();
  });
});

describe('addSample', () => {
  it('replaces the previous sample when the same caption line grows', () => {
    const first = addSample([], { text: "Let's start the", language: 'en' });
    const grown = addSample(first, { text: "Let's start the meeting now", language: 'en' });
    expect(grown).toEqual([{ text: "Let's start the meeting now", language: 'en' }]);
  });

  it('keeps only the most recent 30 samples', () => {
    let samples: LanguageSample[] = [];
    for (let i = 0; i < 40; i++) samples = addSample(samples, sample('en', `line ${i}`));
    expect(samples).toHaveLength(30);
    expect(samples[0].text).toBe('line 10');
  });
});

describe('dominantLanguage', () => {
  it('decides nothing with fewer than 5 samples', () => {
    expect(dominantLanguage(fill('en', 4))).toBeNull();
    expect(dominantLanguage(fill('en', 5))).toBe('en');
  });

  it('ignores stray detections in an English meeting', () => {
    expect(dominantLanguage([...fill('en', 19), sample('fr')])).toBe('en');
  });

  it('keeps the current language while no language holds 60%', () => {
    const mixed = [...fill('en', 5), ...fill('ja', 5)];
    expect(dominantLanguage(mixed, 'en')).toBe('en');
    expect(dominantLanguage(mixed)).toBeNull();
  });

  it('switches once another language takes over the window', () => {
    expect(dominantLanguage([...fill('en', 10), ...fill('ja', 20)], 'en')).toBe('ja');
  });
});

describe('countSamples', () => {
  it('counts samples of one language', () => {
    expect(countSamples([...fill('en', 3), sample('fr')], 'en')).toBe(3);
  });
});

describe('meetingCodeFromUrl', () => {
  it('reads both meeting URL forms', () => {
    expect(meetingCodeFromUrl('https://meet.google.com/gkt-xpmb-kjb')).toBe('gkt-xpmb-kjb');
    expect(meetingCodeFromUrl('https://meet.google.com/meet/gkt-xpmb-kjb?authuser=0')).toBe('gkt-xpmb-kjb');
  });

  it('is null for other pages', () => {
    expect(meetingCodeFromUrl('https://meet.google.com/home')).toBeNull();
    expect(meetingCodeFromUrl('https://example.com/gkt-xpmb-kjb')).toBeNull();
    expect(meetingCodeFromUrl(undefined)).toBeNull();
  });
});
