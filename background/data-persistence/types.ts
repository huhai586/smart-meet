import type { Transcript } from '../../hooks/useTranscripts';
import type { Dayjs } from 'dayjs';

export interface StorageProvider {
    addOrUpdateRecord(record: Transcript, successCallback?: () => void): Promise<void>;
    getRecords(date?: Dayjs): Promise<Transcript[]>;
    deleteRecords(date?: Dayjs): Promise<void>;
    restoreRecords(records: Transcript[], date?: Dayjs): Promise<void>;
    getDaysWithMessages(): Promise<string[]>;
    setCurrentDate(date: Dayjs): Promise<void>;
}

export interface StorageOptions {
    storageType: 'memory-storage';
    dbName?: string; // for indexedDB
    storeName?: string; // for indexedDB
    storageKey?: string; // for chrome.storage
}

export class StorageError extends Error {
    constructor(message: string, public originalError?: Error) {
        super(message);
        this.name = 'StorageError';
    }
} 