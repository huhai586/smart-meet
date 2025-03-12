import React from 'react';
import { Space, Typography, Button, Upload, theme } from 'antd';
import { CloudDownloadOutlined, UploadOutlined, SyncOutlined } from '@ant-design/icons';
import { ActionButton, IconWrapper, StyledCard } from './StyledComponents';
import FileList from './FileList';
import type { DriveFile } from './types';

const { Title, Text } = Typography;
const { useToken } = theme;

interface RestoreSectionProps {
  files: DriveFile[];
  loading: boolean;
  restoring: boolean;
  loadingFileId: string | null;
  deletingFileId: string | null;
  onRestoreAll: () => void;
  onRestore: (fileId: string, fileName: string) => void;
  onDelete: (fileId: string) => void;
  onRefresh: () => void;
  onUpload: (file: File) => Promise<boolean>;
}

const RestoreSection: React.FC<RestoreSectionProps> = ({
  files,
  loading,
  restoring,
  loadingFileId,
  deletingFileId,
  onRestoreAll,
  onRestore,
  onDelete,
  onRefresh,
  onUpload
}) => {
  const { token } = useToken();

  return (
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
            onClick={onRestoreAll}
            loading={restoring}
            disabled={files.length === 0}
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
            beforeUpload={onUpload}
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
            onClick={onRefresh}
            style={{
              height: "32px",
              borderRadius: "6px"
            }}
          >
            Refresh
          </Button>
        </div>
        
        <FileList
          files={files}
          loading={loading}
          loadingFileId={loadingFileId}
          deletingFileId={deletingFileId}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      </Space>
    </StyledCard>
  );
};

export default RestoreSection; 