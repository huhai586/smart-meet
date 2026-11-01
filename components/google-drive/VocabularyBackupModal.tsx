import React, { useEffect, useMemo, useState } from 'react';
import { Empty, Modal, Spin } from 'antd';
import { useI18n } from '~utils/i18n';
import { GoogleDriveService } from '~utils/google-drive';
import messageManager from '~utils/message-manager';
import { groupLookups, sortForDisplay, type VocabEntry } from '~utils/vocab-core';
import { parseSnapshot } from '~utils/vocab-sync';
import WordRankList from '~components/options/vocabulary/WordRankList';
import WordDetail from '~components/options/vocabulary/WordDetail';
import type { DriveFile } from './types';

interface VocabularyBackupModalProps {
  file: DriveFile | null;
  onClose: () => void;
}

/** The words in the vocabulary backup on Drive, read-only: the same list and sentences as the vocabulary page. */
const VocabularyBackupModal: React.FC<VocabularyBackupModalProps> = ({ file, onClose }) => {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [entries, setEntries] = useState<VocabEntry[]>([]);
  const [selectedKey, setSelectedKey] = useState('');

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    setLoading(true);
    setEntries([]);
    GoogleDriveService.getInstance()
      .downloadFile(file.id)
      .then((content) => {
        if (cancelled) return;
        const sorted = sortForDisplay(groupLookups(parseSnapshot(content).records));
        setEntries(sorted);
        setSelectedKey(sorted[0]?.key ?? '');
      })
      .catch(() => messageManager.error(t('drive_vocab_load_failed')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  const selected = useMemo(() => entries.find((entry) => entry.key === selectedKey) ?? entries[0], [entries, selectedKey]);

  return (
    <Modal open={!!file} onCancel={onClose} footer={null} centered width={980} title={t('drive_vocab_file_title')} destroyOnHidden>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '48px 0' }}>
          <Spin />
        </div>
      ) : selected ? (
        <div className="vocab-split">
          <WordRankList entries={entries} selectedKey={selected.key} onSelect={setSelectedKey} />
          <WordDetail key={selected.key} entry={selected} />
        </div>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('vocab_no_results')} />
      )}
    </Modal>
  );
};

export default VocabularyBackupModal;
