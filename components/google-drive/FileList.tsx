import React, { useState } from 'react';
import { Table, Button, Popconfirm, Typography, Empty, Spin, theme, Tooltip, Input, Space, Select } from 'antd';
import { CloudDownloadOutlined, DeleteOutlined, SearchOutlined, FilterOutlined, DownloadOutlined } from '@ant-design/icons';
import type { DriveFile } from './types';
import { ActionButton } from './StyledComponents';
import type { TableProps } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import dayjs from 'dayjs';

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
      title: 'Backup Date',
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
      title: 'Modified',
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
      title: 'Actions',
      key: 'actions',
      render: (_, record: DriveFile) => (
        <Space size="small">
          <Tooltip title="Restore this backup">
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
          <Tooltip title="Download to local">
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
          <Tooltip title="Delete this backup">
            <Popconfirm
              title="Delete file"
              description={`Are you sure you want to delete "${record.name}"?`}
              onConfirm={() => onDelete(record.id)}
              okText="Yes"
              cancelText="No"
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
            placeholder="Search backups..."
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
            <Option value="all">All Time</Option>
            <Option value="today">Today</Option>
            <Option value="week">This Week</Option>
            <Option value="month">This Month</Option>
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
              showTotal: (total) => `${total} items`
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
                {searchText || timeFilter !== 'all' ? "No matching backup files found" : "No backup files found"}
              </Text>
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Space>
    </Spin>
  );
};

export default FileList; 