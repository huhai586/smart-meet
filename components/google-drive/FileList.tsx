import React, { useState } from 'react';
import { Input, Dropdown, Empty, Spin, Modal } from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  CloudDownloadOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EllipsisOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import dayjs from 'dayjs';
import type { DriveFile } from './types';
import ChatRecordsModal from './ChatRecordsModal';
import useI18n from '~utils/i18n';

interface FileListProps {
  files: DriveFile[];
  loading: boolean;
  loadingFileId: string | null;
  deletingFileId: string | null;
  onRestore: (fileId: string, fileName: string) => void;
  onDelete: (fileId: string) => void;
  onDownload: (fileId: string, fileName: string) => void;
}

/* ── Styled Components ── */

const SearchBar = styled.div`
  padding: 0 0 12px;
`;

const ListContainer = styled.div`
  background: #F2F2F7;
  border-radius: 12px;
  overflow: hidden;
`;

const ListItem = styled.div<{ $last?: boolean }>`
  display: flex;
  align-items: center;
  padding: 11px 16px;
  background: #fff;
  border-bottom: ${({ $last }) => ($last ? 'none' : '0.5px solid rgba(60, 60, 67, 0.12)')};
  transition: background 0.12s ease;
  gap: 12px;

  &:hover {
    background: rgba(0, 0, 0, 0.025);
  }
`;

const FileIcon = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: linear-gradient(160deg, #5AC8FA 0%, #007AFF 100%);
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
  color: #1C1C1E;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FileMeta = styled.div`
  font-size: 12px;
  color: #8E8E93;
  margin-top: 2px;
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', sans-serif;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const MoreButton = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 14px;
  border: none;
  background: none;
  color: #8E8E93;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex-shrink: 0;
  font-size: 16px;
  transition: background 0.12s ease, color 0.12s ease;

  &:hover {
    background: rgba(60, 60, 67, 0.1);
    color: #1C1C1E;
  }
`;

const SpinWrapper = styled.div`
  display: flex;
  justify-content: center;
  padding: 32px 0;
  background: #fff;
`;

/* ── Helpers ── */

const getDateFromFilename = (filename: string) => {
  const match = filename.match(/(\d{4}-\d{2}-\d{2})\.json/);
  return match ? match[1] : filename.replace('.json', '');
};

const formatFileSize = (size?: number) => {
  if (!size) return '';
  const kb = size / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(2)} MB`;
};

/* ── Component ── */

const FileList: React.FC<FileListProps> = ({
  files,
  loading,
  loadingFileId,
  deletingFileId,
  onRestore,
  onDelete,
  onDownload,
}) => {
  const { t } = useI18n();
  const [searchText, setSearchText] = useState('');
  const [chatRecordsModalVisible, setChatRecordsModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);

  const filteredFiles = files.filter(f =>
    f.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const handleDelete = (file: DriveFile) => {
    Modal.confirm({
      title: t('delete_file'),
      content: t('delete_file_confirm', { fileName: file.name }),
      okText: t('yes'),
      cancelText: t('no'),
      okButtonProps: { danger: true },
      centered: true,
      onOk: () => onDelete(file.id),
    });
  };

  const makeMenuItems = (file: DriveFile) => [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: t('view_chat_records'),
      onClick: () => {
        setSelectedFile(file);
        setChatRecordsModalVisible(true);
      },
    },
    {
      key: 'restore',
      icon: <CloudDownloadOutlined />,
      label: t('restore_this_backup'),
      disabled: loadingFileId === file.id,
      onClick: () => onRestore(file.id, file.name),
    },
    {
      key: 'download',
      icon: <DownloadOutlined />,
      label: t('download_to_local'),
      disabled: loadingFileId === file.id,
      onClick: () => onDownload(file.id, file.name),
    },
    { type: 'divider' as const },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: t('delete_this_backup'),
      danger: true,
      disabled: deletingFileId === file.id,
      onClick: () => handleDelete(file),
    },
  ];

  if (loading) {
    return (
      <ListContainer>
        <SpinWrapper>
          <Spin />
        </SpinWrapper>
      </ListContainer>
    );
  }

  return (
    <>
      <SearchBar>
        <Input
          placeholder={t('search_backups')}
          prefix={<SearchOutlined style={{ color: '#8E8E93' }} />}
          value={searchText}
          onChange={e => setSearchText(e.target.value)}
          allowClear
          style={{
            borderRadius: 10,
            height: 36,
            background: 'rgba(118, 118, 128, 0.12)',
            border: 'none',
            boxShadow: 'none',
          }}
        />
      </SearchBar>

      {filteredFiles.length === 0 ? (
        <Empty
          description={
            <span style={{ color: '#8E8E93', fontSize: 14 }}>
              {searchText ? t('no_matching_backup_files') : t('no_backup_files')}
            </span>
          }
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '32px 0' }}
        />
      ) : (
        <ListContainer>
          {filteredFiles.map((file, idx) => {
            const isBusy = loadingFileId === file.id || deletingFileId === file.id;
            return (
              <ListItem key={file.id} $last={idx === filteredFiles.length - 1}>
                <FileIcon>
                  {isBusy ? <Spin size="small" style={{ filter: 'brightness(0) invert(1)' }} /> : <FileTextOutlined />}
                </FileIcon>
                <FileInfo>
                  <FileName>{getDateFromFilename(file.name)}</FileName>
                  <FileMeta>
                    {dayjs(file.modifiedTime).format('MMM D, YYYY')}
                    {file.size ? ` · ${formatFileSize(file.size)}` : ''}
                  </FileMeta>
                </FileInfo>
                <Dropdown
                  menu={{ items: makeMenuItems(file) }}
                  trigger={['click']}
                  placement="bottomRight"
                >
                  <MoreButton onClick={e => e.stopPropagation()}>
                    <EllipsisOutlined />
                  </MoreButton>
                </Dropdown>
              </ListItem>
            );
          })}
        </ListContainer>
      )}

      {selectedFile && (
        <ChatRecordsModal
          visible={chatRecordsModalVisible}
          file={selectedFile}
          onClose={() => {
            setChatRecordsModalVisible(false);
            setSelectedFile(null);
          }}
        />
      )}
    </>
  );
};

export default FileList;
