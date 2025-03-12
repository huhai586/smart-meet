import React from 'react';
import { Space, Typography, theme } from 'antd';
import { CloudSyncOutlined } from '@ant-design/icons';
import { ActionButton, IconWrapper, StyledCard } from './StyledComponents';

const { Title, Text } = Typography;
const { useToken } = theme;

interface BackupSectionProps {
  onBackup: () => void;
  loading: boolean;
}

const BackupSection: React.FC<BackupSectionProps> = ({ onBackup, loading }) => {
  const { token } = useToken();

  return (
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
            icon={<CloudSyncOutlined />}
            onClick={onBackup}
            loading={loading}
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
  );
};

export default BackupSection; 