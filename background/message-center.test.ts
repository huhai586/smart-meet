import { beforeEach, describe, expect, it, vi } from 'vitest';
import dayjs from 'dayjs';
import type { StorageProvider } from './data-persistence/types';
import type { Transcript } from '../hooks/useTranscripts';

const dependencies = vi.hoisted(() => ({
  storage: {
    addOrUpdateRecord: vi.fn(),
    getRecords: vi.fn(),
    deleteRecords: vi.fn(),
    restoreRecords: vi.fn(),
    addOrUpdateRecords: vi.fn(),
    getDaysWithMessages: vi.fn(),
    setCurrentDate: vi.fn(),
    getCurrentDate: vi.fn(),
    onRecordsChanged: vi.fn(),
  },
  handleSyncRequest: vi.fn(),
  broadcastLanguageChange: vi.fn(),
}));

vi.mock('~background/data-persistence/storage-factory', () => ({
  StorageFactory: {
    getInstance: () => ({ getProvider: () => dependencies.storage }),
  },
}));
vi.mock('./sync-manager', () => ({ handleSyncRequest: dependencies.handleSyncRequest }));
vi.mock('./utils/language-utils', () => ({ broadcastLanguageChange: dependencies.broadcastLanguageChange }));

import { BackgroundMessageHandler } from './message-center';

function record(session = 'session-1'): Transcript {
  return { session, timestamp: dayjs('2026-09-01T09:00:00').valueOf(), meetingName: 'Test meeting' } as Transcript;
}

let sendMessage: ReturnType<typeof vi.fn>;
let localSet: ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.useFakeTimers();
  Object.values(dependencies.storage).forEach((mock) => mock.mockReset());
  dependencies.storage.getDaysWithMessages.mockResolvedValue(['2026-09-01']);
  dependencies.storage.getRecords.mockResolvedValue([record()]);
  dependencies.storage.deleteRecords.mockResolvedValue(undefined);
  dependencies.storage.addOrUpdateRecord.mockResolvedValue(undefined);
  dependencies.storage.restoreRecords.mockResolvedValue(undefined);
  dependencies.storage.setCurrentDate.mockResolvedValue(undefined);
  dependencies.handleSyncRequest.mockReset();
  dependencies.broadcastLanguageChange.mockReset();

  sendMessage = vi.fn();
  localSet = vi.fn();
  vi.stubGlobal('chrome', {
    runtime: { sendMessage },
    storage: { local: { set: localSet } },
  });
});

function handler(): BackgroundMessageHandler {
  return new BackgroundMessageHandler(dependencies.storage as unknown as StorageProvider);
}

describe('BackgroundMessageHandler', () => {
  it('ignores messages outside the handler contract', async () => {
    await expect(handler().handleMessage(
      { action: 'unknown' } as unknown as Parameters<BackgroundMessageHandler['handleMessage']>[0],
      {},
      vi.fn(),
    )).resolves.toBe(false);
  });

  it('clears storage and notifies transcript and calendar consumers', async () => {
    const respond = vi.fn();
    await handler().handleMessage({ action: 'clear' }, {}, respond);

    expect(dependencies.storage.deleteRecords).toHaveBeenCalledWith();
    expect(sendMessage).toHaveBeenCalledWith({ action: 'transcripts-updated', data: undefined });
    expect(sendMessage).toHaveBeenCalledWith({ action: 'days-with-messages', data: ['2026-09-01'] });
    expect(respond).toHaveBeenCalledWith({ success: true });
  });

  it('persists and incrementally broadcasts a transcript update', async () => {
    const data = record();
    const respond = vi.fn();
    await handler().handleMessage({ action: 'addOrUpdateRecords', data }, {}, respond);

    expect(dependencies.storage.addOrUpdateRecord).toHaveBeenCalledWith(data);
    expect(sendMessage).toHaveBeenCalledWith({ action: 'transcripts-updated', data });
    expect(respond).toHaveBeenCalledWith({ success: true });
  });

  it('returns transcripts for the requested date', async () => {
    const respond = vi.fn();
    await handler().handleMessage({ action: 'get-transcripts', date: '2026-09-01' }, {}, respond);

    expect(dependencies.storage.getRecords).toHaveBeenCalledWith(expect.objectContaining({
      format: expect.any(Function),
    }));
    expect(respond).toHaveBeenCalledWith([record()]);
  });

  it('deletes a day and broadcasts reliable reload signals', async () => {
    const respond = vi.fn();
    await handler().handleMessage({ action: 'delete-records', date: '2026-09-01' }, {}, respond);

    expect(dependencies.storage.deleteRecords).toHaveBeenCalledWith(expect.objectContaining({
      format: expect.any(Function),
    }));
    expect(localSet).toHaveBeenCalledWith(expect.objectContaining({ _recordsDeletedDate: '2026-09-01' }));
    expect(sendMessage).toHaveBeenCalledWith({ action: 'records-deleted', date: '2026-09-01' });
    expect(respond).toHaveBeenCalledWith({ success: true });
  });

  it('restores a selected date, makes it current, and requests navigation', async () => {
    const respond = vi.fn();
    const data = [record()];
    await handler().handleMessage({ action: 'restoreRecords', data, date: '2026-09-01' }, {}, respond);
    await vi.advanceTimersByTimeAsync(500);

    expect(dependencies.storage.restoreRecords).toHaveBeenCalledWith(data, expect.objectContaining({
      format: expect.any(Function),
    }));
    expect(dependencies.storage.setCurrentDate).toHaveBeenCalled();
    expect(sendMessage).toHaveBeenCalledWith(expect.objectContaining({ action: 'jump-to-date' }));
    expect(respond).toHaveBeenCalledWith({ success: true });
  });

  it('delegates language and drive-sync messages to their dedicated services', async () => {
    const respond = vi.fn();
    await handler().handleMessage({ action: 'languageChanged', languageCode: 'ja' }, {}, respond);
    await handler().handleMessage({ action: 'sync-to-google-drive', date: '2026-09-01' }, {}, respond);

    expect(dependencies.broadcastLanguageChange).toHaveBeenCalledWith('ja');
    expect(dependencies.handleSyncRequest).toHaveBeenCalledWith(
      { action: 'sync-to-google-drive', date: '2026-09-01' },
      respond,
    );
  });

  it('turns storage failures into a safe response', async () => {
    dependencies.storage.addOrUpdateRecord.mockRejectedValue(new Error('storage unavailable'));
    const respond = vi.fn();

    await handler().handleMessage({ action: 'addOrUpdateRecords', data: record() }, {}, respond);

    expect(respond).toHaveBeenCalledWith({ success: false, error: 'Failed to process request' });
  });
});
