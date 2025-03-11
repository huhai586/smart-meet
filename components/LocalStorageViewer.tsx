import React, { useState, useEffect } from 'react';
import { Card, Calendar, Badge, Modal, List, Typography, Empty, Spin, Button, Row, Col, Radio, Space, Tabs } from 'antd';
import { DatabaseOutlined, LeftOutlined, RightOutlined, CalendarOutlined, UnorderedListOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import { StorageFactory } from "~background/data-persistence/storage-factory";
import type { Transcript } from "../hooks/useTranscripts";
import type { Captions } from "google-meeting-captions-resolver";
import type { CalendarMode } from 'antd/es/calendar/generateCalendar';

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
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [viewMode, setViewMode] = useState<CalendarMode>('month');
  const [activeTab, setActiveTab] = useState<string>('calendar');
  const [dayViewMessages, setDayViewMessages] = useState<ExtendedTranscript[]>([]);
  const [dayViewLoading, setDayViewLoading] = useState(false);

  useEffect(() => {
    loadDatesWithMessages();
  }, []);

  useEffect(() => {
    if (activeTab === 'day') {
      loadDayViewMessages(currentDate);
    }
  }, [activeTab, currentDate]);

  const loadDatesWithMessages = async () => {
    try {
      setLoading(true);
      const storage = StorageFactory.getInstance().getProvider();
      const dates = await storage.getDaysWithMessages();
      console.log('Dates with messages:', dates);
      setDatesWithMessages(new Set(dates));
    } catch (error) {
      console.error('Failed to load dates:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDayViewMessages = async (date: Dayjs) => {
    const dateStr = date.format('YYYY-MM-DD');
    if (datesWithMessages.has(dateStr)) {
      try {
        setDayViewLoading(true);
        const storage = StorageFactory.getInstance().getProvider();
        const records = await storage.getRecords(date);

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

        setDayViewMessages(validRecords as ExtendedTranscript[]);
      } catch (error) {
        console.error('Failed to load day view messages:', error);
      } finally {
        setDayViewLoading(false);
      }
    } else {
      setDayViewMessages([]);
    }
  };

  const handleDateSelect = async (date: Dayjs) => {
    setCurrentDate(date);
    
    if (activeTab === 'day') {
      loadDayViewMessages(date);
      return;
    }
    
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

  const handlePrevMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'));
  };

  const handleNextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'));
  };

  const handlePrevDay = () => {
    setCurrentDate(currentDate.subtract(1, 'day'));
  };

  const handleNextDay = () => {
    setCurrentDate(currentDate.add(1, 'day'));
  };

  const handlePanelChange = (date: Dayjs, mode: CalendarMode) => {
    setCurrentDate(date);
    setViewMode(mode);
  };

  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // 自定义日历头部，添加月份切换按钮
  const headerRender = ({ value, type, onChange, onTypeChange }) => {
    const current = value.clone();
    
    return (
      <div style={{ padding: '8px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Space>
          <Button icon={<LeftOutlined />} onClick={handlePrevMonth} />
          <Button>{current.format('YYYY-MM')}</Button>
          <Button icon={<RightOutlined />} onClick={handleNextMonth} />
        </Space>
        
        <Radio.Group 
          value={viewMode} 
          onChange={(e) => onTypeChange(e.target.value)}
          optionType="button" 
          buttonStyle="solid"
        >
          <Radio.Button value="month">Month</Radio.Button>
          <Radio.Button value="year">Year</Radio.Button>
        </Radio.Group>
      </div>
    );
  };

  const renderDayView = () => {
    return (
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <Space>
            <Button icon={<LeftOutlined />} onClick={handlePrevDay} />
            <Button>{currentDate.format('YYYY-MM-DD')}</Button>
            <Button icon={<RightOutlined />} onClick={handleNextDay} />
          </Space>
          
          <Text type="secondary">
            {datesWithMessages.has(currentDate.format('YYYY-MM-DD')) 
              ? 'Chat records available for this date' 
              : 'No chat records for this date'}
          </Text>
        </div>
        
        <Spin spinning={dayViewLoading}>
          {dayViewMessages.length > 0 ? (
            <List
              itemLayout="vertical"
              dataSource={dayViewMessages}
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
            <Empty description={`No messages for ${currentDate.format('YYYY-MM-DD')}`} />
          )}
        </Spin>
      </div>
    );
  };

  return (
    <div style={{ padding: "8px", maxWidth: "100%", margin: "0" }}>
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

        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            {
              key: 'calendar',
              label: (
                <span>
                  <CalendarOutlined />
                  Calendar View
                </span>
              ),
              children: (
                <Spin spinning={loading}>
                  <Calendar
                    fullscreen={true}
                    value={currentDate}
                    onPanelChange={handlePanelChange}
                    headerRender={headerRender}
                    mode={viewMode}
                    onSelect={handleDateSelect}
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
                    style={{
                      backgroundColor: 'white',
                      padding: '12px',
                      borderRadius: '8px',
                    }}
                  />
                </Spin>
              ),
            },
            {
              key: 'day',
              label: (
                <span>
                  <UnorderedListOutlined />
                  Day View
                </span>
              ),
              children: renderDayView(),
            },
          ]}
        />
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
