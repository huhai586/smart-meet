import React from 'react';
import { Space, Typography, theme, Row, Col, Divider } from 'antd';
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
    <StyledCard bodyStyle={{ padding: "16px" }}>
      <Space direction="vertical" style={{ width: "100%" }} size="middle">
        {/* Header Section */}
        <Row gutter={16} align="middle">
          <Col xs={24} sm={8} md={6}>
            <IconWrapper color={`${token.colorPrimary}15`} shadowColor={`${token.colorPrimary}20`}>
              <CloudSyncOutlined style={{ fontSize: "32px", color: token.colorPrimary }} />
            </IconWrapper>
          </Col>
          <Col xs={24} sm={16} md={18}>
            <Title level={4} style={{ margin: "0 0 8px", fontWeight: "600" }}>
              Backup
            </Title>
            <Text type="secondary" style={{ fontSize: "14px", lineHeight: "1.5" }}>
              Backup your chat history to Google Drive. Existing files can be overwritten or skipped.
            </Text>
          </Col>
        </Row>

        <Divider style={{ margin: "8px 0" }} />

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: "16px 0" }}>
          <ActionButton
            type="primary"
            icon={<CloudSyncOutlined />}
            onClick={onBackup}
            loading={loading}
            size="middle"
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