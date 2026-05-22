import React, { useEffect, useState } from 'react';
import { Drawer, Switch, Spin } from 'antd';
import { SyncOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import useI18n from '~utils/i18n';
import { getConfigValue, setConfigValue } from '~utils/appConfig';

interface BackupSectionProps {
  visible: boolean;
  onClose: () => void;
  onBackup: () => void;
  loading: boolean;
}

const DrawerBody = styled.div`
  padding: 0 0 24px;
  background: var(--opt-bg-page);
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
`;

const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 500;
  color: #8E8E93;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  padding: 20px 4px 8px;
`;

const SettingGroup = styled.div`
  background: var(--opt-bg-card);
  border-radius: 12px;
  border: 0.5px solid var(--opt-border-subtle);
  overflow: hidden;
`;

const SettingRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
`;

const SettingText = styled.div`
  flex: 1;
  min-width: 0;
  margin-right: 12px;
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
  margin-top: 2px;
  line-height: 1.4;
`;

const SettingDivider = styled.div`
  height: 0.5px;
  background: var(--opt-border-divider);
  margin: 0 16px;
`;

const SyncNowButton = styled.button<{ $loading?: boolean }>`
  width: 100%;
  height: 50px;
  background: ${({ $loading }) => ($loading ? 'rgba(0, 122, 255, 0.6)' : '#007AFF')};
  color: #fff;
  border: none;
  border-radius: 14px;
  font-size: 16px;
  font-weight: 600;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  letter-spacing: -0.2px;
  cursor: ${({ $loading }) => ($loading ? 'not-allowed' : 'pointer')};
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 24px;
  transition: background 0.15s ease, transform 0.12s ease;

  &:hover:not(:disabled) {
    background: #0071E3;
    transform: scale(1.01);
  }

  &:active:not(:disabled) {
    background: #0062CA;
    transform: scale(0.985);
  }
`;

const BackupSection: React.FC<BackupSectionProps> = ({ visible, onClose, onBackup, loading }) => {
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
    <Drawer
      open={visible}
      onClose={onClose}
      placement="bottom"
      height="auto"
      title={t('backup_title')}
      styles={{
        body: { background: 'var(--opt-bg-page)', padding: '0 20px' },
        header: {
          background: 'var(--opt-bg-page)',
          borderBottom: '0.5px solid var(--opt-border-divider)',
          fontFamily: "-apple-system, 'SF Pro Display', sans-serif",
          fontWeight: 600,
          fontSize: 17,
        },
        wrapper: { borderRadius: '16px 16px 0 0', overflow: 'hidden' },
      }}
    >
      <DrawerBody>
        <SectionLabel>Automation</SectionLabel>
        <SettingGroup>
          <SettingRow>
            <SettingText>
              <SettingTitle>{t('auto_sync_on_meeting_end')}</SettingTitle>
              <SettingDesc>{t('auto_sync_on_meeting_end_desc')}</SettingDesc>
            </SettingText>
            <Switch
              checked={autoSyncEnabled}
              onChange={handleAutoSyncChange}
              loading={loadingSettings}
            />
          </SettingRow>
          <SettingDivider />
          <SettingRow>
            <SettingText>
              <SettingTitle>{t('auto_sync_on_startup')}</SettingTitle>
              <SettingDesc>{t('auto_sync_on_startup_desc')}</SettingDesc>
            </SettingText>
            <Switch
              checked={autoSyncOnStartupEnabled}
              onChange={handleAutoSyncOnStartupChange}
              loading={loadingSettings}
            />
          </SettingRow>
        </SettingGroup>

        <SyncNowButton $loading={loading} onClick={loading ? undefined : onBackup}>
          {loading ? (
            <>
              <Spin size="small" style={{ filter: 'brightness(0) invert(1)' }} />
              {t('syncing')}
            </>
          ) : (
            <>
              <SyncOutlined />
              {t('backup_to_drive')}
            </>
          )}
        </SyncNowButton>
      </DrawerBody>
    </Drawer>
  );
};

export default BackupSection;
