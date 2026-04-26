import React, { useRef } from 'react';
import { Dropdown, Spin, Upload } from 'antd';
import {
  SettingOutlined,
  SyncOutlined,
  UploadOutlined,
  EllipsisOutlined,
  CloudDownloadOutlined,
} from '@ant-design/icons';
import styled from 'styled-components';
import FileList from './FileList';
import type { DriveFile } from './types';
import useI18n from '~utils/i18n';

interface RestoreSectionProps {
  files: DriveFile[];
  loading: boolean;
  restoring: boolean;
  loadingFileId: string | null;
  deletingFileId: string | null;
  onRestoreAll: () => void;
  onRestore: (fileId: string, fileName: string) => void;
  onDelete: (fileId: string) => void;
  onDownload: (fileId: string, fileName: string) => void;
  onRefresh: () => void;
  onUpload: (file: File) => Promise<boolean>;
  onOpenSettings: () => void;
}

/* ── Styled Components ── */

const Wrapper = styled.div`
  font-family: -apple-system, 'SF Pro Text', 'Helvetica Neue', 'Inter', sans-serif;
`;

const ToolbarRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 0 16px;
`;

const ToolbarTitle = styled.h2`
  font-size: 20px;
  font-weight: 700;
  color: #1C1C1E;
  letter-spacing: -0.4px;
  margin: 0;
  font-family: -apple-system, 'SF Pro Display', 'Helvetica Neue', sans-serif;
`;

const ToolbarActions = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

const IconBtn = styled.button<{ $spinning?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: none;
  color: #007AFF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 16px;
  transition: background 0.12s ease;
  flex-shrink: 0;
  position: relative;

  &:hover {
    background: rgba(0, 122, 255, 0.1);
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

/* ── Component ── */

const RestoreSection: React.FC<RestoreSectionProps> = ({
  files,
  loading,
  restoring,
  loadingFileId,
  deletingFileId,
  onRestoreAll,
  onRestore,
  onDelete,
  onDownload,
  onRefresh,
  onUpload,
  onOpenSettings,
}) => {
  const { t } = useI18n();

  const moreMenuItems = [
    {
      key: 'restore-all',
      icon: restoring ? <Spin size="small" /> : <CloudDownloadOutlined />,
      label: t('restore_all'),
      disabled: restoring || files.length === 0,
      onClick: onRestoreAll,
    },
  ];

  return (
    <Wrapper>
      <ToolbarRow>
        <ToolbarTitle>{t('restore_files')}</ToolbarTitle>
        <ToolbarActions>
          {/* Refresh */}
          <IconBtn onClick={onRefresh} disabled={loading} title={t('refresh')}>
            <SyncOutlined spin={loading} />
          </IconBtn>

          {/* Upload */}
          <Upload
            showUploadList={false}
            accept=".json"
            beforeUpload={onUpload}
          >
            <IconBtn as="span" title={t('upload')} style={{ cursor: 'pointer' }}>
              <UploadOutlined />
            </IconBtn>
          </Upload>

          {/* Sync Settings */}
          <IconBtn onClick={onOpenSettings} title={t('backup_title')}>
            <SettingOutlined />
          </IconBtn>

          {/* More (Restore All) */}
          <Dropdown menu={{ items: moreMenuItems }} trigger={['click']} placement="bottomRight">
            <IconBtn title="More">
              <EllipsisOutlined />
            </IconBtn>
          </Dropdown>
        </ToolbarActions>
      </ToolbarRow>

      <FileList
        files={files}
        loading={loading}
        loadingFileId={loadingFileId}
        deletingFileId={deletingFileId}
        onRestore={onRestore}
        onDelete={onDelete}
        onDownload={onDownload}
      />
    </Wrapper>
  );
};

export default RestoreSection;
