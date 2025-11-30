import dayjs from "dayjs";
import { GoogleDriveService } from "~utils/google-drive";
import { StorageFactory } from "~background/data-persistence/storage-factory";
import { messageCenter } from "./data-persistence";
import type { Transcript } from "~hooks/useTranscripts";

/**
 * 浏览器启动时自动同步服务
 * 负责在浏览器启动时检查并同步最近5天的数据
 * 逻辑：只检查本地是否有该日期的记录，有就跳过，没有就从 Google Drive 下载
 */
export class BrowserStartupSyncService {
    private static instance: BrowserStartupSyncService;
    private storage = StorageFactory.getInstance().getProvider();
    private driveService = GoogleDriveService.getInstance();

    private constructor() {}

    static getInstance(): BrowserStartupSyncService {
        if (!BrowserStartupSyncService.instance) {
            BrowserStartupSyncService.instance = new BrowserStartupSyncService();
        }
        return BrowserStartupSyncService.instance;
    }

    /**
     * 初始化浏览器启动监听器
     */
    initStartupListener(): void {
        chrome.runtime.onStartup.addListener(async () => {
            console.log('浏览器启动，检查自动同步设置...');
            
            // 检查用户是否启用了浏览器启动时自动同步
            chrome.storage.sync.get(['autoSyncOnStartup'], async (result) => {
                const isEnabled = result.autoSyncOnStartup === true;
                
                if (isEnabled) {
                    console.log('浏览器启动自动同步已启用，开始同步最近5天的数据...');
                    await this.syncRecentData();
                } else {
                    console.log('浏览器启动自动同步未启用，跳过同步');
                }
            });
        });

        console.log('浏览器启动监听器已初始化');
    }

    /**
     * 同步最近5天的数据
     */
    async syncRecentData(): Promise<void> {
        try {
            // 1. 获取最近5天的日期
            const today = dayjs();
            const datesToSync: string[] = [];
            for (let i = 0; i < 5; i++) {
                datesToSync.push(today.subtract(i, 'day').format('YYYY-MM-DD'));
            }

            console.log('需要检查的日期:', datesToSync);

            // 2. 检查 Google Drive 认证状态（非交互式）
            const authenticated = await this.driveService.authenticate(false);
            if (!authenticated) {
                console.log('Google Drive 未授权，跳过自动同步');
                return;
            }

            // 3. 获取本地已有数据的日期
            const localDays = await this.storage.getDaysWithMessages();
            console.log('本地已有数据的日期:', localDays);

            // 4. 获取 Google Drive 上的文件列表
            const driveFiles = await this.driveService.listBackupFiles();
            console.log('Google Drive 文件数量:', driveFiles.length);

            // 5. 检查每个日期的数据
            for (const date of datesToSync) {
                await this.syncDateIfNeeded(date, localDays, driveFiles);
            }

            console.log('浏览器启动同步完成');
        } catch (error) {
            console.error('浏览器启动同步失败:', error);
        }
    }

    /**
     * 检查并同步指定日期的数据
     * 简化逻辑：只检查本地是否有该日期的记录，有就跳过，没有就下载
     */
    private async syncDateIfNeeded(
        date: string,
        localDays: string[],
        driveFiles: any[]
    ): Promise<void> {
        try {
            // 1. 检查本地是否已有该日期的数据
            const hasLocalData = localDays.includes(date);

            if (hasLocalData) {
                console.log(`${date}: 本地已有数据，跳过同步`);
                return;
            }

            // 2. 查找 Google Drive 上对应的文件
            const fileName = `${date}.json`;
            const driveFile = driveFiles.find(f => f.name === fileName);

            if (!driveFile) {
                console.log(`${date}: Google Drive 上没有备份文件，跳过`);
                return;
            }

            // 3. 本地没有数据，从 Google Drive 下载
            console.log(`${date}: 本地无数据，开始从 Google Drive 下载...`);
            await this.downloadAndRestoreData(date, driveFile.id);
        } catch (error) {
            console.error(`同步 ${date} 数据时出错:`, error);
        }
    }

    /**
     * 从 Google Drive 下载并恢复数据
     */
    private async downloadAndRestoreData(date: string, fileId: string): Promise<void> {
        try {
            // 1. 下载文件内容
            const fileContent = await this.driveService.downloadFile(fileId);
            
            // 2. 验证数据格式
            if (!Array.isArray(fileContent)) {
                console.error(`${date}: 下载的数据格式不正确`);
                return;
            }

            const records = fileContent as Transcript[];
            console.log(`${date}: 下载了 ${records.length} 条记录`);

            // 3. 恢复数据到本地存储
            await messageCenter.handleMessage({
                action: 'restoreRecords',
                data: records,
                date: date
            });

            console.log(`${date}: 数据恢复成功`);
        } catch (error) {
            console.error(`${date}: 下载并恢复数据失败:`, error);
        }
    }

    /**
     * 手动触发同步（用于测试或手动调用）
     */
    async manualSync(): Promise<void> {
        console.log('手动触发浏览器启动同步...');
        await this.syncRecentData();
    }
}

/**
 * 初始化浏览器启动同步服务
 */
export function initBrowserStartupSync(): void {
    const syncService = BrowserStartupSyncService.getInstance();
    syncService.initStartupListener();
    console.log('浏览器启动同步服务已初始化');
}
