import { useState, useCallback } from 'react';
import { Modal } from 'antd';
import backupService from '../services/BackupService';
import type { DriveFile } from '../types';

/**
 * 处理文件操作（恢复、删除等）
 */
export const useFileOperations = (updateFileList: (files: DriveFile[]) => void) => {
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  /**
   * 恢复单个文件
   */
  const handleRestore = useCallback(async (fileId: string, fileName: string) => {
    try {
      setLoadingFileId(fileId);
      
      Modal.confirm({
        title: 'Restore Confirmation',
        content: `This will restore chat records for this date. Existing records for this date will be overwritten. Continue?`,
        onOk: async () => {
          const result = await backupService.restoreFile(fileId, fileName);
          if (result.success) {
            // 可以在这里添加跳转到日期的逻辑
          }
        }
      });
    } catch (error) {
      console.error('Error restoring file:', error);
    } finally {
      setLoadingFileId(null);
    }
  }, []);

  /**
   * 删除文件
   */
  const handleDeleteFile = useCallback(async (fileId: string, files: DriveFile[]) => {
    try {
      setDeletingFileId(fileId);
      const success = await backupService.deleteFile(fileId);
      if (success) {
        // 更新文件列表
        const updatedFiles = files.filter(file => file.id !== fileId);
        updateFileList(updatedFiles);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    } finally {
      setDeletingFileId(null);
    }
  }, [updateFileList]);

  /**
   * 恢复所有文件
   */
  const handleRestoreAll = useCallback(async (files: DriveFile[]) => {
    try {
      Modal.confirm({
        title: 'Restore All Confirmation',
        content: 'This will restore all chat records from Google Drive. Existing records will be overwritten. Continue?',
        onOk: async () => {
          setRestoring(true);
          const { restoredCount, failedFiles } = await backupService.restoreAllFiles(files);

          // 显示恢复结果
          Modal.success({
            title: 'Restore All Complete',
            content: (
              <div>
                <p>Successfully restored {restoredCount} files.</p>
                {failedFiles.length > 0 && (
                  <>
                    <p style={{ color: '#ff4d4f' }}>Failed to restore these files:</p>
                    <ul>
                      {failedFiles.map(fileName => (
                        <li key={fileName}>{fileName}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )
          });
          setRestoring(false);
        },
        onCancel: () => {
          setRestoring(false);
        }
      });
    } catch (error) {
      console.error('Error restoring all files:', error);
      setRestoring(false);
    }
  }, []);

  /**
   * 上传文件
   */
  const handleUpload = useCallback(async (file: File) => {
    return await backupService.uploadFile(file);
  }, []);

  return {
    loadingFileId,
    deletingFileId,
    restoring,
    handleRestore,
    handleDeleteFile,
    handleRestoreAll,
    handleUpload
  };
};

export default useFileOperations; 