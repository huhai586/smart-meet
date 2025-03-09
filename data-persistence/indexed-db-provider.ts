import type { StorageProvider } from './types';
import type { Transcript } from '../hooks/useTranscripts';
import { StorageError } from './types';
import dayjs, { Dayjs } from 'dayjs';

export class IndexedDBProvider implements StorageProvider {
    private dbName: string;
    private storeName: string;
    private db: IDBDatabase | null = null;

    constructor(dbName: string = 'chatRecords', storeName: string = 'transcripts') {
        this.dbName = dbName;
        this.storeName = storeName;
    }

    private async initDB(): Promise<void> {
        if (this.db) return;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, 1);

            request.onerror = () => {
                reject(new StorageError('Failed to open database'));
            };

            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(this.storeName)) {
                    const store = db.createObjectStore(this.storeName, { keyPath: 'session' });
                    // 创建时间戳索引
                    store.createIndex('timestamp', 'timestamp');
                }
            };
        });
    }

    private async getStore(mode: IDBTransactionMode = 'readonly'): Promise<IDBObjectStore> {
        await this.initDB();
        const transaction = this.db!.transaction(this.storeName, mode);
        return transaction.objectStore(this.storeName);
    }

    async addOrUpdateRecord(record: Transcript): Promise<void> {
        try {
            const store = await this.getStore('readwrite');
            return new Promise((resolve, reject) => {
                const request = store.put(record);
                request.onerror = () => reject(new StorageError('Failed to add or update record'));
                request.onsuccess = () => resolve();
            });
        } catch (error) {
            throw new StorageError('Failed to add or update record', error as Error);
        }
    }

    async getRecords(date?: Dayjs): Promise<Transcript[]> {
        try {
            const store = await this.getStore('readonly');
            const targetDate = date || dayjs();
            
            // 计算目标日期的起始和结束时间戳
            const startTimestamp = targetDate.startOf('day').valueOf();
            const endTimestamp = targetDate.endOf('day').valueOf();

            return new Promise((resolve, reject) => {
                // 使用时间戳索引
                const index = store.index('timestamp');
                // 创建时间范围
                const range = IDBKeyRange.bound(startTimestamp, endTimestamp);
                // 使用范围查询
                const request = index.getAll(range);

                request.onerror = () => reject(new StorageError('Failed to get records'));
                request.onsuccess = () => {
                    resolve(request.result as Transcript[] || []);
                };
            });
        } catch (error) {
            throw new StorageError('Failed to get records', error as Error);
        }
    }

    async deleteRecords(date?: Dayjs): Promise<void> {
        try {
            const store = await this.getStore('readwrite');
            if (!date) {
                // 如果没有指定日期，清空所有记录
                return new Promise((resolve, reject) => {
                    const request = store.clear();
                    request.onerror = () => reject(new StorageError('Failed to clear records'));
                    request.onsuccess = () => resolve();
                });
            }

            // 使用时间戳索引和范围删除指定日期的记录
            const startTimestamp = date.startOf('day').valueOf();
            const endTimestamp = date.endOf('day').valueOf();

            return new Promise((resolve, reject) => {
                const index = store.index('timestamp');
                const range = IDBKeyRange.bound(startTimestamp, endTimestamp);
                const request = index.openCursor(range);

                request.onerror = () => reject(new StorageError('Failed to delete records'));
                request.onsuccess = (event) => {
                    const cursor = (event.target as IDBRequest).result;
                    if (cursor) {
                        cursor.delete();  // 删除当前记录
                        cursor.continue(); // 移动到下一条记录
                    } else {
                        resolve(); // 所有记录都已处理完
                    }
                };
            });
        } catch (error) {
            throw new StorageError('Failed to delete records', error as Error);
        }
    }

    async addOrUpdateRecords(records: Transcript[]): Promise<void> {
        try {
            const store = await this.getStore('readwrite');
            return new Promise((resolve, reject) => {
                const transaction = store.transaction;
                
                transaction.oncomplete = () => resolve();
                transaction.onerror = () => reject(new StorageError('Failed to batch update records'));

                // 在同一个事务中批量添加记录
                records.forEach(record => {
                    store.put(record);
                });
            });
        } catch (error) {
            throw new StorageError('Failed to batch update records', error as Error);
        }
    }

    private isSameDay(date1: Dayjs, date2: Dayjs): boolean {
        return date1.format('YYYY-MM-DD') === date2.format('YYYY-MM-DD');
    }
} 