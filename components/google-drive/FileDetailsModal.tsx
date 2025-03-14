import React from 'react';
import { Modal, Table, Typography, Space, Tag, Button } from 'antd';
import { FileTextOutlined, CalendarOutlined, FieldTimeOutlined } from '@ant-design/icons';
import type { DriveFile } from './types';

const { Text } = Typography;

interface FileDetailsModalProps {
  visible: boolean;
  files: DriveFile[];
  onClose: () => void;
}

const FileDetailsModal: React.FC<FileDetailsModalProps> = ({
  visible,
  files,
  onClose
}) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, { 
      year: 'numeric', 
      month: '2-digit', 
      day: '2-digit' 
    });
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString(undefined, { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Extract date from filename (e.g., "2025-03-14.json" -> "2025-03-14")
  const getDateFromFilename = (filename: string) => {
    const match = filename.match(/(\d{4}-\d{2}-\d{2})\.json/);
    return match ? match[1] : filename;
  };

  // Format file size
  const formatFileSize = (size?: number) => {
    if (!size) return 'Unknown';
    
    const kb = size / 1024;
    if (kb < 1024) {
      return `${kb.toFixed(2)} KB`;
    }
    
    const mb = kb / 1024;
    return `${mb.toFixed(2)} MB`;
  };

  const columns = [
    {
      title: 'Backup Date',
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <FileTextOutlined />
          <Text>{getDateFromFilename(name)}</Text>
        </Space>
      ),
      sorter: (a: DriveFile, b: DriveFile) => a.name.localeCompare(b.name),
    },
    {
      title: 'Date Modified',
      dataIndex: 'modifiedTime',
      key: 'modifiedDate',
      render: (time: string) => (
        <Space>
          <CalendarOutlined />
          <Text>{formatDate(time)}</Text>
        </Space>
      ),
      sorter: (a: DriveFile, b: DriveFile) => 
        new Date(a.modifiedTime).getTime() - new Date(b.modifiedTime).getTime(),
    },
    {
      title: 'Time Modified',
      dataIndex: 'modifiedTime',
      key: 'modifiedTime',
      render: (time: string) => (
        <Space>
          <FieldTimeOutlined />
          <Text>{formatTime(time)}</Text>
        </Space>
      ),
    },
    {
      title: 'Size',
      dataIndex: 'size',
      key: 'size',
      render: (size?: number) => (
        <Tag color="blue">{formatFileSize(size)}</Tag>
      ),
      sorter: (a: DriveFile, b: DriveFile) => (a.size || 0) - (b.size || 0),
    },
  ];

  return (
    <Modal
      title="Backup Files Details"
      open={visible}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>
      ]}
    >
      <Table
        columns={columns}
        dataSource={files}
        rowKey="id"
        pagination={{ 
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
          showTotal: (total) => `Total ${total} items`
        }}
        size="small"
        scroll={{ y: 400 }}
      />
    </Modal>
  );
};

export default FileDetailsModal; 