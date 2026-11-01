import React, { useEffect, useState } from 'react';
import { Switch } from 'antd';
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
  justify-content: space-between;
  padding: 10px 16px;
`;

const SettingText = styled.div`
  flex: 1;
  min-width: 0;
  margin-right: 12px;
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 2px 10px;
`;

const SettingTitle = styled.div`
  font-size: 15px;
  font-weight: 500;
  color: var(--opt-text-primary);
  line-height: 1.3;
`;

const SettingDesc = styled.div`
  font-size: 12px;
  color: var(--opt-text-secondary);
  line-height: 1.4;
`;

const SettingDivider = styled.div`
  height: 0.5px;
  background: var(--opt-border-divider);
  margin: 0 16px;
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
        <SettingText>
          <SettingTitle>{t('auto_sync_on_meeting_end')}</SettingTitle>
          <SettingDesc>{t('auto_sync_on_meeting_end_desc')}</SettingDesc>
        </SettingText>
        <Switch checked={autoSyncEnabled} onChange={handleAutoSyncChange} loading={loadingSettings} />
      </SettingRow>
      <SettingDivider />
      <SettingRow>
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
