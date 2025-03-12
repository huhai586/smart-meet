import React, { useState, useEffect } from 'react';
import { Card, Space, Typography, Button, List, Upload, Empty, Spin, Modal, Popconfirm, Row, Col, message, theme } from 'antd';
import {
  CloudSyncOutlined,
  CloudUploadOutlined,
  CloudDownloadOutlined,
  UploadOutlined,
  DeleteOutlined,
  FolderOutlined,
  SyncOutlined
} from '@ant-design/icons';
import { GoogleDriveService } from '../utils/google-drive';
import { StorageFactory } from '../background/data-persistence/storage-factory';
import dayjs from 'dayjs';
import styled from '@emotion/styled';

interface DriveFile {
  id: string;
  name: string;
  modifiedTime: string;
}

interface SyncSummary {
  uploaded: string[];
  skipped: string[];
  totalMessages: number;
}

interface ConflictData {
  folderId: string;
  date: string;
  data: any[];
  existingFileId: string;
  existingFile: {
    name: string;
    modifiedTime: string;
    size?: number;
  };
  newFileSize: number;
}

interface IconWrapperProps {
  color: string;
  shadowColor: string;
  children: React.ReactNode;
}

const { Title, Text } = Typography;
const { useToken } = theme;

const StyledCard = styled(Card)`
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  }
`;

const IconWrapper = styled.div<IconWrapperProps>`
  width: 80px;
  height: 80px;
  border-radius: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  transition: all 0.3s ease;
  background: ${props => props.color};
  box-shadow: 0 4px 12px ${props => props.shadowColor};
`;

const ActionButton = styled(Button)`
  border-radius: 6px;
  height: 40px;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const ListItemCard = styled(List.Item)`
  padding: 16px !important;
  border-radius: 6px !important;
  margin-bottom: 8px !important;
  background: #fff;
  transition: all 0.3s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }
