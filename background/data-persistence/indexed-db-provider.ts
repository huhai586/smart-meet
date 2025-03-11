import type { StorageProvider } from './types';
import type { Transcript } from '../../hooks/useTranscripts';
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
    async restoreRecords(records: Transcript[], date?: Dayjs): Promise<void> {
        try {
            const store = await this.getStore('readwrite');
            
            if (date) {
                // 如果指定了日期，只恢复该日期的记录
                const dateKey = date.format('YYYY-MM-DD');
                const dateRecords = records.filter(record => {
                    const recordDate = dayjs(record.timestamp).format('YYYY-MM-DD');
                    return recordDate === dateKey;
                });
                
                // 先删除该日期的现有记录
                await this.deleteRecords(date);
                
                // 添加新记录
                return new Promise((resolve, reject) => {
                    const transaction = store.transaction;
                    
                    transaction.oncomplete = () => resolve();
                    transaction.onerror = () => reject(new StorageError('Failed to restore records'));
                    
                    dateRecords.forEach(record => {
                        store.put(record);
                    });
                });
            } else {
                // 如果没有指定日期，恢复所有记录
                await this.deleteRecords(); // 清空所有记录
                
                return new Promise((resolve, reject) => {
                    const transaction = store.transaction;
                    
                    transaction.oncomplete = () => resolve();
                    transaction.onerror = () => reject(new StorageError('Failed to restore records'));
                    
                    records.forEach(record => {
                        store.put(record);
                    });
                });
            }
        } catch (error) {
            throw new StorageError('Failed to restore records', error as Error);
        }
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

    async getDaysWithMessages(): Promise<string[]> {
        try {
            const store = await this.getStore('readonly');
            return new Promise((resolve, reject) => {
                const request = store.index('timestamp').getAll();
                request.onerror = () => reject(new StorageError('Failed to get days with messages'));
                request.onsuccess = () => {
                    const records = request.result as Transcript[];
                    const uniqueDays = new Set<string>();

                    records.forEach(record => {
                        const date = dayjs(record.timestamp).format('YYYY-MM-DD');
                        uniqueDays.add(date);
                    });
                    
                    resolve(Array.from(uniqueDays));
                };
            });
        } catch (error) {
            throw new StorageError('Failed to get days with messages', error as Error);
        }
    }
    
    private isSameDay(date1: Dayjs, date2: Dayjs): boolean {
        return date1.format('YYYY-MM-DD') === date2.format('YYYY-MM-DD');
    }

    async setCurrentDate(date: Dayjs): Promise<void> {
        // IndexedDBProvider 不需要跟踪当前日期，这个方法是为了满足接口要求
        return Promise.resolve();
    }
} 