import { useState, useEffect, useCallback } from 'react';
import { GoogleDriveService } from '~utils/google-drive';
import type { DriveFile, DriveFolder } from '../types';
import { useGoogleAuth } from '~contexts/GoogleAuthContext';

/**
 * 处理Google Drive备份文件夹的加载和文件列表获取
 */
export const useBackupFolder = () => {
  const [backupFiles, setBackupFiles] = useState<DriveFile[]>([]);
  const [backupFolder, setBackupFolder] = useState<DriveFolder | null>(null);
  const [loading, setLoading] = useState(false);
  const driveService = GoogleDriveService.getInstance();
  const { isAuthenticated, loading: authLoading } = useGoogleAuth();

  /**
   * 加载备份文件夹和文件列表
   */
  const loadBackupFolder = useCallback(async () => {
    // 如果未认证，不加载文件夹
    if (!isAuthenticated) {
      console.log('Not authenticated, skipping backup folder loading');
      return;
    }
    
    try {
      console.log('Loading backup folder...');
      setLoading(true);
      const folder = await driveService.getBackupFolder();
      setBackupFolder(folder);

      if (folder) {
        console.log('Backup folder loaded, loading files...');
        const files = await driveService.listBackupFiles();
        setBackupFiles(files);
        console.log(`Loaded ${files.length} backup files`);
      }
    } catch (error) {
      console.error('Error loading backup folder:', error);
      setBackupFiles([]);
      setBackupFolder(null);
    } finally {
      setLoading(false);
    }
  }, [driveService, isAuthenticated]);

  // 初始加载 - 只在认证状态变化或初始化时加载
  useEffect(() => {
    // 只有当认证完成且已认证时才加载
    if (!authLoading && isAuthenticated) {
      console.log('Auth state ready and authenticated, loading backup folder');
      loadBackupFolder();
    } else {
      console.log('Not authenticated or auth loading, skipping initial backup folder load');
      // 如果未认证，清空数据
      setBackupFiles([]);
      setBackupFolder(null);
    }
  }, [loadBackupFolder, isAuthenticated, authLoading]);

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
