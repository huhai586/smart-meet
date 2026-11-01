import React from 'react';
import { Switch } from 'antd';
import { CloudSyncOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useI18n } from '~utils/i18n';
import useVocabDriveSync from '~hooks/useVocabDriveSync';
import messageManager from '~utils/message-manager';
import './vocabulary.scss';

/** Opt-in backup of the vocabulary to the Google Drive folder the meeting records already use. */
const DriveSyncCard: React.FC = () => {
  const { t } = useI18n();
  const { enabled, lastSyncAt, syncing, turnOn, turnOff, syncNow } = useVocabDriveSync();

  const report = (result: string) => {
    if (result === 'unauthorized') messageManager.error(t('vocab_sync_need_login'));
    else if (result !== 'synced') messageManager.error(t('vocab_sync_failed'));
  };

  const onToggle = async (checked: boolean) => {
    if (checked) report(await turnOn());
    else await turnOff();
  };

  return (
    <section className="vocab-sync">
      <CloudSyncOutlined className="vocab-sync__icon" />
      <div className="vocab-sync__text">
        <div className="vocab-sync__title">{t('vocab_sync_title')}</div>
        <div className="vocab-sync__desc">{t('vocab_sync_desc')}</div>
        {enabled && (
          <div className="vocab-sync__status">
            {lastSyncAt ? t('vocab_sync_last', { time: dayjs(lastSyncAt).format('YYYY-MM-DD HH:mm') }) : t('vocab_sync_never')}
            {' · '}
            <button type="button" disabled={syncing} onClick={async () => report(await syncNow())}>
              {syncing ? t('vocab_sync_syncing') : t('vocab_sync_now')}
            </button>
          </div>
        )}
      </div>
      <Switch checked={enabled} loading={syncing} onChange={onToggle} />
    </section>
  );
};

export default DriveSyncCard;
