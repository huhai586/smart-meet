import React, { useEffect, useState } from 'react';
import { Modal, List, Typography, Space, Spin, Empty, Tag, Avatar } from 'antd';
import { UserOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { GoogleDriveService } from '~utils/google-drive';
import type { DriveFile } from './types';
import type { Transcript } from '~hooks/useTranscripts';

const { Text, Title } = Typography;

interface ChatRecordsModalProps {
  visible: boolean;
  file: DriveFile;
  onClose: () => void;
}

const ChatRecordsModal: React.FC<ChatRecordsModalProps> = ({
  visible,
  file,
  onClose
}) => {
  const [loading, setLoading] = useState(false);
  const [records, setRecords] = useState<Transcript[]>([]);

  // Load chat records when modal opens
  useEffect(() => {
    if (visible && file) {
      loadChatRecords();
    }
  }, [visible, file]);

  const loadChatRecords = async () => {
    setLoading(true);
    try {
      const driveService = GoogleDriveService.getInstance();
      const content = await driveService.downloadFile(file.id);
      
      // content should be an array of Transcript objects
      if (Array.isArray(content)) {
        // Sort by timestamp
        const sortedRecords = content.sort((a, b) => a.timestamp - b.timestamp);
        setRecords(sortedRecords);
      } else {
        console.error('Invalid file format:', content);
        setRecords([]);
      }
    } catch (error) {
      console.error('Failed to load chat records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  // Extract date from filename
  const getDateFromFilename = (filename: string) => {
    const match = filename.match(/(\d{4}-\d{2}-\d{2})\.json/);
    return match ? match[1] : filename;
  };

  return (
    <Modal
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>
            Chat Records
          </Title>
          <Tag color="blue">{getDateFromFilename(file.name)}</Tag>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      width={800}
      footer={null}
      style={{ top: 20 }}
    >
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text type="secondary">Loading chat records...</Text>
          </div>
        </div>
      ) : records.length === 0 ? (
        <Empty
          description="No chat records found"
          style={{ padding: '40px 0' }}
        />
      ) : (
        <List
          dataSource={records}
          renderItem={(record) => (
            <List.Item
              key={record.session}
              style={{
                padding: '16px',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    icon={<UserOutlined />}
                    style={{ backgroundColor: '#1890ff' }}
                  />
                }
                title={
                  <Space>
                    <Text strong>{record.activeSpeaker || 'Unknown'}</Text>
                    <Tag
                      icon={<ClockCircleOutlined />}
                      color="default"
                      style={{ fontSize: '12px' }}
                    >
                      {formatTime(record.timestamp)}
                    </Tag>
                  </Space>
                }
                description={
                  <div style={{ marginTop: 8 }}>
                    <Text>{record.talkContent}</Text>
                  </div>
                }
              />
            </List.Item>
          )}
          style={{
            maxHeight: '500px',
            overflow: 'auto',
            border: '1px solid #f0f0f0',
            borderRadius: '4px'
          }}
        />
      )}
      
      {!loading && records.length > 0 && (
        <div style={{ marginTop: 16, textAlign: 'center' }}>
          <Text type="secondary">
            Total {records.length} message{records.length > 1 ? 's' : ''}
          </Text>
        </div>
      )}
    </Modal>
  );
};

export default ChatRecordsModal;
