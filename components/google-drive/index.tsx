import React, { useEffect } from 'react';
import { Row, Col, Typography, Button, Space, Divider } from 'antd';
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

/**
 * Google Drive集成主组件
 */
const GoogleDriveIntegration: React.FC = () => {
  // 获取Google认证状态
  const { isAuthenticated, user, loading, login } = useGoogleAuth();
  
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
  }, [isAuthenticated, user, loading]);

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
    await login();
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
          <Text>{loading ? 'Loading...' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}</Text>
          
          {user && (
            <>
              <Divider style={{ margin: '8px 0' }} />
              <Text strong>User Information:</Text>
              <Text>Name: {user.name}</Text>
              <Text>Email: {user.email}</Text>
            </>
          )}
          
          {!isAuthenticated && !loading && (
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

      {!isAuthenticated && !loading ? (
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
          >
            Login with Google
          </Button>
        </LoginSection>
      ) : (
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
      )}
    </PageContainer>
  );
};

export default GoogleDriveIntegration; 