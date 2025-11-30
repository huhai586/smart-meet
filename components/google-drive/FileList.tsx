import React, { useState } from 'react';
import { Table, Button, Popconfirm, Typography, Empty, Spin, theme, Tooltip, Input, Space, Select } from 'antd';
import { CloudDownloadOutlined, DeleteOutlined, SearchOutlined, FilterOutlined, DownloadOutlined, EyeOutlined } from '@ant-design/icons';
import type { DriveFile } from './types';
import { ActionButton } from './StyledComponents';
import type { TableProps } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import dayjs from 'dayjs';
import ChatRecordsModal from './ChatRecordsModal';
import useI18n from '~utils/i18n';

const { Text } = Typography;
const { useToken } = theme;
const { Option } = Select;

interface FileListProps {
  files: DriveFile[];
  loading: boolean;
  loadingFileId: string | null;
  deletingFileId: string | null;
  onRestore: (fileId: string, fileName: string) => void;
  onDelete: (fileId: string) => void;
  onDownload: (fileId: string, fileName: string) => void;
}

const FileList: React.FC<FileListProps> = ({
  files,
  loading,
  loadingFileId,
  deletingFileId,
  onRestore,
  onDelete,
  onDownload
}) => {
  const { t } = useI18n();
  const [chatRecordsModalVisible, setChatRecordsModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);

  const handleViewRecords = (file: DriveFile) => {
    setSelectedFile(file);
    setChatRecordsModalVisible(true);
  };
  const { token } = useToken();
  const [searchText, setSearchText] = useState('');
  const [sortedInfo, setSortedInfo] = useState<SorterResult<DriveFile>>({});
  const [timeFilter, setTimeFilter] = useState<string>('all');

  // Handle table change for sorting
  const handleTableChange: TableProps<DriveFile>['onChange'] = (_, __, sorter) => {
    setSortedInfo(sorter as SorterResult<DriveFile>);
  };

  // Filter files based on search text and time filter
  const filteredFiles = files.filter(file => {
    const matchesSearch = file.name.toLowerCase().includes(searchText.toLowerCase());
    
    if (timeFilter === 'all') return matchesSearch;
    
    const fileDate = dayjs(file.modifiedTime);
    const now = dayjs();
    
    switch (timeFilter) {
      case 'today':
        return matchesSearch && fileDate.isAfter(now.startOf('day'));
      case 'week':
        return matchesSearch && fileDate.isAfter(now.subtract(7, 'day'));
      case 'month':
        return matchesSearch && fileDate.isAfter(now.subtract(30, 'day'));
      default:
        return matchesSearch;
    }
  });

  // Extract date from filename (e.g., "2025-03-14.json" -> "2025-03-14")
  const getDateFromFilename = (filename: string) => {
    const match = filename.match(/(\d{4}-\d{2}-\d{2})\.json/);
    return match ? match[1] : filename;
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const columns = [
    {
      title: t('backup_date'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Tooltip title={name}>
          <Text strong>{getDateFromFilename(name)}</Text>
        </Tooltip>
      ),
      sorter: (a: DriveFile, b: DriveFile) => a.name.localeCompare(b.name),
      sortOrder: sortedInfo.columnKey === 'name' ? sortedInfo.order : null,
      ellipsis: true,
      width: '40%',
    },
    {
      title: t('modified'),
      key: 'modified',
      render: (_, record: DriveFile) => (
        <Text type="secondary" style={{ fontSize: '13px' }}>
          {formatDate(record.modifiedTime)}
        </Text>
      ),
      sorter: (a: DriveFile, b: DriveFile) => 
        new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime(),
      sortOrder: sortedInfo.columnKey === 'modified' ? sortedInfo.order : null,
      width: '25%',
    },
    {
      title: t('actions'),
      key: 'actions',
      render: (_, record: DriveFile) => (
        <Space size="small">
          <Tooltip title={t('view_chat_records')}>
            <Button
              type="default"
              icon={<EyeOutlined />}
              onClick={() => handleViewRecords(record)}
              size="small"
              style={{
                borderColor: token.colorInfo,
                color: token.colorInfo
              }}
            />
          </Tooltip>
          <Tooltip title={t('restore_this_backup')}>
            <ActionButton
              type="primary"
              icon={<CloudDownloadOutlined />}
              onClick={() => onRestore(record.id, record.name)}
              loading={loadingFileId === record.id}
              size="small"
              style={{
                background: token.colorSuccess,
                borderColor: token.colorSuccess
              }}
            />
          </Tooltip>
          <Tooltip title={t('download_to_local')}>
            <Button
              type="default"
              icon={<DownloadOutlined />}
              onClick={() => onDownload(record.id, record.name)}
              loading={loadingFileId === record.id}
              size="small"
              style={{
                borderColor: token.colorPrimary,
                color: token.colorPrimary
              }}
            />
          </Tooltip>
          <Tooltip title={t('delete_this_backup')}>
            <Popconfirm
              title={t('delete_file')}
              description={t('delete_file_confirm', { fileName: record.name })}
              onConfirm={() => onDelete(record.id)}
              okText={t('yes')}
              cancelText={t('no')}
            >
              <Button
                type="text"
                danger
                icon={<DeleteOutlined />}
                loading={deletingFileId === record.id}
                size="small"
              />
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
      width: '35%',
      align: 'right' as const,
    },
  ];

  return (
    <Spin spinning={loading}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: 16 }}>
          <Input
            placeholder={t('search_backups')}
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
            style={{ flex: 1 }}
            allowClear
          />
          <Select
            defaultValue="all"
            style={{ width: 120 }}
            onChange={value => setTimeFilter(value)}
            suffixIcon={<FilterOutlined />}
          >
            <Option value="all">{t('all_time')}</Option>
            <Option value="today">{t('today')}</Option>
            <Option value="week">{t('this_week')}</Option>
            <Option value="month">{t('this_month')}</Option>
          </Select>
        </div>
        
        {filteredFiles.length > 0 ? (
          <Table
            columns={columns}
            dataSource={filteredFiles}
            rowKey="id"
            pagination={{ 
              pageSize: 8,
              showSizeChanger: true,
              pageSizeOptions: ['8', '16', '32'],
              size: 'small',
              showTotal: (total) => t('items_count', { count: total.toString() })
            }}
            size="small"
            onChange={handleTableChange}
            scroll={{ y: 350 }}
            style={{ 
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          />
        ) : (
          <Empty
            description={
              <Text type="secondary" style={{ fontSize: "15px" }}>
                {searchText || timeFilter !== 'all' ? t('no_matching_backup_files') : t('no_backup_files')}
              </Text>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Space>

      {/* Chat Records Modal */}
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
    </Spin>
  );
};

export default FileList; 