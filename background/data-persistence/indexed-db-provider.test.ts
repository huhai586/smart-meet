import 'fake-indexeddb/auto';
import { afterEach, describe, expect, it } from 'vitest';
import dayjs from 'dayjs';
import { IndexedDBProvider } from './indexed-db-provider';
import type { Transcript } from '../../hooks/useTranscripts';

let databaseNumber = 0;
const databaseNames: string[] = [];
const providers: IndexedDBProvider[] = [];

function createProvider(): IndexedDBProvider {
  const name = `indexed-db-provider-test-${databaseNumber++}`;
  databaseNames.push(name);
  const provider = new IndexedDBProvider(name);
  providers.push(provider);
  return provider;
}

function record(session: string, timestamp: string): Transcript {
  return {
    session,
    timestamp: dayjs(timestamp).valueOf(),
    meetingName: 'Test meeting',
  } as Transcript;
}

afterEach(async () => {
  providers.splice(0).forEach((provider) => {
    (provider as unknown as { db: IDBDatabase | null }).db?.close();
  });
  await Promise.all(databaseNames.splice(0).map((name) => new Promise<void>((resolve) => {
    const request = indexedDB.deleteDatabase(name);
    request.onsuccess = () => resolve();
    request.onerror = () => resolve();
    request.onblocked = () => resolve();
  })));
});

describe('IndexedDBProvider', () => {
  it('stores records by session and reads only the requested day', async () => {
    const provider = createProvider();
    await provider.addOrUpdateRecords([
      record('session-1', '2026-09-01T09:00:00'),
      record('session-2', '2026-09-02T09:00:00'),
    ]);
    await provider.addOrUpdateRecord({
      ...record('session-1', '2026-09-01T10:00:00'),
      meetingName: 'Updated meeting',
    });

    await expect(provider.getRecords(dayjs('2026-09-01'))).resolves.toEqual([
      expect.objectContaining({ session: 'session-1', meetingName: 'Updated meeting' }),
    ]);
    await expect(provider.getRecords(dayjs('2026-09-02'))).resolves.toEqual([
      expect.objectContaining({ session: 'session-2' }),
    ]);
  });

  it('deletes a single day without affecting records from another day', async () => {
    const provider = createProvider();
    await provider.addOrUpdateRecords([
      record('session-1', '2026-09-01T09:00:00'),
      record('session-2', '2026-09-02T09:00:00'),
    ]);

    await provider.deleteRecords(dayjs('2026-09-01'));

    await expect(provider.getRecords(dayjs('2026-09-01'))).resolves.toEqual([]);
    await expect(provider.getRecords(dayjs('2026-09-02'))).resolves.toEqual([
      expect.objectContaining({ session: 'session-2' }),
    ]);
  });

  it('restores only records for the selected day after clearing that day', async () => {
    const provider = createProvider();
    await provider.addOrUpdateRecords([
      record('old-record', '2026-09-01T09:00:00'),
      record('other-day', '2026-09-02T09:00:00'),
    ]);

    await provider.restoreRecords([
      record('restored-record', '2026-09-01T11:00:00'),
      record('ignored-record', '2026-09-02T11:00:00'),
    ], dayjs('2026-09-01'));

    await expect(provider.getRecords(dayjs('2026-09-01'))).resolves.toEqual([
      expect.objectContaining({ session: 'restored-record' }),
    ]);
    await expect(provider.getRecords(dayjs('2026-09-02'))).resolves.toEqual([
      expect.objectContaining({ session: 'other-day' }),
    ]);
  });

  it('restores all records and reports the days containing messages', async () => {
    const provider = createProvider();
    await provider.addOrUpdateRecord(record('stale', '2026-09-03T09:00:00'));

    await provider.restoreRecords([
      record('session-1', '2026-09-01T09:00:00'),
      record('session-2', '2026-09-01T10:00:00'),
      record('session-3', '2026-09-02T09:00:00'),
    ]);

    await expect(provider.getDaysWithMessages()).resolves.toEqual(['2026-09-01', '2026-09-02']);
    await expect(provider.getRecords(dayjs('2026-09-03'))).resolves.toEqual([]);
  });

  it('clears every record when no date is supplied', async () => {
    const provider = createProvider();
    await provider.addOrUpdateRecords([
      record('session-1', '2026-09-01T09:00:00'),
      record('session-2', '2026-09-02T09:00:00'),
    ]);

    await provider.deleteRecords();

    await expect(provider.getDaysWithMessages()).resolves.toEqual([]);
  });
});
