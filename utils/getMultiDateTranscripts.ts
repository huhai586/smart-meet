import dayjs, { Dayjs } from 'dayjs';
import type { Transcript } from '~hooks/useTranscripts';

export interface MultiDateResult {
  transcripts: Transcript[];
  dateCount: number;
  totalRecords: number;
}

/**
 * Fetch transcripts for a date range (inclusive on both ends).
 * Enumerates each day and calls the background 'get-transcripts' message.
 */
export async function getMultiDateTranscripts(
  startDate: Dayjs,
  endDate: Dayjs,
): Promise<MultiDateResult> {
  const start = startDate.startOf('day');
  const end = endDate.startOf('day');

  if (end.isBefore(start)) {
    return { transcripts: [], dateCount: 0, totalRecords: 0 };
  }

  const all: Transcript[] = [];
  let current = start;

  while (!current.isAfter(end)) {
    try {
      const result = await chrome.runtime.sendMessage({
        action: 'get-transcripts',
        date: current,
      });
      if (Array.isArray(result)) {
        all.push(...result);
      }
    } catch {
      // ignore individual day failures
    }
    current = current.add(1, 'day');
  }

  all.sort((a, b) => a.timestamp - b.timestamp);

  return {
    transcripts: all,
    dateCount: end.diff(start, 'day') + 1,
    totalRecords: all.length,
  };
}

/**
 * Format transcripts into a system prompt context string for the AI.
 */
export function buildMeetingContext(
  transcripts: Transcript[],
  startDate: Dayjs,
  endDate: Dayjs,
): string {
  if (transcripts.length === 0) {
    return '（所选日期范围内没有会议记录）';
  }

  const header = `以下是 ${startDate.format('YYYY年M月D日')} 至 ${endDate.format('YYYY年M月D日')} 的会议记录（共 ${transcripts.length} 条）：\n\n`;

  const lines = transcripts.map(t => {
    const time = dayjs(t.timestamp).format('M月D日 HH:mm');
    const speaker = t.activeSpeaker ? `【${t.activeSpeaker}】` : '';
    return `[${time}] ${speaker} ${t.talkContent || ''}`;
  });

  return header + lines.join('\n');
}
