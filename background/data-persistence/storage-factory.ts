import type { StorageProvider, StorageOptions } from './types';
import { MemoryStorageProvider } from './memory-storage-provider';
import { IndexedDBProvider } from './indexed-db-provider';

export class StorageFactory {
    private static instance: StorageFactory;
    private provider: StorageProvider | null = null;

    private constructor() {}

    static getInstance(): StorageFactory {
        if (!StorageFactory.instance) {
            StorageFactory.instance = new StorageFactory();
            StorageFactory.instance.initializeStorage({ storageType: 'memory-storage' });
        }
        return StorageFactory.instance;
    }

    initializeStorage(options: StorageOptions): StorageProvider {
        if (this.provider) {
            return this.provider;
        }

        switch (options.storageType) {
            case 'memory-storage':
                this.provider = new MemoryStorageProvider();
                break;
            default:
                throw new Error(`Unsupported storage type: ${options.storageType}`);
        }

        return this.provider;
    }

    getProvider(): StorageProvider {
        if (!this.provider) {
            throw new Error('Storage provider not initialized. Call initializeStorage first.');
        }
        return this.provider;
    }
} 