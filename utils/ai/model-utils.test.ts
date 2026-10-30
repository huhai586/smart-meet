import { describe, expect, it } from 'vitest';
import { filterChatModelIds, isChatModel } from './model-utils';

describe('isChatModel', () => {
  it.each([
    ['gpt-4o', true],
    ['claude-sonnet-4-5', true],
    ['davinci-002-finetuned', true],
    ['text-embedding-3-small', false],
    ['tts-1-hd', false],
    ['gpt-4o-realtime-preview', false],
    ['gpt-4o-audio-preview', false],
    ['computer-use-preview', false],
  ])('classifies %s as %s', (modelId, expected) => {
    expect(isChatModel(modelId)).toBe(expected);
  });
});

describe('filterChatModelIds', () => {
  it('removes non-chat models and returns a sorted list', () => {
    expect(filterChatModelIds([
      'gpt-4o-mini',
      'text-embedding-3-small',
      'claude-sonnet-4-5',
      'tts-1',
    ])).toEqual(['claude-sonnet-4-5', 'gpt-4o-mini']);
  });
});
