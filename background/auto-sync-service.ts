import { messageCenter } from "./data-persistence";
import { GoogleDriveService } from "~utils/google-drive";
import { createJsonFile, createDateFileName } from "~utils/file-utils";
import type { Transcript } from "~hooks/useTranscripts";

/**
 * 自动同步服务，负责将会议数据同步到Google Drive
 */
export const autoSyncService = {
    /**
     * 自动同步指定日期的会议数据到Google Drive
     * @param date 日期，格式为YYYY-MM-DD
     * @returns 同步是否成功
     */
    autoSync: async function(date: string): Promise<boolean> {
        try {
            console.log(`开始同步 ${date} 的会议数据到Google Drive`);

            // 1. 获取需要同步的会议数据
            const meetingData = await this.getMeetingData(date);
            if (!meetingData || (Array.isArray(meetingData) && meetingData.length === 0)) {
                console.warn(`没有找到 ${date} 的会议数据或数据为空`);
                return false;
            }

            // 记录消息数量（用于日志）
            const messageCount = Array.isArray(meetingData) ? meetingData.length :
                (typeof meetingData === 'object' ? Object.keys(meetingData).length : 0);
            console.log(`需要同步 ${messageCount} 条消息记录`);

            // 2. 获取 Google Drive 服务实例
            const driveService = GoogleDriveService.getInstance();

            // 3. 确保已认证（使用非交互式方式，避免在后台同步时打扰用户）
            const authenticated = await driveService.authenticate(false);
            if (!authenticated) {
                console.error('Google Drive 认证失败，可能需要用户先在选项页中进行授权');
                return false;
            }

            // 4. 使用工具函数创建标准文件名和文件对象
            const fileName = createDateFileName(date);
            const file = createJsonFile(meetingData, fileName, { pretty: true });

            // 5. 上传文件到 Google Drive
            try {
                // 获取备份文件夹
                const folder = await driveService.getBackupFolder();
                if (!folder) {
                    console.error('无法获取或创建备份文件夹');
                    return false;
                }

                // 查找是否已存在同名文件
                const files = await driveService.listBackupFiles();
                const existingFile = files.find(f => f.name === fileName);

                // 上传文件（如果存在，则更新；否则新建）
                const isUpdate = !!existingFile;
                console.log(`${isUpdate ? '更新' : '创建'}文件: ${fileName}`);

                const uploadResult = await driveService.uploadFile(
                    file,
                    isUpdate ? existingFile.id : undefined
                );

                if (uploadResult) {
                    console.log(`${date} 的会议数据同步成功，${messageCount} 条消息已保存`);

                } else {
                    console.error(`${date} 的会议数据同步失败`);
                }

                return uploadResult;
            } catch (error) {
                console.error('上传文件过程中出错:', error);
                return false;
            }
        } catch (error) {
            console.error('自动同步过程中发生错误:', error);
            return false;
        }
    },

    /**
     * 获取指定日期的会议数据
     * @param date 日期，格式为YYYY-MM-DD
     * @returns 会议数据对象
     */
    getMeetingData: async function(date: string): Promise<Transcript[]> {
        return messageCenter.handleMessage({
            action: 'get-transcripts-only',
            date: date
        });
    },
};
