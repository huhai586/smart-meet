import React, { useEffect, useState } from 'react';
import { Space, Typography, theme, Row, Col, Divider, Switch } from 'antd';
import { CloudSyncOutlined } from '@ant-design/icons';
import { ActionButton, IconWrapper, StyledCard } from './StyledComponents';
import useI18n from '~utils/i18n';

const { Title, Text } = Typography;
const { useToken } = theme;

interface BackupSectionProps {
  onBackup: () => void;
  loading: boolean;
}

const BackupSection: React.FC<BackupSectionProps> = ({ onBackup, loading }) => {
  const { token } = useToken();
  const { t } = useI18n();
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncOnStartupEnabled, setAutoSyncOnStartupEnabled] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  // 加载自动同步设置
  useEffect(() => {
    chrome.storage.sync.get(['autoSyncOnLeave', 'autoSyncOnStartup'], (result) => {
      setAutoSyncEnabled(result.autoSyncOnLeave !== false); // 默认开启
      setAutoSyncOnStartupEnabled(result.autoSyncOnStartup === true); // 默认关闭
      setLoadingSettings(false);
    });
  }, []);

  // 处理会议结束后自动同步开关变化
  const handleAutoSyncChange = (checked: boolean) => {
    setAutoSyncEnabled(checked);
    chrome.storage.sync.set({ autoSyncOnLeave: checked }, () => {
      console.log('会议结束后自动同步设置已更新:', checked);
    });
  };

  // 处理浏览器启动时自动同步开关变化
  const handleAutoSyncOnStartupChange = (checked: boolean) => {
    setAutoSyncOnStartupEnabled(checked);
    chrome.storage.sync.set({ autoSyncOnStartup: checked }, () => {
      console.log('浏览器启动时自动同步设置已更新:', checked);
    });
  };

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
              {t('backup_title')}
            </Title>
            <Text type="secondary" style={{ fontSize: "14px", lineHeight: "1.5" }}>
              {t('backup_title_desc')}
            </Text>
          </Col>
        </Row>

        <Divider style={{ margin: "8px 0" }} />

        {/* Auto Sync on Meeting End Setting */}
        <Row align="middle" justify="space-between" style={{ padding: "8px 0" }}>
          <Col flex="1">
            <Space direction="vertical" size={0}>
              <Text strong style={{ fontSize: "14px" }}>
                {t('auto_sync_on_meeting_end')}
              </Text>
              <Text type="secondary" style={{ fontSize: "13px" }}>
                {t('auto_sync_on_meeting_end_desc')}
              </Text>
            </Space>
          </Col>
          <Col>
            <Switch
              checked={autoSyncEnabled}
              onChange={handleAutoSyncChange}
              loading={loadingSettings}
            />
          </Col>
        </Row>

        {/* Auto Sync on Browser Startup Setting */}
        <Row align="middle" justify="space-between" style={{ padding: "8px 0" }}>
          <Col flex="1">
            <Space direction="vertical" size={0}>
              <Text strong style={{ fontSize: "14px" }}>
                {t('auto_sync_on_startup')}
              </Text>
              <Text type="secondary" style={{ fontSize: "13px" }}>
                {t('auto_sync_on_startup_desc')}
              </Text>
            </Space>
          </Col>
          <Col>
            <Switch
              checked={autoSyncOnStartupEnabled}
              onChange={handleAutoSyncOnStartupChange}
              loading={loadingSettings}
            />
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
            {t('backup_to_drive')}
          </ActionButton>
        </div>
      </Space>
    </StyledCard>
  );
};

export default BackupSection; 