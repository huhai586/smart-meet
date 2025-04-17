import { message } from 'antd';
import dayjs from 'dayjs';
import { GoogleDriveService } from '../../../utils/google-drive';
import { StorageFactory } from '../../../background/data-persistence/storage-factory';
import type { SyncSummary, RestoreResult, ConflictData } from '../types';

// 添加gapi类型声明
declare namespace gapi.client.drive {
  interface File {
    id?: string;
    name?: string;
    mimeType?: string;
    modifiedTime?: string;
    size?: string;
  }
}

/**
 * 备份服务，封装备份相关的方法
 */
export class BackupService {
  private driveService: GoogleDriveService;
  private storage: any;

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
  private async getLocalContent(date: string): Promise<any[]> {
    return await this.storage.getRecords(dayjs(date));
  }

  /**
   * 获取远程内容
   */
  private async getRemoteContent(fileId: string): Promise<any[]> {
    return await this.driveService.downloadFile(fileId);
  }

  /**
   * 更新文件
   */
  private async updateFile(fileId: string, content: any[], fileName: string): Promise<void> {
    await this.driveService.uploadFile(
      new File([JSON.stringify(content)], fileName, { type: 'application/json' }),
      fileId
    );
  }

  /**
   * 创建文件
   */
  private async createFile(fileName: string, content: any[]): Promise<void> {
    await this.driveService.uploadFile(
      new File([JSON.stringify(content)], fileName, { type: 'application/json' })
    );
  }

  /**
   * 上传文件到Google Drive
   */
  async uploadFile(file: File): Promise<boolean> {
    try {
      const content = await file.text();
      const records = JSON.parse(content);
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
  async restoreAllFiles(files: any[]): Promise<{ restoredCount: number, failedFiles: string[] }> {
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

      // 如果文件已存在且不是始终覆盖，则需要处理冲突
      if (fileExists && !initialAlwaysOverwrite && !initialAlwaysSkip) {
        const existingFile = existingFilesMap.get(fileName)!;
        
        // 获取本地和远程文件的内容进行比较
        const localContent = await this.getLocalContent(date);
        const remoteContent = await this.getRemoteContent(existingFile.id!);
        
        // 使用更可靠的方式比较内容
        const localJson = JSON.stringify(localContent);
        const remoteJson = JSON.stringify(remoteContent);
        
        // 检查内容是否真的相同（仅用于日志记录，不影响冲突解决流程）
        let contentEqual = false;
        
        try {
          // 首先检查长度是否相同
          if (localJson.length === remoteJson.length) {
            // 然后检查消息数量是否相同
            const localCount = Array.isArray(localContent) ? localContent.length : 0;
            const remoteCount = Array.isArray(remoteContent) ? remoteContent.length : 0;
            
            if (localCount === remoteCount) {
              // 最后检查内容是否完全相同
              contentEqual = localJson === remoteJson;
            }
          }
        } catch (error) {
          console.error(`比较内容时出错:`, error);
          contentEqual = false;
        }
        
        console.log(`日期 ${date} 的内容比较:`, {
          contentEqual,
          localSize: localJson.length,
          remoteSize: remoteJson.length,
          localCount: Array.isArray(localContent) ? localContent.length : 0,
          remoteCount: Array.isArray(remoteContent) ? remoteContent.length : 0
        });
        
        // 不再跳过内容相同的文件，始终显示冲突解决对话框
        console.log(`日期 ${date} 文件已存在，显示冲突解决对话框${contentEqual ? '（内容相同）' : '（内容不同）'}`);
        const shouldOverwrite = await onConflict({
          fileName,
          localDate: date,
          localSize: localJson.length,
          remoteSize: remoteJson.length,
          localCount: Array.isArray(localContent) ? localContent.length : 0,
          remoteCount: Array.isArray(remoteContent) ? remoteContent.length : 0,
          contentEqual
        });
        
        console.log(`用户选择${shouldOverwrite ? '覆盖' : '跳过'}`);
        if (!shouldOverwrite) {
          summary.skipped.push(date);
          continue;
        }
      } else if (fileExists && initialAlwaysSkip) {
        console.log(`日期 ${date} 的文件存在且用户选择始终跳过`);
        // 如果文件存在且用户选择始终跳过，则跳过此文件
        summary.skipped.push(date);
        continue;
      } else if (fileExists && initialAlwaysOverwrite) {
        console.log(`日期 ${date} 的文件存在且用户选择始终覆盖`);
      }

      // 上传文件
      try {
        const content = await this.getLocalContent(date);
        if (!Array.isArray(content) || content.length === 0) {
          console.log(`日期 ${date} 没有有效内容，跳过`);
          continue;
        }

        if (fileExists) {
          // 更新现有文件
          console.log(`更新日期 ${date} 的文件`);
          const existingFile = existingFilesMap.get(fileName)!;
          await this.updateFile(existingFile.id!, content, fileName);
        } else {
          // 创建新文件
          console.log(`创建日期 ${date} 的文件`);
          await this.createFile(fileName, content);
        }

        summary.uploaded.push(date);
        summary.totalMessages += content.length;
      } catch (error) {
        console.error(`Failed to upload ${fileName}:`, error);
      }
    }

    console.log('同步完成，摘要:', summary);
    return summary;
  }
}

// 导出单例实例
export default new BackupService(); 