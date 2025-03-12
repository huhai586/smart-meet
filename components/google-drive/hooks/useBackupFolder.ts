import { useState, useEffect, useCallback } from 'react';
import { GoogleDriveService } from '~utils/google-drive';
import type { DriveFile, DriveFolder } from '../types';

/**
 * 处理Google Drive备份文件夹的加载和文件列表获取
 */
export const useBackupFolder = () => {
  const [backupFiles, setBackupFiles] = useState<DriveFile[]>([]);
  const [backupFolder, setBackupFolder] = useState<DriveFolder | null>(null);
  const [loading, setLoading] = useState(false);
  const driveService = GoogleDriveService.getInstance();

  /**
   * 加载备份文件夹和文件列表
   */
  const loadBackupFolder = useCallback(async () => {
    try {
      setLoading(true);
      const folder = await driveService.getBackupFolder();
      setBackupFolder(folder);

      if (folder) {
        const files = await driveService.listBackupFiles();
        setBackupFiles(files);
      }
    } catch (error) {
      console.error('Error loading backup folder:', error);
    } finally {
      setLoading(false);
    }
  }, [driveService]);

  // 初始加载
  useEffect(() => {
    loadBackupFolder();
  }, [loadBackupFolder]);

  /**
   * 更新文件列表（例如在删除文件后）
   */
  const updateFileList = useCallback((updatedFiles: DriveFile[]) => {
    setBackupFiles(updatedFiles);
  }, []);

  return {
    backupFiles,
    backupFolder,
    loading,
    loadBackupFolder,
    updateFileList
  };
};

export default useBackupFolder;
