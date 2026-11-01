import React, { useEffect, useState } from 'react';
import { Segmented } from 'antd';
import BackupSection from './BackupSection';
import RestoreSection from './RestoreSection';
import VocabularyBackup from './VocabularyBackup';
import ConflictModal from './ConflictModal';
import useBackupFolder from './hooks/useBackupFolder';
import useConflictResolution from './hooks/useConflictResolution';
import useBackupSync from './hooks/useBackupSync';
import useFileOperations from './hooks/useFileOperations';
import GoogleSignInGate from '~components/options/GoogleSignInGate';
import { useGoogleAuth } from '~contexts/GoogleAuthContext';
import styled from 'styled-components';
import useI18n from "~utils/i18n"

/* ── Apple-style page header ── */
const DrivePageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  padding: 0 0 20px;
`;

const LargeTitle = styled.h1`
  font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: var(--opt-text-primary);
  letter-spacing: -0.5px;
  margin: 0;
  line-height: 1.2;
`;

const SubTitle = styled.p`
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
  font-size: 13px;
  color: #8E8E93;
  margin: 4px 0 0;
  line-height: 1.4;
`;

/**
 * Google Drive集成主组件
 */
/** What the Drive page keeps: the meeting records of each day, and the vocabulary. */
const DriveTab = { RECORDS: 'records', VOCABULARY: 'vocabulary' } as const;
type DriveTab = (typeof DriveTab)[keyof typeof DriveTab];

const GoogleDriveIntegration: React.FC = () => {
  const { t } = useI18n();
  const { isAuthenticated } = useGoogleAuth();
  const [tab, setTab] = useState<DriveTab>(DriveTab.RECORDS);

  // 使用hooks
  const {
    backupFiles,
    vocabFile,
    backupFolder: _backupFolder,
    loading: folderLoading,
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
    handleUpload,
    handleDownload
  } = useFileOperations(updateFileList);

  // 删除文件的处理函数（传递当前文件列表）
  const onDeleteFile = (fileId: string) => {
    handleDeleteFile(fileId, backupFiles);
  };

  // 恢复所有文件的处理函数
  const onRestoreAll = () => {
    handleRestoreAll(backupFiles);
  };

  // 渲染内容
  const renderContent = () => {
    // 如果已认证且登录成功，显示备份和恢复功能
    if (isAuthenticated) {
      return (
        <>
          <Segmented
            value={tab}
            onChange={(value) => setTab(value as DriveTab)}
            options={[
              { label: t('drive_tab_records'), value: DriveTab.RECORDS },
              { label: t('drive_tab_vocabulary'), value: DriveTab.VOCABULARY },
            ]}
            style={{ marginBottom: 16 }}
          />

          {tab === DriveTab.RECORDS ? (
            <>
              <BackupSection />
              <RestoreSection
                files={backupFiles}
                loading={folderLoading}
                restoring={restoring}
                loadingFileId={loadingFileId}
                deletingFileId={deletingFileId}
                onRestoreAll={onRestoreAll}
                onRestore={handleRestore}
                onDelete={onDeleteFile}
                onDownload={handleDownload}
                onRefresh={loadBackupFolder}
                onUpload={handleUpload}
                onBackup={handleSync}
                backingUp={syncing}
              />
            </>
          ) : (
            <VocabularyBackup file={vocabFile} onRefresh={loadBackupFolder} />
          )}

          <ConflictModal
            visible={conflictModalVisible}
            conflict={currentConflict}
            onResolve={handleConflictResolution}
          />
        </>
      );
    }

    // Not signed in: the same gate as the Calendar page
    return <GoogleSignInGate />;
  };

  return (
    <div style={{ padding: '0 20px' }}>
      <DrivePageHeader>
        <div>
          <LargeTitle>{t('google_drive_integration')}</LargeTitle>
          <SubTitle>{t('google_drive_integration_desc')}</SubTitle>
        </div>
      </DrivePageHeader>

      {renderContent()}
    </div>
  );
};

export default GoogleDriveIntegration;
