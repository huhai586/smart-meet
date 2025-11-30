import React, { useState } from 'react';
import { Space, Typography, Button, Upload, theme, Row, Col, Divider } from 'antd';
import { CloudDownloadOutlined, UploadOutlined, SyncOutlined, TableOutlined } from '@ant-design/icons';
import { ActionButton, IconWrapper, StyledCard } from './StyledComponents';
import FileList from './FileList';
import FileDetailsModal from './FileDetailsModal';
import type { DriveFile } from './types';
import useI18n from '~utils/i18n';

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
  onDownload: (fileId: string, fileName: string) => void;
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
  onDownload,
  onRefresh,
  onUpload
}) => {
  const { token } = useToken();
  const { t } = useI18n();
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);

  return (
    <StyledCard bodyStyle={{ padding: "16px" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Header Section */}
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6}>
            <IconWrapper color={`${token.colorSuccess}15`} shadowColor={`${token.colorSuccess}20`}>
              <CloudDownloadOutlined style={{ fontSize: "32px", color: token.colorSuccess }} />
            </IconWrapper>
          </Col>
          <Col xs={24} sm={16} md={18}>
            <Title level={4} style={{ margin: "0 0 8px", fontWeight: "600" }}>
              {t('restore_files')}
            </Title>
            <Text type="secondary" style={{ fontSize: "14px", lineHeight: "1.5" }}>
              {t('restore_files_desc')}
            </Text>
          </Col>
        </Row>

        {/* Action Buttons */}
        <Row gutter={16} justify="space-between" align="middle">
          <Col>
            <Space>
              <ActionButton
                type="primary"
                icon={<CloudDownloadOutlined />}
                onClick={onRestoreAll}
                loading={restoring}
                disabled={files.length === 0}
                size="middle"
                style={{
                  background: token.colorSuccess,
                  borderColor: token.colorSuccess
                }}
              >
                {t('restore_all')}
              </ActionButton>
              {files.length > 0 && (
                <Button
                  icon={<TableOutlined />}
                  onClick={() => setDetailsModalVisible(true)}
                  size="middle"
                >
                  {t('view_details')}
                </Button>
              )}
            </Space>
          </Col>
          <Col>
            <Space>
              <Upload
                showUploadList={false}
                accept=".json"
                beforeUpload={onUpload}
              >
                <Button
                  icon={<UploadOutlined />}
                  size="middle"
                >
                  {t('upload')}
                </Button>
              </Upload>
              <Button
                icon={<SyncOutlined spin={loading} />}
                onClick={onRefresh}
                size="middle"
              >
                {t('refresh')}
              </Button>
            </Space>
          </Col>
        </Row>

        <Divider style={{ margin: "8px 0" }} />
        
        {/* File List */}
        <div style={{ marginTop: "8px" }}>
          <FileList
            files={files}
            loading={loading}
            loadingFileId={loadingFileId}
            deletingFileId={deletingFileId}
            onRestore={onRestore}
            onDelete={onDelete}
            onDownload={onDownload}
          />
        </div>
      </Space>

      {/* File Details Modal */}
      <FileDetailsModal
        visible={detailsModalVisible}
        files={files}
        onClose={() => setDetailsModalVisible(false)}
      />
    </StyledCard>
  );
};

export default RestoreSection; 