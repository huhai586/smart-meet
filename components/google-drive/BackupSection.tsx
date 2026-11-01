import React, { useEffect, useState } from 'react';
import { Switch } from 'antd';
import { DesktopOutlined, VideoCameraOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useI18n from '~utils/i18n';
import { getConfigValue, setConfigValue } from '~utils/appConfig';

const SettingGroup = styled.div`
  margin-bottom: 20px;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
  background: var(--opt-bg-card);
  border-radius: 12px;
  border: 0.5px solid var(--opt-border-subtle);
  overflow: hidden;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
`;

// The same coloured rounded icon the other settings pages put in front of a row
const IconSquircle = styled.div<{ $color: string }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: ${({ $color }) => $color};
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  font-size: 15px;
`;

const SettingText = styled.div`
  flex: 1;
  min-width: 0;
`;

const SettingTitle = styled.div`
  font-size: 15px;
  font-weight: 400;
  color: var(--opt-text-primary);
  line-height: 1.3;
`;

const SettingDesc = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: var(--opt-text-secondary);
  line-height: 1.4;
`;

const SettingDivider = styled.div`
  height: 0.5px;
  background: var(--opt-border-divider);
  margin: 0 16px 0 60px;
`;

/** Meeting records go to Drive when a call ends and when the browser starts; both can be turned off here. */
const BackupSection: React.FC = () => {
  const { t } = useI18n();
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(false);
  const [autoSyncOnStartupEnabled, setAutoSyncOnStartupEnabled] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  useEffect(() => {
    getConfigValue('autoSyncOnLeave').then((v) => {
      setAutoSyncEnabled(v !== false);
    });
    getConfigValue('autoSyncOnStartup').then((v) => {
      setAutoSyncOnStartupEnabled(v === true);
      setLoadingSettings(false);
    });
  }, []);

  const handleAutoSyncChange = (checked: boolean) => {
    setAutoSyncEnabled(checked);
    setConfigValue('autoSyncOnLeave', checked);
  };

  const handleAutoSyncOnStartupChange = (checked: boolean) => {
    setAutoSyncOnStartupEnabled(checked);
    setConfigValue('autoSyncOnStartup', checked);
  };

  return (
    <SettingGroup>
      <SettingRow>
        <IconSquircle $color="#34C759"><VideoCameraOutlined /></IconSquircle>
        <SettingText>
          <SettingTitle>{t('auto_sync_on_meeting_end')}</SettingTitle>
          <SettingDesc>{t('auto_sync_on_meeting_end_desc')}</SettingDesc>
        </SettingText>
        <Switch checked={autoSyncEnabled} onChange={handleAutoSyncChange} loading={loadingSettings} />
      </SettingRow>
      <SettingDivider />
      <SettingRow>
        <IconSquircle $color="#FF9500"><DesktopOutlined /></IconSquircle>
        <SettingText>
          <SettingTitle>{t('auto_sync_on_startup')}</SettingTitle>
          <SettingDesc>{t('auto_sync_on_startup_desc')}</SettingDesc>
        </SettingText>
        <Switch checked={autoSyncOnStartupEnabled} onChange={handleAutoSyncOnStartupChange} loading={loadingSettings} />
      </SettingRow>
    </SettingGroup>
  );
};

export default BackupSection;
