import dayjs from 'dayjs';
import type { Transcript } from '~hooks/useTranscripts';

/** The file written by "export": the records, with enough around them to recognise the file and change it later. */
export const CHAT_FILE_FORMAT = 'smart-meet-chat';
export const CHAT_FILE_VERSION = 1;

export interface ChatFile {
  format: typeof CHAT_FILE_FORMAT;
  version: typeof CHAT_FILE_VERSION;
  exportedAt: number;
  records: Transcript[];
}

export const buildChatFile = (records: Transcript[], now: number): ChatFile => ({
  format: CHAT_FILE_FORMAT,
  version: CHAT_FILE_VERSION,
  exportedAt: now,
  records,
});

export type ParseResult =
  | { ok: true; records: Transcript[]; skipped: number }
  | { ok: false; reason: 'not_json' | 'no_records' };

const isRecord = (item: unknown): item is Transcript => {
  if (!item || typeof item !== 'object') return false;
  const r = item as Record<string, unknown>;
  return typeof r.session === 'string' && r.session !== '' && typeof r.timestamp === 'number' && Number.isFinite(r.timestamp)
    && typeof r.talkContent === 'string' && typeof r.activeSpeaker === 'string';
};

/**
 * Reads a file someone gave us: the current format, or the bare array that earlier versions exported.
 * Lines that are not records are skipped and counted, so one bad line does not lose the rest.
 */
export const parseChatFile = (text: string): ParseResult => {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: 'not_json' };
  }
  const items = Array.isArray(data) ? data : data && typeof data === 'object' && Array.isArray((data as ChatFile).records) ? (data as ChatFile).records : null;
  if (!items) return { ok: false, reason: 'no_records' };

  const records = items.filter(isRecord).map((record) => ({ ...record, meetingName: typeof record.meetingName === 'string' ? record.meetingName : '' }));
  if (records.length === 0) return { ok: false, reason: 'no_records' };
  return { ok: true, records: records.sort((a, b) => a.timestamp - b.timestamp), skipped: items.length - records.length };
};

export interface ImportDay {
  date: string;
  count: number;
  /** Lines of that day this device does not have yet. */
  newCount: number;
  /** Lines this device already has for that day, whoever they came from. */
  localCount: number;
}

export interface ImportSummary {
  total: number;
  newCount: number;
  days: ImportDay[];
  /** Some day in the file already has lines here, so replacing it would drop them. */
  touchesExistingDays: boolean;
}

/** What importing would do, given the lines already here. */
export const summarizeImport = (incoming: Transcript[], local: Transcript[]): ImportSummary => {
  const dayOf = (record: Transcript) => dayjs(record.timestamp).format('YYYY-MM-DD');
  const localSessions = new Set(local.map((record) => record.session));
  const localPerDay = new Map<string, number>();
  for (const record of local) localPerDay.set(dayOf(record), (localPerDay.get(dayOf(record)) ?? 0) + 1);

  const days = new Map<string, ImportDay>();
  let newCount = 0;
  for (const record of incoming) {
    const date = dayOf(record);
    const day = days.get(date) ?? { date, count: 0, newCount: 0, localCount: localPerDay.get(date) ?? 0 };
    day.count += 1;
    if (!localSessions.has(record.session)) {
      day.newCount += 1;
      newCount += 1;
    }
    days.set(date, day);
  }
  const list = [...days.values()].sort((a, b) => a.date.localeCompare(b.date));
  return { total: incoming.length, newCount, days: list, touchesExistingDays: list.some((day) => day.localCount > 0) };
};

/** The same meetings as readable text: one block per day and meeting. */
export const toChatText = (records: Transcript[]): string => {
  const blocks = new Map<string, Transcript[]>();
  for (const record of [...records].sort((a, b) => a.timestamp - b.timestamp)) {
    const key = `${dayjs(record.timestamp).format('YYYY-MM-DD')}\n${record.meetingName || ''}`;
    blocks.set(key, [...(blocks.get(key) ?? []), record]);
  }
  return [...blocks]
    .map(([key, lines]) => {
      const [date, meeting] = key.split('\n');
      const body = lines.map((line) => `[${dayjs(line.timestamp).format('HH:mm:ss')}] ${line.activeSpeaker || 'Unknown'}: ${line.talkContent || '(no content)'}`).join('\n\n');
      return `Meeting: ${meeting || '-'}\nDate: ${date}\n\n${body}\n`;
    })
    .join('\n');
};
