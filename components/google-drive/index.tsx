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

const { Text, Title } = Typography;

const PageContainer = styled.div`
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
`;

const AuthStatusDebug = styled.div`
  margin: 20px 0;
  padding: 15px;
  background-color: #f5f5f5;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
`;

const LoginSection = styled.div`
  text-align: center;
  margin: 40px 0;
  padding: 30px;
  background-color: #f9f9f9;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 60px 0;
  padding: 40px;
  text-align: center;
`;

/**
 * Google Drive集成主组件
 */
const GoogleDriveIntegration: React.FC = () => {
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
    alwaysMerge,
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
      currentConflict,
      alwaysOverwrite,
      alwaysSkip,
      alwaysMerge
    });
  }, [conflictModalVisible, currentConflict, alwaysOverwrite, alwaysSkip, alwaysMerge]);

  const {
    syncing,
    handleSync
  } = useBackupSync(
    showConflictModal,
    alwaysOverwrite,
    alwaysSkip,
    alwaysMerge,
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
          <Spin size="large" />
          <Title level={4} style={{ marginTop: 24 }}>
            Authenticating with Google...
          </Title>
          <Text type="secondary">
            Please wait while we securely connect to your Google account
          </Text>
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
        <Title level={3}>Google Drive Access Required</Title>
        <Text style={{ display: 'block', margin: '20px 0' }}>
          To use the backup and restore features, you need to login to your Google account and grant access to Google Drive.
        </Text>
        <Button 
          type="primary" 
          size="large"
          icon={<GoogleOutlined />} 
          onClick={handleLogin}
          loading={isLoggingIn}
        >
          {isLoggingIn ? 'Logging in...' : 'Login with Google'}
        </Button>
      </LoginSection>
    );
  };

  return (
    <PageContainer>
      {/* Google账号信息 - 放在右上角 */}
      <GoogleAccountInfo />
      
      <StyledTitle>Google Drive Integration</StyledTitle>

      {/* 认证状态信息 */}
      <AuthStatusDebug>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text strong>Authentication Status:</Text>
          <Text>
            {loading ? 'Loading...' : 
             isLoggingIn ? 'Logging in...' : 
             isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
          </Text>
          
          {user && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Text strong>User Information:</Text>
              <Text>Name: {user.name}</Text>
              <Text>Email: {user.email}</Text>
            </>
          )}
          
          {!isAuthenticated && !loading && !isLoggingIn && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Button 
                type="primary" 
                icon={<GoogleOutlined />} 
                onClick={handleLogin}
                style={{ marginTop: '8px' }}
              >
                Login with Google
              </Button>
            </>
          )}
        </Space>
      </AuthStatusDebug>

      {renderContent()}
    </PageContainer>
  );
};

export default GoogleDriveIntegration; 