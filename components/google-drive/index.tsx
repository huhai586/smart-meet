import React, { useEffect } from 'react';
import { Row, Col } from 'antd';
import BackupSection from './BackupSection';
import RestoreSection from './RestoreSection';
import ConflictModal from './ConflictModal';
import useBackupFolder from './hooks/useBackupFolder';
import useConflictResolution from './hooks/useConflictResolution';
import useBackupSync from './hooks/useBackupSync';
import useFileOperations from './hooks/useFileOperations';
import StyledTitle from '../common/StyledTitle';

/**
 * Google Drive集成主组件
 */
const GoogleDriveIntegration: React.FC = () => {
  // 使用hooks
  const { 
    backupFiles, 
    backupFolder, 
    loading, 
    loadBackupFolder, 
    updateFileList 
  } = useBackupFolder();

  const {
    conflictModalVisible,
    currentConflict,
    alwaysOverwrite,
    alwaysSkip,
    handleConflictResolution,
    showConflictModal,
    resetConflictState
  } = useConflictResolution();

  // 添加调试日志，监控冲突解决状态
  useEffect(() => {
    console.log('GoogleDriveIntegration - 冲突解决状态:', {
      conflictModalVisible,
      currentConflict
    });
  }, [conflictModalVisible, currentConflict]);

  const {
    syncing,
    handleSync
  } = useBackupSync(
    showConflictModal,
    alwaysOverwrite,
    alwaysSkip,
    loadBackupFolder,
    resetConflictState
  );

  const {
    loadingFileId,
    deletingFileId,
    restoring,
    handleRestore,
    handleDeleteFile,
    handleRestoreAll,
    handleUpload
  } = useFileOperations(updateFileList);

  // 删除文件的处理函数（传递当前文件列表）
  const onDeleteFile = (fileId: string) => {
    handleDeleteFile(fileId, backupFiles);
  };

  // 恢复所有文件的处理函数
  const onRestoreAll = () => {
    handleRestoreAll(backupFiles);
  };

  return (
    <div style={{ padding: "20px", maxWidth: "1000px", margin: "0 auto" }}>
      <StyledTitle>Google Drive Integration</StyledTitle>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={10}>
          <BackupSection 
            onBackup={handleSync} 
            loading={syncing} 
          />
        </Col>

        <Col xs={24} lg={14}>
          <RestoreSection 
            files={backupFiles}
            loading={loading}
            restoring={restoring}
            loadingFileId={loadingFileId}
            deletingFileId={deletingFileId}
            onRestoreAll={onRestoreAll}
            onRestore={handleRestore}
            onDelete={onDeleteFile}
            onRefresh={loadBackupFolder}
            onUpload={handleUpload}
          />
        </Col>
      </Row>

      <ConflictModal
        visible={conflictModalVisible}
        conflict={currentConflict}
        onResolve={handleConflictResolution}
      />
    </div>
  );
};

export default GoogleDriveIntegration; 