`;

const GoogleDriveIntegration = () => {
  const [backupFiles, setBackupFiles] = useState<DriveFile[]>([]);
  const [backupFolder, setBackupFolder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [loadingFileId, setLoadingFileId] = useState<string | null>(null);
  const [conflictModalVisible, setConflictModalVisible] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<ConflictData | null>(null);
  const [alwaysOverwrite, setAlwaysOverwrite] = useState(false);
  const [alwaysSkip, setAlwaysSkip] = useState(false);
  const [resolveConflict, setResolveConflict] = useState<((value: boolean) => void) | null>(null);
  const driveService = GoogleDriveService.getInstance();
  const { token } = useToken();

  useEffect(() => {
    loadBackupFolder();
  }, []);

  const loadBackupFolder = async () => {
    try {
      setLoading(true);
      const folder = await driveService.getBackupFolder();
      setBackupFolder(folder);

      if (folder) {
        const files = await driveService.listBackupFiles();
        setBackupFiles(files);
      }
    } catch (error) {
      console.error('Error loading backup folder:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConflictResolution = async (overwrite: boolean) => {
    try {
      if (!currentConflict) return;

      if (overwrite) {
        await driveService.uploadFile(
          new File(
            [JSON.stringify(currentConflict.data)],
            `${currentConflict.date}.json`,
            { type: 'application/json' }
          ),
          currentConflict.existingFileId
        );
      }
    } finally {
      setConflictModalVisible(false);
      setCurrentConflict(null);
      if (resolveConflict) {
        resolveConflict(overwrite);
        setResolveConflict(null);
      }
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      const storage = StorageFactory.getInstance().getProvider();
      const dates = await storage.getDaysWithMessages();

      if (dates.length === 0) {
        message.info("No messages to sync");
        return;
      }

      const tempSummary: SyncSummary = {
        uploaded: [],
        skipped: [],
        totalMessages: 0
      };

      for (const date of dates) {
        try {
          const records = await storage.getRecords(dayjs(date));
          if (records.length === 0) continue;

          // 检查是否存在同名文件
          const existingFiles = await driveService.listBackupFiles();
          const existingFile = existingFiles.find(f => f.name === `${date}.json`);

          if (existingFile) {
            if (alwaysOverwrite) {
              await driveService.uploadFile(
                new File([JSON.stringify(records)], `${date}.json`, { type: 'application/json' }),
                existingFile.id
              );
              tempSummary.uploaded.push(date);
              tempSummary.totalMessages += records.length;
            } else if (alwaysSkip) {
              tempSummary.skipped.push(date);
            } else {
              const newFileContent = JSON.stringify(records);
              const newFileSize = new Blob([newFileContent]).size;

              const userResponse = await new Promise<boolean>((resolve) => {
                setResolveConflict(() => resolve);
                setCurrentConflict({
                  folderId: backupFolder.id,
                  date,
                  data: records,
                  existingFileId: existingFile.id,
                  existingFile: {
                    name: existingFile.name,
                    modifiedTime: existingFile.modifiedTime,
                    size: existingFile.size
                  },
                  newFileSize
                });
                setConflictModalVisible(true);
              });

              if (userResponse) {
                await driveService.uploadFile(
                  new File([JSON.stringify(records)], `${date}.json`, { type: 'application/json' }),
                  existingFile.id
                );
                tempSummary.uploaded.push(date);
                tempSummary.totalMessages += records.length;
              } else {
                tempSummary.skipped.push(date);
              }
            }
          } else {
            await driveService.uploadFile(
              new File([JSON.stringify(records)], `${date}.json`, { type: 'application/json' })
            );
            tempSummary.uploaded.push(date);
            tempSummary.totalMessages += records.length;
          }
        } catch (error) {
          console.error(`Failed to process date ${date}:`, error);
          message.error(`Failed to process date ${date}: ${error.message}`);
        }
      }

      if (tempSummary.uploaded.length === 0 && tempSummary.skipped.length === 0) {
        message.info("No files were processed during sync.");
        return;
      }

      // 显示同步结果
      Modal.success({
        title: 'Sync Summary',
        width: 500,
        content: (
          <div>
            <p>Successfully uploaded {tempSummary.totalMessages} messages.</p>
            {tempSummary.uploaded.length > 0 && (
              <>
                <p>Synced dates ({tempSummary.uploaded.length}):</p>
                <ul>
                  {tempSummary.uploaded.map(date => (
                    <li key={date}>{date}</li>
                  ))}
                </ul>
              </>
            )}
            {tempSummary.skipped.length > 0 && (
              <>
                <p>Skipped dates ({tempSummary.skipped.length}):</p>
                <ul>
                  {tempSummary.skipped.map(date => (
                    <li key={date}>{date}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        )
      });

      message.success("Successfully synced with Google Drive!");
      loadBackupFolder(); // 刷新文件列表
    } catch (error) {
      console.error("Sync failed:", error);
      message.error(`Failed to sync: ${error.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const handleRestore = async (fileId: string, fileName: string) => {
    try {
      setLoadingFileId(fileId);
      const dateMatch = fileName.match(/(\d{4}-\d{2}-\d{2})\.json/);
      if (!dateMatch) {
        message.error('Invalid backup file name format. Expected YYYY-MM-DD.json');
        return;
      }

      const dateStr = dateMatch[1];
      const date = dayjs(dateStr);
      const fileContent = await driveService.downloadFile(fileId);
      const storage = StorageFactory.getInstance().getProvider();

      Modal.confirm({
        title: 'Restore Confirmation',
        content: `This will restore chat records for ${dateStr}. Existing records for this date will be overwritten. Continue?`,
        onOk: async () => {
          await storage.restoreRecords(fileContent, date);
          message.success('Records restored successfully');
          // 通知后台更新数据
          chrome.runtime.sendMessage({
            action: 'get-days-with-messages'
          });
        }
      });
    } catch (error) {
      console.error('Error restoring file:', error);
      message.error('Failed to restore records');
    } finally {
      setLoadingFileId(null);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    try {
      setDeletingFileId(fileId);
      const success = await driveService.deleteFile(fileId);
      if (success) {
        message.success('File deleted successfully');
        setBackupFiles(backupFiles.filter(file => file.id !== fileId));
      }
    } catch (error) {
      console.error('Error deleting file:', error);
    } finally {
      setDeletingFileId(null);
    }
  };

  const handleRestoreAll = async () => {
    try {
      Modal.confirm({
        title: 'Restore All Confirmation',
        content: 'This will restore all chat records from Google Drive. Existing records will be overwritten. Continue?',
        onOk: async () => {
          setRestoring(true);
          const storage = StorageFactory.getInstance().getProvider();
          let restoredCount = 0;
          let failedFiles = [];

          for (const file of backupFiles) {
            try {
              const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})\.json/);
              if (!dateMatch) continue;

              const dateStr = dateMatch[1];
              const date = dayjs(dateStr);
              const fileContent = await driveService.downloadFile(file.id);
              await storage.restoreRecords(fileContent, date);
              restoredCount++;
            } catch (error) {
              console.error(`Failed to restore ${file.name}:`, error);
              failedFiles.push(file.name);
            }
          }

          // 通知后台更新数据
          chrome.runtime.sendMessage({
            action: 'get-days-with-messages'
          });

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
      message.error('Failed to restore all records');
      setRestoring(false);
    }
  };

  return (
    <div style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <Title level={2} style={{
        marginBottom: "40px",
        textAlign: "center",
        fontSize: "32px",
        fontWeight: "600",
        background: `linear-gradient(120deg, ${token.colorPrimary}, ${token.colorSuccess})`,
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        Google Drive Integration
      </Title>

      <Row gutter={32}>
        <Col span={12}>
          <StyledCard>
            <Space direction="vertical" style={{ width: "100%" }}>
              <IconWrapper color={`${token.colorPrimary}15`} shadowColor={`${token.colorPrimary}20`}>
                <CloudSyncOutlined style={{ fontSize: "36px", color: token.colorPrimary }} />
              </IconWrapper>
              <Title level={4} style={{ textAlign: "center", margin: "16px 0", fontWeight: "600" }}>
                Backup
              </Title>
              <Text type="secondary" style={{
                display: "block",
                textAlign: "center",
                marginBottom: "32px",
                fontSize: "15px",
                lineHeight: "1.6"
              }}>
                Backup your chat history to Google Drive. Existing files can be overwritten or skipped.
              </Text>
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                <ActionButton
                  type="primary"
                  icon={<CloudUploadOutlined />}
                  onClick={handleSync}
                  loading={syncing}
                  size="large"
                  style={{
                    minWidth: "180px",
                    background: token.colorPrimary,
                    borderColor: token.colorPrimary
                  }}
                >
                  Backup to Drive
                </ActionButton>
              </div>
            </Space>
          </StyledCard>
        </Col>

        <Col span={12}>
          <StyledCard>
            <Space direction="vertical" style={{ width: "100%" }}>
              <IconWrapper color={`${token.colorSuccess}15`} shadowColor={`${token.colorSuccess}20`}>
                <CloudDownloadOutlined style={{ fontSize: "36px", color: token.colorSuccess }} />
              </IconWrapper>
              <Title level={4} style={{ textAlign: "center", margin: "16px 0", fontWeight: "600" }}>
                Restore Files
              </Title>
              <Text type="secondary" style={{
                display: "block",
                textAlign: "center",
                marginBottom: "32px",
                fontSize: "15px",
                lineHeight: "1.6"
              }}>
                View and manage your backup files in Google Drive
              </Text>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: "24px" }}>
                <ActionButton
                  type="primary"
                  icon={<CloudDownloadOutlined />}
                  onClick={handleRestoreAll}
                  loading={restoring}
                  disabled={backupFiles.length === 0}
                  size="large"
                  style={{
                    width: "100%",
                    maxWidth: "300px",
                    background: token.colorSuccess,
                    borderColor: token.colorSuccess
                  }}
                >
                  Restore All
                </ActionButton>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: "24px" }}>
                <Upload
                  showUploadList={false}
                  accept=".json"
                  beforeUpload={async (file) => {
                    try {
                      const content = await file.text();
                      const records = JSON.parse(content);
                      const dateMatch = file.name.match(/(\d{4}-\d{2}-\d{2})\.json/);

                      if (!dateMatch) {
                        message.error('Invalid file name format. Expected: YYYY-MM-DD.json');
                        return false;
                      }

                      await driveService.uploadFile(file);
                      message.success('File uploaded successfully');
                      loadBackupFolder();
                    } catch (error) {
                      console.error('Error uploading file:', error);
                      message.error('Failed to upload file. Please ensure it is a valid JSON file.');
                    }
                    return false;
                  }}
                >
                  <Button
                    icon={<UploadOutlined />}
                    style={{
                      height: "32px",
                      borderRadius: "6px"
                    }}
                  >
                    Upload
                  </Button>
                </Upload>
                <Button
                  icon={<SyncOutlined spin={loading} />}
                  onClick={loadBackupFolder}
                  style={{
                    height: "32px",
                    borderRadius: "6px"
                  }}
                >
                  Refresh
                </Button>
              </div>
              <Spin spinning={loading}>
                {backupFiles.length > 0 ? (
                  <List
                    dataSource={backupFiles}
                    renderItem={(file) => (
                      <ListItemCard
                        actions={[
                          <ActionButton
                            type="primary"
                            icon={<CloudDownloadOutlined />}
                            onClick={() => handleRestore(file.id, file.name)}
                            loading={loadingFileId === file.id}
                            size="small"
                            style={{
                              background: token.colorSuccess,
                              borderColor: token.colorSuccess
                            }}
                          >
                            Restore
                          </ActionButton>,
                          <Popconfirm
                            title="Delete file"
                            description={`Are you sure you want to delete "${file.name}"?`}
                            onConfirm={() => handleDeleteFile(file.id)}
                            okText="Yes"
                            cancelText="No"
                          >
                            <Button
                              type="text"
                              danger
                              icon={<DeleteOutlined />}
                              loading={deletingFileId === file.id}
                              size="small"
                            >
                              Delete
                            </Button>
                          </Popconfirm>
                        ]}
                      >
                        <List.Item.Meta
                          title={<Text strong>{file.name}</Text>}
                          description={
                            <Text type="secondary" style={{ fontSize: "13px" }}>
                              Modified: {new Date(file.modifiedTime).toLocaleString()}
                            </Text>
                          }
                        />
                      </ListItemCard>
                    )}
                  />
                ) : (
                  <Empty
                    description={
                      <Text type="secondary" style={{ fontSize: "15px" }}>
                        No backup files found
                      </Text>
                    }
                  />
                )}
              </Spin>
            </Space>
          </StyledCard>
        </Col>
      </Row>

      <Modal
        title={
          <div style={{
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            paddingBottom: "16px",
            marginBottom: "16px"
          }}>
            <Title level={4} style={{ margin: 0 }}>File Conflict</Title>
          </div>
        }
        open={conflictModalVisible}
        onCancel={() => handleConflictResolution(false)}
        width={600}
        footer={[
          <Button
            key="skip"
            onClick={() => handleConflictResolution(false)}
            style={{ borderRadius: "6px" }}
          >
            Skip
          </Button>,
          <Button
            key="overwrite"
            type="primary"
            onClick={() => handleConflictResolution(true)}
            style={{ borderRadius: "6px" }}
          >
            Overwrite
          </Button>,
          <Button
            key="alwaysOverwrite"
            type="primary"
            onClick={() => {
              setAlwaysOverwrite(true);
              handleConflictResolution(true);
            }}
            style={{ borderRadius: "6px" }}
          >
            Always Overwrite
          </Button>,
          <Button
            key="alwaysSkip"
            onClick={() => {
              setAlwaysSkip(true);
              handleConflictResolution(false);
            }}
            style={{ borderRadius: "6px" }}
          >
            Always Skip
          </Button>
        ]}
        style={{ borderRadius: "8px" }}
      >
        {currentConflict && (
          <div>
            <Title level={5} style={{ marginBottom: "16px" }}>Conflict Details</Title>
            <div style={{ marginBottom: '16px' }}>
              <Text strong>File: </Text>
              <Text>{currentConflict.existingFile.name}</Text>
            </div>

            <Row gutter={24}>
              <Col span={12}>
                <Card
                  size="small"
                  title="Existing File"
                  style={{
                    backgroundColor: '#f5f5f5',
                    borderRadius: "6px"
                  }}
                >
                  <p>
                    <Text strong>Modified: </Text>
                    <Text>{new Date(currentConflict.existingFile.modifiedTime).toLocaleString()}</Text>
                  </p>
                  <p>
                    <Text strong>Size: </Text>
                    <Text>{((currentConflict.existingFile.size || 0) / 1024).toFixed(2)} KB</Text>
                  </p>
                  <p>
                    <Text strong>Location: </Text>
                    <Text>Google Drive</Text>
                  </p>
                </Card>
              </Col>
              <Col span={12}>
                <Card
                  size="small"
                  title="New File"
                  style={{
                    backgroundColor: '#f0f5ff',
                    borderRadius: "6px"
                  }}
                >
                  <p>
                    <Text strong>Modified: </Text>
                    <Text>{new Date().toLocaleString()}</Text>
                  </p>
                  <p>
                    <Text strong>Size: </Text>
                    <Text>{(currentConflict.newFileSize / 1024).toFixed(2)} KB</Text>
                  </p>
                  <p>
                    <Text strong>Location: </Text>
                    <Text>Local Storage</Text>
                  </p>
                </Card>
              </Col>
            </Row>

            <div style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: '#fffbe6',
              border: '1px solid #ffe58f',
              borderRadius: '6px'
            }}>
              <Text type="warning" style={{ fontSize: "14px" }}>
                Would you like to overwrite the existing file in Google Drive with your local version?
              </Text>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default GoogleDriveIntegration;
