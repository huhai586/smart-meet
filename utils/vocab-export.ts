import type { VocabEntry } from './vocab-core';

const escapeHtml = (text: string) =>
  text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The sentence with the looked-up word in bold; just the word when no sentence was kept. */
const sentenceWithBoldWord = (entry: VocabEntry): string => {
  if (!entry.sentence) return escapeHtml(entry.word);
  const escaped = escapeHtml(entry.sentence);
  const pattern = new RegExp(`\\b${escapeRegExp(escapeHtml(entry.word))}\\b`, 'i');
  return pattern.test(escaped) ? escaped.replace(pattern, (match) => `<b>${match}</b>`) : escaped;
};

const tabSafe = (text: string) => text.replace(/[\t\r\n]+/g, ' ');

/**
 * Anki's "Import File" text format for the Basic note type: front is the sentence with the word in bold,
 * back is the word and its translation, and the meeting name becomes a tag.
 */
export const toAnkiText = (entries: VocabEntry[]): string => {
  const header = ['#separator:tab', '#html:true', '#tags column:3'];
  const rows = entries.map((entry) => {
    const back = entry.translation ? `<b>${escapeHtml(entry.word)}</b> — ${escapeHtml(entry.translation)}` : `<b>${escapeHtml(entry.word)}</b>`;
    const tag = (entry.meetingName || 'smart-meet').replace(/\s+/g, '_');
    return [tabSafe(sentenceWithBoldWord(entry)), tabSafe(back), tabSafe(tag)].join('\t');
  });
  return [...header, ...rows].join('\n') + '\n';
};

const csvField = (value: string | number) => {
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const isoDate = (timestamp: number) => new Date(timestamp).toISOString().slice(0, 10);

/** CSV with a byte-order mark so Excel reads the Chinese columns as UTF-8. */
export const toCsv = (entries: VocabEntry[]): string => {
  const rows = [
    ['word', 'translation', 'sentence', 'meeting', 'lookups', 'first_seen'],
    ...entries.map((entry) => [entry.word, entry.translation, entry.sentence, entry.meetingName, entry.count, isoDate(entry.firstSeenAt)]),
  ];
  return '﻿' + rows.map((row) => row.map(csvField).join(',')).join('\r\n') + '\r\n';
};
