import type { StorageProvider } from './types';
import type { Transcript } from '../hooks/useTranscripts';
import { StorageError } from './types';
import dayjs, { Dayjs } from 'dayjs';
import { IndexedDBProvider } from './indexed-db-provider';

export class MemoryStorageProvider implements StorageProvider {
    private memoryCache: Map<string, Transcript[]>;
    private indexedDBProvider: IndexedDBProvider;
    private syncTimeout: NodeJS.Timeout | null = null;
    private readonly SYNC_DELAY = 1000; // 1秒后同步到持久化存储
    private currentDate: Dayjs;
    private changedRecords: Set<string> = new Set(); // 跟踪修改过的记录

    constructor(date: Dayjs = dayjs()) {
        this.memoryCache = new Map();
        this.indexedDBProvider = new IndexedDBProvider();
        this.currentDate = date;
        this.initializeFromStorage();
    }

    private async initializeFromStorage(): Promise<void> {
        try {
            const records = await this.indexedDBProvider.getRecords(this.currentDate);
            const dateKey = this.currentDate.format('YYYY-MM-DD');
            this.memoryCache.set(dateKey, records.sort((a, b) => a.timestamp - b.timestamp));
            this.changedRecords.clear(); // 清除变更记录
        } catch (error) {
            console.error('Failed to initialize from storage:', error);
        }
    }

    private schedulePersist(): void {
        if (this.syncTimeout) {
            clearTimeout(this.syncTimeout);
        }

        this.syncTimeout = setTimeout(() => {
            this.persistToStorage();
        }, this.SYNC_DELAY);
    }

    private async persistToStorage(): Promise<void> {
        try {
            const dateKey = this.currentDate.format('YYYY-MM-DD');
            const records = this.memoryCache.get(dateKey) || [];
            
            if (this.changedRecords.size > 0) {
                // 只更新发生变化的记录
                const changedRecords = records.filter(record => 
                    this.changedRecords.has(record.session)
                );
                
                if (changedRecords.length > 0) {
                    await this.indexedDBProvider.addOrUpdateRecords(changedRecords);
                }
                
                this.changedRecords.clear(); // 清除变更记录
            }
        } catch (error) {
            console.error('Failed to persist to storage:', error);
        }
    }

    async addOrUpdateRecord(record: Transcript): Promise<void> {
        const dateKey = this.currentDate.format('YYYY-MM-DD');
        const dateRecords = this.memoryCache.get(dateKey) || [];
        
        const index = dateRecords.findIndex(r => r.session === record.session);
        if (index !== -1) {
            dateRecords[index] = record;
        } else {
            dateRecords.push(record);
        }

        this.memoryCache.set(dateKey, dateRecords);
        this.changedRecords.add(record.session); // 记录变更
        this.schedulePersist();
    }

    async getRecords(date?: Dayjs): Promise<Transcript[]> {
        // 如果没有提供日期，使用当前设置的日期
        const targetDate = date || this.currentDate;
        const dateKey = targetDate.format('YYYY-MM-DD');
        
        // 如果请求的不是当前日期的数据，直接从数据库获取
        if (!this.currentDate.isSame(targetDate, 'day')) {
            return this.indexedDBProvider.getRecords(targetDate);
        }
        
        return this.memoryCache.get(dateKey) || [];
    }

    async deleteRecords(date?: Dayjs): Promise<void> {
        if (!date) {
            // 清除所有记录
            this.memoryCache.clear();
            this.changedRecords.clear();
            await this.indexedDBProvider.deleteRecords();
        } else {
            // 如果是当前日期，清除缓存
            if (this.currentDate.isSame(date, 'day')) {
                const dateKey = date.format('YYYY-MM-DD');
                this.memoryCache.delete(dateKey);
                this.changedRecords.clear();
            }
            await this.indexedDBProvider.deleteRecords(date);
        }
    }

    async setCurrentDate(date: Dayjs): Promise<void> {
        // 切换日期前，确保当前的更改已保存
        if (this.changedRecords.size > 0) {
            await this.persistToStorage();
        }
        this.currentDate = date;
        await this.initializeFromStorage();
    }

    getCurrentDate(): Dayjs {
        return this.currentDate;
    }

    // 添加数据监听
    onRecordsChanged(callback: (records: Transcript[]) => void): void {
    }
}