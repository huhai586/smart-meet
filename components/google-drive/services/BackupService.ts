import { message } from 'antd';
import dayjs from 'dayjs';
import { GoogleDriveService } from "~utils/google-drive";
import { StorageFactory, StorageProvider } from "~background/data-persistence/storage-factory";
import type { SyncSummary, RestoreResult, ConflictData } from '../types';
import type { IGoogleDriveFileContent, IGoogleDriveService } from "~utils/types/google-drive.types"
import { createJsonFile } from '../../../utils/file-utils';
import type gapi from 'gapi';

/**
 * 备份服务，封装备份相关的方法
 */
export class BackupService {
  private driveService: IGoogleDriveService;
  private storage: StorageProvider;

  constructor() {
    this.driveService = GoogleDriveService.getInstance();
    this.storage = StorageFactory.getInstance().getProvider();
  }

  /**
   * 确保备份文件夹已加载
   */
  private async ensureBackupFolder(): Promise<void> {
    await this.driveService.getBackupFolder();
  }

  /**
   * 获取所有有消息的日期
   */
  private async getDatesWithMessages(): Promise<string[]> {
    return await this.storage.getDaysWithMessages();
  }

  /**
   * 获取备份文件列表
   */
  private async listBackupFiles(): Promise<gapi.client.drive.File[]> {
    return await this.driveService.listBackupFiles();
  }

  /**
   * 获取本地内容
   */
  private async getLocalContent(date: string): Promise<IGoogleDriveFileContent> {
    return await this.storage.getRecords(dayjs(date));
  }

  /**
   * 获取远程内容
   */
  private async getRemoteContent(fileId: string): Promise<IGoogleDriveFileContent> {
    return await this.driveService.downloadFile(fileId);
  }

  /**
   * 更新文件
   */
  private async updateFile(fileId: string, content: IGoogleDriveFileContent, fileName: string): Promise<void> {
    const file = createJsonFile(content, fileName);
    await this.driveService.uploadFile(file, fileId);
  }

  /**
   * 创建文件
   */
  private async createFile(fileName: string, content: IGoogleDriveFileContent): Promise<void> {
    const file = createJsonFile(content, fileName);
    await this.driveService.uploadFile(file);
  }

