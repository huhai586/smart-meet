import { useState, useCallback, useEffect } from 'react';
import { Modal } from 'antd';
import backupService from '../services/BackupService';
import type { SyncSummary, ConflictData } from '../types';
import type { ConflictResolutionResult } from '../ConflictModal';

/**
 * 渲染同步摘要内容
 */
const SyncSummaryContent = ({ summary }: { summary: SyncSummary }) => (
  <div>
    <p>Successfully uploaded {summary.totalMessages} messages.</p>
    {summary.uploaded.length > 0 && (
      <>
        <p>Synced dates ({summary.uploaded.length}):</p>
        <ul>
          {summary.uploaded.map(date => (
            <li key={date}>{date}</li>
          ))}
        </ul>
      </>
    )}
    {summary.skipped.length > 0 && (
      <>
        <p>Skipped dates ({summary.skipped.length}):</p>
        <ul>
          {summary.skipped.map(date => (
            <li key={date}>{date}</li>
          ))}
        </ul>
      </>
    )}
  </div>
);

/**
 * 处理备份同步逻辑
 */
export const useBackupSync = (
  showConflictModal: (conflict: ConflictData, onResolve: (result: ConflictResolutionResult) => void) => void,
  alwaysOverwrite: boolean,
  alwaysSkip: boolean,
  refreshFiles: () => void,
  resetConflictState?: () => void
) => {
  const [syncing, setSyncing] = useState(false);

  // 添加调试日志，监控props变化
  useEffect(() => {
    console.log('useBackupSync props变化:', { 
      alwaysOverwrite, 
      alwaysSkip 
    });
  }, [alwaysOverwrite, alwaysSkip]);

  /**
   * 显示同步结果摘要
   */
  const showSyncSummary = useCallback((summary: SyncSummary) => {
    Modal.success({
      title: 'Sync Summary',
      width: 500,
      content: <SyncSummaryContent summary={summary} />
    });
  }, []);

  /**
   * 处理同步操作
   */
  const handleSync = useCallback(async () => {
    try {
      // 重置冲突解决状态
      if (resetConflictState) {
        console.log('同步前重置冲突解决状态');
        resetConflictState();
      }
      
      console.log('开始同步操作，当前状态:', { alwaysOverwrite, alwaysSkip });
      setSyncing(true);

      // 在同步过程中维护本地的冲突解决状态
      let localAlwaysOverwrite = alwaysOverwrite;
      let localAlwaysSkip = alwaysSkip;
      console.log('本地冲突解决状态:', { localAlwaysOverwrite, localAlwaysSkip });

      const handleConflict = async (conflict: ConflictData): Promise<boolean> => {
        console.log('处理冲突:', conflict);
        console.log('当前本地状态:', { localAlwaysOverwrite, localAlwaysSkip });
        
        // 如果用户已经选择了始终覆盖或始终跳过，则不显示对话框
        if (localAlwaysOverwrite) {
          console.log('用户选择了始终覆盖，自动返回true');
          return true;
        }
        if (localAlwaysSkip) {
          console.log('用户选择了始终跳过，自动返回false');
          return false;
        }

        return new Promise((resolve) => {
          console.log('显示冲突解决对话框');
          showConflictModal(conflict, (result) => {
            console.log('用户做出选择:', result);
            // 更新本地状态
            if (result.alwaysOverwrite) {
              console.log('设置本地始终覆盖');
              localAlwaysOverwrite = true;
            }
            if (result.alwaysSkip) {
              console.log('设置本地始终跳过');
              localAlwaysSkip = true;
            }
            resolve(result.overwrite);
          });
        });
      };

      const summary = await backupService.syncToGoogleDrive(
        localAlwaysOverwrite,
        localAlwaysSkip,
        handleConflict
      );

      console.log('同步完成，结果:', summary);
      if (summary.uploaded.length === 0 && summary.skipped.length === 0) {
        console.log('没有文件被上传或跳过');
        return;
      }

      // 显示同步结果
      showSyncSummary(summary);
      refreshFiles(); // 刷新文件列表
    } catch (error) {
      console.error("Sync failed:", error);
    } finally {
      setSyncing(false);
    }
  }, [alwaysOverwrite, alwaysSkip, refreshFiles, resetConflictState, showConflictModal, showSyncSummary]);

  return {
    syncing,
    handleSync
  };
};

export default useBackupSync; 