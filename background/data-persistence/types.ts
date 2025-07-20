import type { Transcript } from '../../hooks/useTranscripts';
import type { Dayjs } from 'dayjs';

export interface StorageProvider {
    addOrUpdateRecord(_record: Transcript, _successCallback?: () => void): Promise<void>;
    getRecords(_date?: Dayjs): Promise<Transcript[]>;
    deleteRecords(_date?: Dayjs): Promise<void>;
    restoreRecords(_records: Transcript[], _date?: Dayjs): Promise<void>;
    getDaysWithMessages(): Promise<string[]>;
    setCurrentDate(_date: Dayjs): Promise<void>;
}

export interface StorageOptions {
    storageType: 'memory-storage';
    dbName?: string; // for indexedDB
    storeName?: string; // for indexedDB
    storageKey?: string; // for chrome.storage
}

export class StorageError extends Error {
    constructor(message: string, public _originalError?: Error) {
        super(message);
        this.name = 'StorageError';
    }
}
