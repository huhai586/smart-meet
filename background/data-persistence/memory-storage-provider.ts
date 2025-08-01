import type { StorageProvider } from './types';
import type { Transcript } from '../../hooks/useTranscripts';
import dayjs, { Dayjs } from 'dayjs';
import { IndexedDBProvider } from './indexed-db-provider';

export class MemoryStorageProvider implements StorageProvider {
    private memoryCache: Map<string, Transcript[]>;
    private indexedDBProvider: IndexedDBProvider;
    private syncTimeout: NodeJS.Timeout | null = null;
    private readonly SYNC_DELAY = 6000; //6秒后同步到持久化存储
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

        const dataInMemory = this.memoryCache.get(dateKey) || [];
        if (dataInMemory.length > 0) {
            return dataInMemory;
        }
        return this.indexedDBProvider.getRecords(targetDate);

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
        console.log('MemoryStorageProvider.js', 'setCurrentDate', date)
        // 切换日期前，确保当前的更改已保存
        if (this.changedRecords.size > 0) {
            await this.persistToStorage();
        }
        this.currentDate = date;
        await this.initializeFromStorage();
    }

    async restoreRecords(records: Transcript[], date?: Dayjs): Promise<void> {
        try {
            if (date) {
                // 如果指定了日期，只恢复该日期的记录
                const dateKey = date.format('YYYY-MM-DD');
                const dateRecords = records.filter(record => {
                    const recordDate = dayjs(record.timestamp).format('YYYY-MM-DD');
                    return recordDate === dateKey;
                });

                // 删除该日期的现有记录
                await this.deleteRecords(date);

                // 添加新记录
                if (dateRecords.length > 0) {
                    await this.indexedDBProvider.addOrUpdateRecords(dateRecords);

                    // 如果是当前日期，更新内存缓存
                    if (this.currentDate.isSame(date, 'day')) {
                        this.memoryCache.set(dateKey, dateRecords);
                    }
                }
            } else {
                // 如果没有指定日期，恢复所有记录（原有行为）
                this.memoryCache.clear();
                await this.indexedDBProvider.deleteRecords();
                await this.indexedDBProvider.addOrUpdateRecords(records);
                await this.initializeFromStorage();
            }
        } catch (error) {
            console.error('Error restoring records:', error);
            throw error;
        }
    }

    async getDaysWithMessages() {
        return this.indexedDBProvider.getDaysWithMessages();
    }

    getCurrentDate(): Dayjs {
        return this.currentDate;
    }

    // 添加数据监听
    onRecordsChanged(): void {
    }
}
