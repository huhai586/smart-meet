import { beforeEach, describe, expect, it, vi } from 'vitest';
import dayjs from 'dayjs';
import type { Transcript } from '../../hooks/useTranscripts';

const indexedDb = vi.hoisted(() => ({
  getRecords: vi.fn(),
  addOrUpdateRecords: vi.fn(),
  deleteRecords: vi.fn(),
  getDaysWithMessages: vi.fn(),
}));

vi.mock('./indexed-db-provider', () => ({
  IndexedDBProvider: class {
    getRecords = indexedDb.getRecords;
    addOrUpdateRecords = indexedDb.addOrUpdateRecords;
    deleteRecords = indexedDb.deleteRecords;
    getDaysWithMessages = indexedDb.getDaysWithMessages;
  },
}));

import { MemoryStorageProvider } from './memory-storage-provider';

function record(session: string, timestamp: string): Transcript {
  return {
    session,
    timestamp: dayjs(timestamp).valueOf(),
    meetingName: 'Test meeting',
  } as Transcript;
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
}

beforeEach(() => {
  vi.useFakeTimers();
  indexedDb.getRecords.mockReset();
  indexedDb.addOrUpdateRecords.mockReset();
  indexedDb.deleteRecords.mockReset();
  indexedDb.getDaysWithMessages.mockReset();
  indexedDb.getRecords.mockResolvedValue([]);
  indexedDb.addOrUpdateRecords.mockResolvedValue(undefined);
  indexedDb.deleteRecords.mockResolvedValue(undefined);
});

describe('MemoryStorageProvider', () => {
  it('upserts records in memory and persists only the final version after the debounce', async () => {
    const provider = new MemoryStorageProvider(dayjs('2026-09-01'));
    await flushPromises();

    await provider.addOrUpdateRecord(record('session-1', '2026-09-01T09:00:00'));
    await provider.addOrUpdateRecord({
      ...record('session-1', '2026-09-01T10:00:00'),
      meetingName: 'Updated meeting',
    });

    await expect(provider.getRecords(dayjs('2026-09-01'))).resolves.toEqual([
      expect.objectContaining({ session: 'session-1', meetingName: 'Updated meeting' }),
    ]);

    await vi.advanceTimersByTimeAsync(6000);
    expect(indexedDb.addOrUpdateRecords).toHaveBeenCalledWith([
      expect.objectContaining({ session: 'session-1', meetingName: 'Updated meeting' }),
    ]);
  });

  it('removes cached records for any deleted date, not only the current date', async () => {
    const provider = new MemoryStorageProvider(dayjs('2026-09-01'));
    await flushPromises();
    await provider.addOrUpdateRecord(record('session-on-other-day', '2026-09-02T09:00:00'));

    await provider.deleteRecords(dayjs('2026-09-02'));

    await expect(provider.getRecords(dayjs('2026-09-02'))).resolves.toEqual([]);
    expect(indexedDb.deleteRecords).toHaveBeenCalledWith(expect.anything());
  });

  it('persists pending records before switching the current date and loads the new date', async () => {
    indexedDb.getRecords
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([record('loaded-record', '2026-09-02T09:00:00')]);
    const provider = new MemoryStorageProvider(dayjs('2026-09-01'));
    await flushPromises();
    await provider.addOrUpdateRecord(record('pending-record', '2026-09-01T09:00:00'));

    await provider.setCurrentDate(dayjs('2026-09-02'));

    expect(indexedDb.addOrUpdateRecords).toHaveBeenCalledWith([
      expect.objectContaining({ session: 'pending-record' }),
    ]);
    await expect(provider.getRecords(dayjs('2026-09-02'))).resolves.toEqual([
      expect.objectContaining({ session: 'loaded-record' }),
    ]);
  });

  it('delegates restore-all and days-with-messages to persistent storage', async () => {
    const provider = new MemoryStorageProvider(dayjs('2026-09-01'));
    await flushPromises();
    const records = [record('restored-record', '2026-09-01T09:00:00')];
    indexedDb.getRecords.mockResolvedValue(records);
    indexedDb.getDaysWithMessages.mockResolvedValue(['2026-09-01']);

    await provider.restoreRecords(records);

    expect(indexedDb.deleteRecords).toHaveBeenCalledWith();
    expect(indexedDb.addOrUpdateRecords).toHaveBeenCalledWith(records);
    await expect(provider.getDaysWithMessages()).resolves.toEqual(['2026-09-01']);
  });
});
