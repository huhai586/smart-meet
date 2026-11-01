import React, { useEffect, useState } from 'react';
import { Empty, Popconfirm } from 'antd';
import { BookOutlined, DeleteOutlined } from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import type { DriveFile } from './types';
import useI18n from '~utils/i18n';
import useVocabDriveSync from '~hooks/useVocabDriveSync';
import DriveSyncCard from '~components/options/vocabulary/DriveSyncCard';
import { GoogleDriveService } from '~utils/google-drive';
import messageManager from '~utils/message-manager';
import VocabularyBackupModal from './VocabularyBackupModal';

interface VocabularyBackupProps {
  file?: DriveFile;
  onRefresh: () => void;
}

const Wrapper = styled.div`
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;

  .vocab-sync {
    margin-top: 0;
  }
`;

const FileRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 14px;
  background: var(--opt-bg-card);
  border: 0.5px solid var(--opt-border-subtle);
  cursor: pointer;
  transition: background 0.18s ease;

  &:hover {
    background: var(--opt-hover-default);
  }
`;

const FileIcon = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(160deg, #34c759 0%, #16a34a 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: #fff;
  font-size: 17px;
`;

const FileInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const FileName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: var(--opt-text-primary);
`;

const FileMeta = styled.div`
  margin-top: 2px;
  font-size: 12px;
  color: var(--opt-text-secondary);
`;

const DeleteButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background: none;
  color: var(--opt-text-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.18s ease, color 0.18s ease;

  &:hover {
    background: var(--opt-hover-clickable);
    color: #ff3b30;
  }
`;

const formatFileSize = (size?: number) => {
  if (!size) return '';
  const kb = Number(size) / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
};

/** The vocabulary backup on Drive: its switch, and the one file it keeps there. */
const VocabularyBackup: React.FC<VocabularyBackupProps> = ({ file, onRefresh }) => {
  const { t } = useI18n();
  const { lastSyncAt } = useVocabDriveSync();
  const [viewing, setViewing] = useState<DriveFile | null>(null);

  // A sync that finished (here or in the background) changes the file; load it again.
  useEffect(() => {
    if (lastSyncAt) onRefresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastSyncAt]);

  const deleteFromDrive = async () => {
    if (!file) return;
    if (await GoogleDriveService.getInstance().deleteFile(file.id)) {
      messageManager.success(t('drive_vocab_deleted'));
      onRefresh();
    }
  };

  return (
    <Wrapper>
      <DriveSyncCard />
      {file ? (
        <FileRow onClick={() => setViewing(file)}>
          <FileIcon>
            <BookOutlined />
          </FileIcon>
          <FileInfo>
            <FileName>{t('drive_vocab_file_title')}</FileName>
            <FileMeta>
              {[dayjs(file.modifiedTime).format('MMM D, YYYY HH:mm'), formatFileSize(file.size)].filter(Boolean).join(' · ')}
            </FileMeta>
          </FileInfo>
          {/* The confirm opens in a portal, whose clicks would still reach the row */}
          <span onClick={(event) => event.stopPropagation()}>
          <Popconfirm
            title={t('drive_vocab_delete_confirm')}
            okText={t('remove')}
            cancelText={t('cancel')}
            okButtonProps={{ danger: true }}
            onConfirm={deleteFromDrive}
          >
            <DeleteButton type="button" title={t('remove')} aria-label={t('remove')}>
              <DeleteOutlined />
            </DeleteButton>
          </Popconfirm>
          </span>
        </FileRow>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('drive_vocab_empty')} style={{ margin: '40px 0' }} />
      )}
      <VocabularyBackupModal file={viewing} onClose={() => setViewing(null)} />
    </Wrapper>
  );
};

export default VocabularyBackup;