  /**
   * 上传文件到Google Drive
   */
  async uploadFile(file: File): Promise<boolean> {
    try {
      const content = await file.text();
      const _records = JSON.parse(content);
      const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})\.json/);

      if (!dateMatch) {
        message.error('Invalid file name format. Expected: YYYY-MM-DD.json');
        return false;
      }

      await this.driveService.uploadFile(file);
      message.success('File uploaded successfully');
      return true;
    } catch (error) {
      console.error('Error uploading file:', error);
      message.error('Failed to upload file. Please ensure it is a valid JSON file.');
      return false;
    }
  }

  /**
   * 删除Google Drive中的文件
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const success = await this.driveService.deleteFile(fileId);
      if (success) {
        message.success('File deleted successfully');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting file:', error);
      return false;
    }
  }

  /**
   * 恢复单个文件的记录
   */
  async restoreFile(fileId: string, fileName: string): Promise<RestoreResult> {
    try {
      const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})\.json/);
      if (!dateMatch) {
        message.error('Invalid backup file name format. Expected YYYY-MM-DD.json');
        return { success: false, date: '', message: 'Invalid file name format' };
      }

      const dateStr = dateMatch[1];
      const date = dayjs(dateStr);
      const fileContent = await this.driveService.downloadFile(fileId);

      await this.storage.restoreRecords(fileContent, date);
      message.success('Records restored successfully');

      // 通知后台更新数据
      chrome.runtime.sendMessage({
        action: 'get-days-with-messages'
      });

      return { success: true, date: dateStr };
    } catch (error) {
      console.error('Error restoring file:', error);
      message.error('Failed to restore records');
      return { success: false, date: '', message: 'Failed to restore records' };
    }
  }

  /**
   * 恢复所有文件的记录
   */
  async restoreAllFiles(files: gapi.client.drive.File[]): Promise<{ restoredCount: number, failedFiles: string[] }> {
    let restoredCount = 0;
    const failedFiles: string[] = [];

    console.log(`Attempting to restore ${files.length} files...`);

    for (const file of files) {
      try {
        const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})\.json/);
        if (!dateMatch) {
          console.log(`File ${file.name} does not match date pattern, skipping...`);
          failedFiles.push(file.name);
          continue;
        }

        const dateStr = dateMatch[1];
        console.log(`Restoring file for date: ${dateStr}...`);
        const date = dayjs(dateStr);
        const fileContent = await this.driveService.downloadFile(file.id);

        if (!fileContent || (Array.isArray(fileContent) && fileContent.length === 0)) {
          console.log(`File ${file.name} has no valid content, skipping...`);
          failedFiles.push(file.name);
          continue;
        }

        await this.storage.restoreRecords(fileContent, date);
        restoredCount++;
        console.log(`Successfully restored file: ${file.name}`);
      } catch (error) {
        console.error(`Failed to restore ${file.name}:`, error);
        failedFiles.push(file.name);
      }
    }

    console.log(`Restore complete. Restored: ${restoredCount}, Failed: ${failedFiles.length}`);

    // 通知后台更新数据
    chrome.runtime.sendMessage({
      action: 'get-days-with-messages'
    });

    return { restoredCount, failedFiles };
  }

  /**
   * 将本地数据同步到Google Drive
   * @param initialAlwaysOverwrite 是否始终覆盖
   * @param initialAlwaysSkip 是否始终跳过
   * @param onConflict 冲突处理回调
   * @returns 同步摘要
   */
  async syncToGoogleDrive(
    initialAlwaysOverwrite: boolean,
    initialAlwaysSkip: boolean,
    onConflict: (conflict: ConflictData) => Promise<boolean>
  ): Promise<SyncSummary> {
    console.log('开始同步，初始状态:', { initialAlwaysOverwrite, initialAlwaysSkip });

    const summary: SyncSummary = {
      uploaded: [],
      skipped: [],
      totalMessages: 0
    };

    // 确保已加载备份文件夹
    await this.ensureBackupFolder();

    // 获取所有有消息的日期
    const datesWithMessages = await this.getDatesWithMessages();
    console.log('有消息的日期:', datesWithMessages);

    if (!datesWithMessages || datesWithMessages.length === 0) {
      console.log('没有需要同步的日期');
      return summary;
    }

    // 获取Google Drive中已存在的文件
    const existingFiles = await this.listBackupFiles();
    console.log('Google Drive中的文件:', existingFiles);

    const existingFilesMap = new Map<string, gapi.client.drive.File>();
    existingFiles.forEach(file => {
      if (file.name) {
        existingFilesMap.set(file.name, file);
      }
    });

    // 处理每个日期的数据
    for (const date of datesWithMessages) {
      const fileName = `${date}.json`;
      const fileExists = existingFilesMap.has(fileName);
      console.log(`处理日期 ${date}, 文件${fileExists ? '存在' : '不存在'}`);

      // 如果文件已存在
      if (fileExists) {
        const existingFile = existingFilesMap.get(fileName)!;

        // 获取本地内容
        const localContent = await this.getLocalContent(date);
        if (!Array.isArray(localContent) || localContent.length === 0) {
          console.log(`日期 ${date} 没有有效内容，跳过`);
          continue;
        }

        // 计算本地文件大小
        const localJson = JSON.stringify(localContent);
        const localSize = localJson.length;
        const remoteSize = parseInt(existingFile.size || '0');

        console.log(`日期 ${date} 的文件大小比较:`, {
          localSize,
          remoteSize,
          fileName
        });

        // 如果文件大小差异在1KB以内，认为是相同的
        const sizeDiff = Math.abs(localSize - remoteSize);
        const isSizeEqual = sizeDiff <= 1024; // 1KB = 1024 bytes

        if (isSizeEqual) {
          console.log(`日期 ${date} 的文件大小差异在1KB以内，视为相同，跳过`);
          summary.skipped.push(date);
          continue;
        }

        // 如果文件大小不同，且不是始终覆盖或始终跳过，则需要处理冲突
        if (!initialAlwaysOverwrite && !initialAlwaysSkip) {
          console.log(`日期 ${date} 的文件大小不同，显示冲突解决对话框`);
          const shouldOverwrite = await onConflict({
            fileName,
            localDate: date,
            localSize,
            remoteSize,
            localCount: localContent.length,
            remoteCount: 0, // 由于我们不再下载远程内容，这里设为0
            contentEqual: false
          });

          console.log(`用户选择${shouldOverwrite ? '覆盖' : '跳过'}`);
          if (!shouldOverwrite) {
            summary.skipped.push(date);
            continue;
          }
        } else if (initialAlwaysSkip) {
          console.log(`日期 ${date} 的文件存在且用户选择始终跳过`);
          summary.skipped.push(date);
          continue;
        } else if (initialAlwaysOverwrite) {
          console.log(`日期 ${date} 的文件存在且用户选择始终覆盖`);
        }

        // 更新现有文件
        console.log(`更新日期 ${date} 的文件`);
        await this.updateFile(existingFile.id!, localContent, fileName);
        summary.uploaded.push(date);
        summary.totalMessages += localContent.length;
      } else {
        // 文件不存在，创建新文件
        const content = await this.getLocalContent(date);
        if (!Array.isArray(content) || content.length === 0) {
          console.log(`日期 ${date} 没有有效内容，跳过`);
          continue;
        }

        console.log(`创建日期 ${date} 的文件`);
        await this.createFile(fileName, content);
        summary.uploaded.push(date);
        summary.totalMessages += content.length;
      }
    }

    console.log('同步完成，摘要:', summary);
    return summary;
  }
}

// 导出单例实例
export default new BackupService();
