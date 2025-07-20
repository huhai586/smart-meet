import { useState, useCallback, useEffect } from 'react';
import { GoogleDriveService } from '~utils/google-drive';
import type { ConflictData } from '../types';
import type { ConflictResolutionResult } from '../ConflictModal';

/**
 * 处理冲突解决逻辑
 */
export const useConflictResolution = () => {
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<ConflictData | null>(null);
  const [alwaysOverwrite, setAlwaysOverwrite] = useState(false);
  const [alwaysSkip, setAlwaysSkip] = useState(false);
  const [resolveConflict, setResolveConflict] = useState<((result: ConflictResolutionResult) => void) | null>(null);
  const _driveService = GoogleDriveService.getInstance();

  // 组件挂载时重置状态
  useEffect(() => {
    resetConflictState();
  }, []);

  // 添加调试日志，监控状态变化
  useEffect(() => {
    console.log('冲突解决状态变化:', { 
      conflictModalVisible, 
      currentConflict, 
      alwaysOverwrite, 
      alwaysSkip 
    });
  }, [conflictModalVisible, currentConflict, alwaysOverwrite, alwaysSkip]);

  /**
   * 重置冲突解决状态
   */
  const resetConflictState = useCallback(() => {
    console.log('重置冲突解决状态');
    setAlwaysOverwrite(false);
    setAlwaysSkip(false);
    setConflictModalVisible(false);
    setCurrentConflict(null);
    setResolveConflict(null);
  }, []);

  /**
   * 处理冲突解决
   */
  const handleConflictResolution = useCallback(async (result: ConflictResolutionResult) => {
    console.log('处理冲突解决:', result);
    setConflictModalVisible(false);

    // 更新全局状态
    if (result.alwaysOverwrite) {
      console.log('设置始终覆盖');
      setAlwaysOverwrite(true);
    }
    if (result.alwaysSkip) {
      console.log('设置始终跳过');
      setAlwaysSkip(true);
    }

    // 调用回调函数
    if (resolveConflict) {
      console.log('调用回调函数');
      resolveConflict(result);
      setResolveConflict(null);
    }
  }, [resolveConflict]);

  /**
   * 显示冲突解决对话框
   */
  const showConflictModal = useCallback((
    conflict: ConflictData,
    onResolve: (result: ConflictResolutionResult) => void
  ) => {
    console.log('显示冲突解决对话框:', conflict);
    setCurrentConflict(conflict);
    setConflictModalVisible(true);
    setResolveConflict(() => onResolve);
  }, []);

  return {
    conflictModalVisible,
    currentConflict,
    alwaysOverwrite,
    alwaysSkip,
    handleConflictResolution,
    showConflictModal,
    resetConflictState
  };
};

export default useConflictResolution;
