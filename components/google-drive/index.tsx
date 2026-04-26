import React, { useEffect, useState } from 'react';
import { Spin } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import BackupSection from './BackupSection';
import RestoreSection from './RestoreSection';
import ConflictModal from './ConflictModal';
import useBackupFolder from './hooks/useBackupFolder';
import useConflictResolution from './hooks/useConflictResolution';
import useBackupSync from './hooks/useBackupSync';
import useFileOperations from './hooks/useFileOperations';
import GoogleAccountInfo from './GoogleAccountInfo';
import { useGoogleAuth } from '~contexts/GoogleAuthContext';
import styled from 'styled-components';
import useI18n from "~utils/i18n"

/* ── Apple-style page header ── */
const DrivePageHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 0 0 20px;
`;

const LargeTitle = styled.h1`
  font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', 'Inter', sans-serif;
  font-size: 28px;
  font-weight: 700;
  color: #1C1C1E;
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

/* ── Apple-style login page ── */
const LoginSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 52px 24px 60px;
  background: transparent;
`;

const AppleIconContainer = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 18px;
  background: linear-gradient(175deg, #5BA4F9 0%, #4285F4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 28px;
  box-shadow: 0 4px 16px rgba(66, 133, 244, 0.28);
  flex-shrink: 0;
`;

const AppleHeadline = styled.h2`
  font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', 'Inter', sans-serif;
  font-size: 22px;
  font-weight: 600;
  color: #1C1C1E;
  margin: 0 0 8px;
  letter-spacing: -0.3px;
  line-height: 1.3;
`;

const AppleBody = styled.p`
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
  font-size: 15px;
  color: #8E8E93;
  margin: 0 0 36px;
  line-height: 1.55;
  max-width: 280px;
`;

const AppleSeparator = styled.div`
  width: 100%;
  height: 0.5px;
  background: rgba(60, 60, 67, 0.18);
  margin: 0 0 0;
`;

const AppleLoginButton = styled.button<{ $loading?: boolean }>`
  background: #007AFF;
  color: #fff;
  border: none;
  border-radius: 14px;
  height: 50px;
  min-width: 240px;
  padding: 0 28px;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: -0.2px;
  cursor: ${({ $loading }) => ($loading ? 'not-allowed' : 'pointer')};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  opacity: ${({ $loading }) => ($loading ? 0.6 : 1)};
  transition: background 0.15s ease, transform 0.12s ease, opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: #0071E3;
    transform: scale(1.015);
  }

  &:active:not(:disabled) {
    background: #0062CA;
    transform: scale(0.985);
  }
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 52px 24px 60px;
`;

const AppleLoadingIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 18px;
  background: linear-gradient(175deg, #5BA4F9 0%, #4285F4 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 28px;
  box-shadow: 0 4px 16px rgba(66, 133, 244, 0.28);
`;

/**
 * Google Drive集成主组件
 */
const GoogleDriveIntegration: React.FC = () => {
  const { t } = useI18n();
  // 获取Google认证状态
  const { isAuthenticated, user, loading, login } = useGoogleAuth();

  // 添加登录状态管理
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);

  // 使用hooks
  const {
    backupFiles,
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

  // 添加调试日志，监控认证状态
  useEffect(() => {
    console.log('GoogleDriveIntegration - 认证状态:', {
      isAuthenticated,
      user,
      loading
    });

    // 当认证状态变为已认证且不在加载中时，设置登录成功
    if (isAuthenticated && !loading && isLoggingIn) {
      setLoginSuccess(true);
      setIsLoggingIn(false);
    }
  }, [isAuthenticated, user, loading, isLoggingIn]);

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

  // 处理登录
  const handleLogin = async () => {
    console.log('Attempting to login from main component...');
    setIsLoggingIn(true);
    setLoginSuccess(false);
    const success = await login();

    if (!success) {
      setIsLoggingIn(false);
    }
  };

  // 渲染内容
  const renderContent = () => {
    // 如果正在登录中，显示加载状态
    if (isLoggingIn || (loading && isAuthenticated)) {
      return (
        <>
          <AppleSeparator />
          <LoadingContainer>
            <AppleLoadingIcon>
              <Spin size="large" style={{ filter: 'brightness(0) invert(1)' }} />
            </AppleLoadingIcon>
            <AppleHeadline style={{ marginBottom: '8px' }}>
              {t('authenticating_with_google')}
            </AppleHeadline>
            <AppleBody style={{ marginBottom: 0 }}>
              {t('authenticating_desc')}
            </AppleBody>
          </LoadingContainer>
        </>
      );
    }

    // 如果已认证且登录成功，显示备份和恢复功能
    if (isAuthenticated && (loginSuccess || user)) {
      return (
        <>
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
            onOpenSettings={() => setSettingsVisible(true)}
          />

          <BackupSection
            visible={settingsVisible}
            onClose={() => setSettingsVisible(false)}
            onBackup={handleSync}
            loading={syncing}
          />

          <ConflictModal
            visible={conflictModalVisible}
            conflict={currentConflict}
            onResolve={handleConflictResolution}
          />
        </>
      );
    }

    // 如果未认证，显示登录界面
    return (
      <>
        <AppleSeparator />
        <LoginSection>
          <AppleIconContainer>
            <GoogleOutlined style={{ fontSize: '36px', color: '#fff' }} />
          </AppleIconContainer>

          <AppleHeadline>{t('google_drive_access_required')}</AppleHeadline>
          <AppleBody>{t('google_drive_connect_desc')}</AppleBody>

          <AppleLoginButton $loading={isLoggingIn} onClick={isLoggingIn ? undefined : handleLogin}>
            {isLoggingIn ? (
              <>
                <Spin size="small" style={{ filter: 'brightness(0) invert(1)' }} />
                {t('logging_in')}
              </>
            ) : (
              <>
                <GoogleOutlined style={{ fontSize: '17px' }} />
                {t('login_with_google')}
              </>
            )}
          </AppleLoginButton>
        </LoginSection>
      </>
    );
  };

  return (
    <div style={{ padding: '0 20px' }}>
      <DrivePageHeader>
        <div>
          <LargeTitle>{t('google_drive_integration')}</LargeTitle>
          <SubTitle>{t('google_drive_integration_desc')}</SubTitle>
        </div>
        {isAuthenticated && user && <GoogleAccountInfo />}
      </DrivePageHeader>

      {renderContent()}
    </div>
  );
};

export default GoogleDriveIntegration;
