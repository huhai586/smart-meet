import React, { useEffect, useState } from 'react';
import { Row, Col, Typography, Button, Space, Divider, Spin } from 'antd';
import { GoogleOutlined } from '@ant-design/icons';
import BackupSection from './BackupSection';
import RestoreSection from './RestoreSection';
import ConflictModal from './ConflictModal';
import useBackupFolder from './hooks/useBackupFolder';
import useConflictResolution from './hooks/useConflictResolution';
import useBackupSync from './hooks/useBackupSync';
import useFileOperations from './hooks/useFileOperations';
import StyledTitle from '../common/StyledTitle';
import GoogleAccountInfo from './GoogleAccountInfo';
import { useGoogleAuth } from '../../contexts/GoogleAuthContext';
import styled from 'styled-components';
import useI18n from "~utils/i18n"

const { Text, Title } = Typography;

const LoginSection = styled.div`
  margin: 40px 0;
  padding: 30px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  margin: 60px 0;
  padding: 40px;
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

  // 使用hooks
  const {
    backupFiles,
    backupFolder,
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
        <LoadingContainer>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <div style={{
              fontSize: '36px',
              marginRight: '15px',
              width: '60px',
              height: '60px',
              background: '#4285f415',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Spin size="large" />
            </div>
            <div>
              <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#333' }}>
                Authenticating with Google...
              </Title>
              <Text type="secondary" style={{ fontSize: '15px' }}>
                Please wait while we securely connect to your Google account
              </Text>
            </div>
          </div>
        </LoadingContainer>
      );
    }

    // 如果已认证且登录成功，显示备份和恢复功能
    if (isAuthenticated && (loginSuccess || user)) {
      return (
        <>
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
                loading={folderLoading}
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
        </>
      );
    }

    // 如果未认证，显示登录界面
    return (
      <LoginSection>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '20px'
        }}>
          <div style={{
            fontSize: '36px',
            marginRight: '15px',
            width: '60px',
            height: '60px',
            background: '#4285f415',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <GoogleOutlined style={{ fontSize: "32px", color: '#4285f4' }} />
          </div>
          <div>
            <Title level={4} style={{ margin: 0, fontWeight: 600, color: '#333' }}>
              {t('google_drive_access_required')}
            </Title>
            <Text type="secondary" style={{ fontSize: '15px' }}>
              {t('google_drive_connect_desc')}
            </Text>
          </div>
        </div>

        <div style={{ maxWidth: "300px" }}>
          <Button
            type="primary"
            size="large"
            icon={<GoogleOutlined />}
            onClick={handleLogin}
            loading={isLoggingIn}
            style={{
              width: "100%",
              height: "48px",
              borderRadius: "8px",
              fontSize: "16px",
              fontWeight: "500"
            }}
          >
            {isLoggingIn ? 'Logging in...' : 'Login with Google'}
          </Button>
        </div>
      </LoginSection>
    );
  };

  return (
    <div>
      <StyledTitle subtitle={t('google_drive_integration_desc')}>{t('google_drive_integration')}</StyledTitle>

      <div style={{ padding: "0 20px" }}>
        {/* Google账号信息 */}
        <GoogleAccountInfo />

        {renderContent()}
      </div>
    </div>
  );
};

export default GoogleDriveIntegration;
