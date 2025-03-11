import React, { useState, useEffect } from 'react';
import { Card, Calendar, Badge, Modal, List, Typography, Empty, Spin } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { StorageFactory } from "~background/data-persistence/storage-factory";
import type { Transcript } from "../hooks/useTranscripts";
import type { Captions } from "google-meeting-captions-resolver";

const { Title, Text } = Typography;

interface ExtendedTranscript extends Captions {
  timestamp: number;
  activeSpeaker: string;
  talkContent: string;
}

const LocalStorageViewer = () => {
  const [datesWithMessages, setDatesWithMessages] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);
  const [messages, setMessages] = useState<ExtendedTranscript[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    loadDatesWithMessages();
  }, []);

  const loadDatesWithMessages = async () => {
    try {
      setLoading(true);
      const storage = StorageFactory.getInstance().getProvider();
      const dates = await storage.getDaysWithMessages();
      setDatesWithMessages(new Set(dates));
    } catch (error) {
      console.error('Failed to load dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateSelect = async (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    if (datesWithMessages.has(dateStr)) {
      try {
        setLoading(true);
        setSelectedDate(date);
        const storage = StorageFactory.getInstance().getProvider();
        const records = await storage.getRecords(date);
        console.log('Retrieved records:', records);

        const validRecords = records.filter(record => {
          const isValid = record && 
            typeof record.timestamp === 'number' && 
            typeof record.activeSpeaker === 'string' &&
            typeof record.talkContent === 'string';
          
          if (!isValid) {
            console.warn('Invalid record:', record);
          }
          return isValid;
        }).map(record => ({
          ...record,
          activeSpeaker: record.activeSpeaker || 'Unknown Speaker',
          talkContent: record.talkContent || '',
        }));

        console.log('Processed records:', validRecords);
        setMessages(validRecords as ExtendedTranscript[]);
        setModalVisible(true);
      } catch (error) {
        console.error('Failed to load messages:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const formatTime = (timestamp: number) => {
    return dayjs(timestamp).format('HH:mm:ss');
  };

  return (
    <div style={{ padding: "8px", maxWidth: "100%", margin: "0" }}>
      <Title level={3} style={{ marginBottom: "16px", textAlign: "center" }}>
        Local Storage Viewer
      </Title>

      <Card bodyStyle={{ padding: "12px" }}>
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <DatabaseOutlined style={{ fontSize: "32px", color: "#1890ff" }} />
          <Title level={4} style={{ margin: "8px 0" }}>
            Chat History Calendar
          </Title>
          <Text type="secondary" style={{ display: "block", fontSize: "12px" }}>
            Click on highlighted dates to view chat history
          </Text>
        </div>

        <Spin spinning={loading}>
          <Calendar
            fullscreen={true}
            dateCellRender={(date) => {
              const dateStr = date.format('YYYY-MM-DD');
              if (datesWithMessages.has(dateStr)) {
                return (
                  <div style={{
                    height: '100%',
                    background: 'rgba(24, 144, 255, 0.1)',
                    border: '1px solid #1890ff',
                    borderRadius: '4px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <div>{date.date()}</div>
                    <Badge status="processing" text="Chat Records" style={{ fontSize: '11px' }} />
                  </div>
                );
              }
              return date.date();
            }}
            onSelect={handleDateSelect}
            style={{ 
              backgroundColor: 'white',
              padding: '12px',
              borderRadius: '8px',
            }}
          />
        </Spin>
      </Card>

      <Modal
        title={`Chat History - ${selectedDate?.format('YYYY-MM-DD')}`}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        width="80%"
        style={{ top: 20 }}
        bodyStyle={{ padding: '12px' }}
      >
        {messages.length > 0 ? (
          <List
            itemLayout="vertical"
            dataSource={messages}
            renderItem={(message) => (
              <List.Item style={{ padding: '8px 0' }}>
                <List.Item.Meta
                  title={<Text strong>{message.activeSpeaker}</Text>}
                  description={formatTime(message.timestamp)}
                  style={{ marginBottom: '4px' }}
                />
                <div style={{ 
                  backgroundColor: '#f5f5f5',
                  padding: '8px',
                  borderRadius: '4px',
                  marginTop: '4px',
                  fontSize: '14px'
                }}>
                  {message.talkContent}
                </div>
              </List.Item>
            )}
            style={{ 
              maxHeight: '70vh',
              overflowY: 'auto',
              padding: '0 8px'
            }}
          />
        ) : (
          <Empty description="No messages found for this date" />
        )}
      </Modal>
    </div>
  );
};

export default LocalStorageViewer; 