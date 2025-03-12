import React, { useState, useEffect } from 'react';
import { Typography, Button, Tooltip, Badge, Modal, Spin, Space, List, message } from 'antd';
import styled from '@emotion/styled';
import dayjs from 'dayjs';
import { LeftOutlined, RightOutlined, SearchOutlined, QuestionCircleOutlined, SettingOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { StorageFactory } from '../background/data-persistence/storage-factory';
import GoogleCalendarService from '../utils/google-calendar';
import type { Transcript } from '../hooks/useTranscripts';

const { Title, Text } = Typography;

interface CalendarEvent {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  hasLocalChat: boolean;
  chatRecords?: Transcript[];
}

const CalendarContainer = styled.div`
  background: #1e1e1e;
  min-height: 100vh;
  padding: 20px;
  color: #fff;
`;

const CalendarHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const WeekGrid = styled.div`
  display: grid;
  grid-template-columns: 60px repeat(7, 1fr);
  gap: 1px;
  background: #2d2d2d;
  border-radius: 8px;
  overflow: hidden;
`;

const TimeColumn = styled.div`
  display: flex;
  flex-direction: column;
`;

const TimeSlot = styled.div`
  height: 60px;
  padding: 4px;
  color: #888;
  font-size: 12px;
  text-align: right;
  padding-right: 8px;
  border-bottom: 1px solid #333;
`;

const DayColumn = styled.div`
  display: flex;
  flex-direction: column;
  background: #252525;
`;

const DayHeader = styled.div<{ isToday?: boolean }>`
  padding: 8px;
  text-align: center;
  background: ${props => props.isToday ? '#4a4a4a' : '#2d2d2d'};
  border-bottom: 1px solid #333;

  .day-number {
    display: inline-block;
    width: 32px;
    height: 32px;
    line-height: 32px;
    border-radius: 16px;
    background: ${props => props.isToday ? '#1890ff' : 'transparent'};
  }
`;

const EventBlock = styled.div<{ duration: number; hasLocalChat: boolean }>`
  position: absolute;
  width: calc(100% - 8px);
  margin: 0 4px;
  height: ${props => props.duration * 60}px;
  background: ${props => props.hasLocalChat ? '#1890ff33' : '#1890ff1a'};
  border-left: 3px solid ${props => props.hasLocalChat ? '#1890ff' : '#1890ff66'};
  border-radius: 4px;
  padding: 4px;
  font-size: 12px;
  cursor: pointer;
  overflow: hidden;
  transition: all 0.3s;

  &:hover {
    background: ${props => props.hasLocalChat ? '#1890ff4d' : '#1890ff2a'};
  }
`;

const TimeGrid = styled.div`
  position: relative;
  height: 960px; // 16 hours * 60px
`;

const TimeGridBackground = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-rows: repeat(16, 60px);
`;

const TimeGridLine = styled.div`
  border-bottom: 1px solid #333;
`;

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loading, setLoading] = useState(false);
  const calendarService = GoogleCalendarService.getInstance();

  // 生成时间刻度
  const hours = Array.from({ length: 16 }, (_, i) => i + 8); // 8 AM to 11 PM

  // 生成一周的日期
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = currentDate.startOf('week').add(i, 'day');
    return {
      date,
      dayName: date.format('ddd').toUpperCase(),
      dayNumber: date.date(),
      isToday: date.isSame(dayjs(), 'day')
    };
  });

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      // 获取当前周的开始和结束时间
      const startDate = currentDate.startOf('week');
      const endDate = currentDate.endOf('week');

      // 获取Google Calendar事件
      const googleEvents = await calendarService.getEvents(startDate, endDate);
      
      // 获取本地聊天记录的日期列表
      const storage = StorageFactory.getInstance().getProvider();
      const datesWithChats = await storage.getDaysWithMessages();

      // 转换Google Calendar事件为我们的事件格式
      const calendarEvents: CalendarEvent[] = await Promise.all(
        googleEvents.map(async (event) => {
          const startTime = dayjs(event.start.dateTime);
          const hasLocalChat = datesWithChats.includes(startTime.format('YYYY-MM-DD'));
          
          return {
            id: event.id,
            title: event.summary,
            startTime: event.start.dateTime,
            endTime: event.end.dateTime,
            hasLocalChat
          };
        })
      );

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Failed to load events:', error);
      message.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const handleEventClick = async (event: CalendarEvent) => {
    setSelectedEvent(event);
    if (event.hasLocalChat) {
      try {
        const storage = StorageFactory.getInstance().getProvider();
        const date = dayjs(event.startTime);
        const records = await storage.getRecords(date);
        
        // 更新选中事件的聊天记录
        setSelectedEvent({
          ...event,
          chatRecords: records
        });
      } catch (error) {
        console.error('Error loading chat records:', error);
        message.error('Failed to load chat records');
      }
    }
  };

  const handlePrevWeek = () => {
    setCurrentDate(currentDate.subtract(1, 'week'));
  };

  const handleNextWeek = () => {
    setCurrentDate(currentDate.add(1, 'week'));
  };

  const handleToday = () => {
    setCurrentDate(dayjs());
  };

  const getEventPosition = (event: CalendarEvent) => {
    const startTime = dayjs(event.startTime);
    const endTime = dayjs(event.endTime);
    const duration = endTime.diff(startTime, 'hour', true);
    const top = (startTime.hour() - 8) * 60 + startTime.minute();
    
    return {
      top,
      duration
    };
  };

  return (
    <CalendarContainer>
      <CalendarHeader>
        <HeaderLeft>
          <Button type="text" icon={<LeftOutlined />} onClick={handlePrevWeek} />
          <Button type="text" icon={<RightOutlined />} onClick={handleNextWeek} />
          <Title level={4} style={{ margin: 0, color: '#fff' }}>
            {currentDate.format('MMMM YYYY')}
          </Title>
          <Button type="text" onClick={handleToday}>Today</Button>
          <Button type="text">Week</Button>
        </HeaderLeft>
        <HeaderRight>
          <Button type="text" icon={<SearchOutlined />} />
          <Button type="text" icon={<QuestionCircleOutlined />} />
          <Button type="text" icon={<SettingOutlined />} />
        </HeaderRight>
      </CalendarHeader>

      <Spin spinning={loading}>
        <WeekGrid>
          <TimeColumn>
            <DayHeader style={{ visibility: 'hidden' }}>
              <div className="day-name"></div>
              <div className="day-number"></div>
            </DayHeader>
            {hours.map(hour => (
              <TimeSlot key={hour}>
                {hour}:00
              </TimeSlot>
            ))}
          </TimeColumn>

          {weekDays.map(({ date, dayName, dayNumber, isToday }) => (
            <DayColumn key={date.format()}>
              <DayHeader isToday={isToday}>
                <div style={{ marginBottom: 4 }}>{dayName}</div>
                <div className="day-number">{dayNumber}</div>
              </DayHeader>
              <TimeGrid>
                <TimeGridBackground>
                  {hours.map(hour => (
                    <TimeGridLine key={hour} />
                  ))}
                </TimeGridBackground>
                {events
                  .filter(event => dayjs(event.startTime).isSame(date, 'day'))
                  .map(event => {
                    const { top, duration } = getEventPosition(event);
                    return (
                      <EventBlock
                        key={event.id}
                        style={{ top: `${top}px` }}
                        duration={duration}
                        hasLocalChat={event.hasLocalChat}
                        onClick={() => handleEventClick(event)}
                      >
                        <Tooltip title={event.title}>
                          <div>{event.title}</div>
                        </Tooltip>
                      </EventBlock>
                    );
                  })}
              </TimeGrid>
            </DayColumn>
          ))}
        </WeekGrid>
      </Spin>

      <Modal
        title="Event Details"
        open={!!selectedEvent}
        onCancel={() => setSelectedEvent(null)}
        footer={null}
        width={800}
      >
        {selectedEvent && (
          <div>
            <Title level={4}>{selectedEvent.title}</Title>
            <Space direction="vertical" style={{ width: '100%', marginBottom: 24 }}>
              <Text>
                <ClockCircleOutlined style={{ marginRight: 8 }} />
                {dayjs(selectedEvent.startTime).format('YYYY-MM-DD HH:mm')} - 
                {dayjs(selectedEvent.endTime).format('HH:mm')}
              </Text>
            </Space>
            
            {selectedEvent.hasLocalChat && selectedEvent.chatRecords && (
              <div>
                <Title level={5}>Chat Records</Title>
                <List
                  dataSource={selectedEvent.chatRecords}
                  renderItem={(record) => (
                    <List.Item>
                      <List.Item.Meta
                        title={record.activeSpeaker}
                        description={record.talkContent}
                      />
                      <Text type="secondary">
                        {dayjs(record.timestamp).format('HH:mm:ss')}
                      </Text>
                    </List.Item>
                  )}
                />
              </div>
            )}
          </div>
        )}
      </Modal>
    </CalendarContainer>
  );
};

export default Calendar; 