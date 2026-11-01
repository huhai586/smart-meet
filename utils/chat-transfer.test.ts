import { describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { buildChatFile, parseChatFile, summarizeImport, toChatText } from './chat-transfer';
import type { Transcript } from '~hooks/useTranscripts';

const at = (text: string) => dayjs(text).valueOf();
const line = (session: string, time: string, overrides: Partial<Transcript> = {}): Transcript =>
  ({ session, timestamp: at(time), activeSpeaker: 'Ann', talkContent: 'Hello', meetingName: 'Sync', ...overrides }) as Transcript;

describe('parseChatFile', () => {
  const records = [line('b', '2026-09-01T10:00:00'), line('a', '2026-09-01T09:00:00')];

  it('reads the current format, oldest first', () => {
    const parsed = parseChatFile(JSON.stringify(buildChatFile(records, 1)));
    expect(parsed).toMatchObject({ ok: true, skipped: 0 });
    expect(parsed.ok && parsed.records.map((r) => r.session)).toEqual(['a', 'b']);
  });

  it('reads the bare array earlier versions exported', () => {
    expect(parseChatFile(JSON.stringify(records))).toMatchObject({ ok: true });
  });

  it('skips lines that are not records and counts them', () => {
    const parsed = parseChatFile(JSON.stringify([records[0], { nope: 1 }, { ...records[1], timestamp: 'x' }]));
    expect(parsed).toMatchObject({ ok: true, skipped: 2 });
  });

  it('fills a missing meeting name', () => {
    const { meetingName: _drop, ...bare } = records[0];
    const parsed = parseChatFile(JSON.stringify([bare]));
    expect(parsed.ok && parsed.records[0].meetingName).toBe('');
  });

  it('says why a file is not usable', () => {
    expect(parseChatFile('not json')).toEqual({ ok: false, reason: 'not_json' });
    expect(parseChatFile('{"a":1}')).toEqual({ ok: false, reason: 'no_records' });
    expect(parseChatFile('[{"x":1}]')).toEqual({ ok: false, reason: 'no_records' });
    expect(parseChatFile('[]')).toEqual({ ok: false, reason: 'no_records' });
  });
});

describe('summarizeImport', () => {
  const incoming = [line('a', '2026-09-01T09:00:00'), line('b', '2026-09-01T10:00:00'), line('c', '2026-09-02T09:00:00')];

  it('counts per day, which lines are new here, and how much is already here', () => {
    expect(summarizeImport(incoming, [line('a', '2026-09-01T09:00:00')])).toEqual({
      total: 3,
      newCount: 2,
      touchesExistingDays: true,
      days: [
        { date: '2026-09-01', count: 2, newCount: 1, localCount: 1 },
        { date: '2026-09-02', count: 1, newCount: 1, localCount: 0 },
      ],
    });
  });

  it('counts a day as existing even when none of its lines are the same', () => {
    const summary = summarizeImport(incoming, [line('other', '2026-09-02T15:00:00')]);
    expect(summary.newCount).toBe(3);
    expect(summary.touchesExistingDays).toBe(true);
  });

  it('is not touching anything when the days are all new', () => {
    expect(summarizeImport(incoming, [line('x', '2026-08-01T09:00:00')]).touchesExistingDays).toBe(false);
  });
});

describe('toChatText', () => {
  it('writes one block per day and meeting, in time order', () => {
    const text = toChatText([line('b', '2026-09-01T10:00:00', { talkContent: 'Second' }), line('a', '2026-09-01T09:00:00', { talkContent: 'First' }), line('c', '2026-09-02T09:00:00', { meetingName: 'Other' })]);
    expect(text.indexOf('First')).toBeLessThan(text.indexOf('Second'));
    expect(text).toContain('Meeting: Sync\nDate: 2026-09-01');
    expect(text).toContain('Meeting: Other\nDate: 2026-09-02');
    expect(text).toContain('[09:00:00] Ann: First');
  });
});
