import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Typography, Button, Modal, Spin, List, message, Card, Collapse, Badge, Empty, Divider, Statistic, Input, Space, Tag } from 'antd';
import styled from '@emotion/styled';
import dayjs from 'dayjs';
import { CalendarOutlined, MessageOutlined, SearchOutlined, LoadingOutlined, HighlightOutlined } from '@ant-design/icons';
import { StorageFactory } from '../../background/data-persistence/storage-factory';
import type { Transcript } from '../../hooks/useTranscripts';
import StyledTitle from '../common/StyledTitle';
import { useI18n } from '../../utils/i18n';

const { Title, Text, Paragraph } = Typography;
const { Panel } = Collapse;
const { Search } = Input;

const CalendarContainer = styled.div`
  background: #fff;
  padding: 24px;
  min-height: 100vh;
`;

const MonthCard = styled(Card)`
  margin-bottom: 24px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  
  .ant-card-head {
    background: #f7f7f7;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
  }
`;

const DateItem = styled(List.Item)`
  cursor: pointer;
  transition: all 0.3s;
  border-radius: 6px;
  
  &:hover {
    background-color: #f5f5f5;
  }
`;

const StyledBadge = styled(Badge)`
  .ant-badge-count {
    background-color: #1a73e8;
    box-shadow: 0 0 0 1px #fff;
  }
`;

const MonthStatistic = styled.div`
  display: flex;
  align-items: center;
  margin-left: 16px;
  
  .ant-statistic {
    margin-bottom: 0;
  }
  
  .ant-statistic-content {
    font-size: 14px;
    color: #1a73e8;
  }
`;

const SearchContainer = styled.div`
  margin-bottom: 24px;
  max-width: 600px;
`;

const LoadingContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  
  .loading-text {
    margin-top: 16px;
    color: #1a73e8;
  }
`;

const PreviewContainer = styled.div`
  margin-top: 8px;
  margin-left: 40px;
  padding: 8px 12px;
  background-color: #f9f9f9;
  border-left: 3px solid #1a73e8;
  border-radius: 0 4px 4px 0;
  cursor: pointer;
  
  &:hover {
    background-color: #f0f8ff;
  }
`;

const HighlightedText = styled.span`
  background-color: #ffd54f;
  padding: 0 2px;
  border-radius: 2px;
  font-weight: 500;
  scroll-margin: 100px;
  display: inline-block;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.1);
  position: relative;
  z-index: 2;
`;

interface ChatDay {
  date: string; // YYYY-MM-DD
  formattedDate: string; // 显示用的日期格式
  dayOfWeek: string; // 星期几
  messageCount: number; // 消息数量
  matchedRecords?: MatchedRecord[]; // 匹配的记录
}

interface MonthData {
  month: string; // YYYY-MM
  formattedMonth: string; // 显示用的月份格式
  days: ChatDay[];
  totalMessages: number; // 该月总消息数量
}

interface MatchedRecord {
  transcript: Transcript;
  matchIndex: number; // 匹配的位置
  previewText: string; // 预览文本
}

const Calendar = () => {
  const { t } = useI18n();
  const [monthsData, setMonthsData] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [chatRecords, setChatRecords] = useState<Transcript[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [contentSearchText, setContentSearchText] = useState('');
  const [messageCountCache, setMessageCountCache] = useState<Map<string, number>>(new Map());
  const [allRecordsCache, setAllRecordsCache] = useState<Map<string, Transcript[]>>(new Map());
  const [isSearchingContent, setIsSearchingContent] = useState(false);
  const [searchingContentLoading, setSearchingContentLoading] = useState(false);
  const [highlightedRecordIndex, setHighlightedRecordIndex] = useState<number | null>(null);

  const listItemRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatDays();
  }, []);

  // 使用 useMemo 来过滤月份数据，提高性能
  const filteredMonthsData = useMemo(() => {
    if (!searchText && !contentSearchText) return monthsData;

    return monthsData
      .map(month => {
        // 过滤符合搜索条件的日期
        const filteredDays = month.days.filter(day => {
          // 如果是按内容搜索，只保留有匹配记录的日期
          if (contentSearchText) {
            return day.matchedRecords && day.matchedRecords.length > 0;
          }

          // 否则按日期或星期几搜索
          return day.date.includes(searchText) ||
                 day.dayOfWeek.toLowerCase().includes(searchText.toLowerCase());
        });

        if (filteredDays.length === 0) return null;

        // 计算过滤后的总消息数
        const totalMessages = filteredDays.reduce((sum, day) => sum + day.messageCount, 0);

        return {
          ...month,
          days: filteredDays,
          totalMessages
        };
      })
      .filter(Boolean) as MonthData[];
  }, [monthsData, searchText, contentSearchText]);

  const loadChatDays = async () => {
    try {
      setLoading(true);
      const storage = StorageFactory.getInstance().getProvider();
      const datesWithMessages = await storage.getDaysWithMessages();

      if (datesWithMessages.length === 0) {
        setLoading(false);
        return;
      }

      // 按月份分组
      const monthsMap = new Map<string, ChatDay[]>();
      const messageCountMap = new Map<string, number>();
      const recordsCache = new Map<string, Transcript[]>();

      // 对日期进行排序（从新到旧）
      const sortedDates = [...datesWithMessages].sort((a, b) =>
        dayjs(b).valueOf() - dayjs(a).valueOf()
      );

      // 获取每个日期的消息数量和记录（使用 Promise.all 并行加载提高性能）
      const messageCountPromises = sortedDates.map(async (dateStr) => {
        const records = await storage.getRecords(dayjs(dateStr));
        recordsCache.set(dateStr, records);
        return { dateStr, count: records.length };
      });

      const messageCountResults = await Promise.all(messageCountPromises);

      // 将结果存入 Map
      messageCountResults.forEach(({ dateStr, count }) => {
        messageCountMap.set(dateStr, count);
      });

      // 缓存消息数量和记录，以便后续使用
      setMessageCountCache(messageCountMap);
      setAllRecordsCache(recordsCache);

      // 为每个日期创建数据结构并按月份分组
      for (const dateStr of sortedDates) {
        const date = dayjs(dateStr);
        const monthKey = date.format('YYYY-MM');

        const chatDay: ChatDay = {
          date: dateStr,
          formattedDate: date.format('DD'),
          dayOfWeek: date.format('dddd'),
          messageCount: messageCountMap.get(dateStr) || 0
        };

        if (!monthsMap.has(monthKey)) {
          monthsMap.set(monthKey, []);
        }

        monthsMap.get(monthKey)!.push(chatDay);
      }

      // 转换为组件所需的数据结构
      const monthsData: MonthData[] = [];

      for (const [monthKey, days] of monthsMap.entries()) {
        const monthDate = dayjs(monthKey + '-01');
        const totalMessages = days.reduce((sum, day) => sum + day.messageCount, 0);

        monthsData.push({
          month: monthKey,
          formattedMonth: monthDate.format('MMMM YYYY'),
          days,
          totalMessages
        });
      }

      setMonthsData(monthsData);
    } catch (error) {
      console.error('Failed to load chat days:', error);
      message.error('Failed to load chat history');
    } finally {
      setLoading(false);
    }
  };

  const handleDateClick = async (date: string) => {
    try {
      setSelectedDate(date);
      setModalVisible(true);
      setModalLoading(true);
      setHighlightedRecordIndex(null);

      // 清除内容搜索文本
      setContentSearchText('');

      // 如果缓存中有记录，直接使用缓存
      if (allRecordsCache.has(date)) {
        setChatRecords(allRecordsCache.get(date) || []);
        setModalLoading(false);
        return;
      }

      const storage = StorageFactory.getInstance().getProvider();
      const records = await storage.getRecords(dayjs(date));

      setChatRecords(records);
    } catch (error) {
      console.error('Failed to load chat records:', error);
      message.error('Failed to load chat records');
    } finally {
      setModalLoading(false);
    }
  };

  const handlePreviewClick = async (date: string, recordIndex: number, searchTerm?: string) => {
    try {
      setSelectedDate(date);
      setModalVisible(true);
      setModalLoading(true);
      setHighlightedRecordIndex(recordIndex);

      // 如果有搜索词，设置内容搜索文本
      if (searchTerm) {
        setContentSearchText(searchTerm);
      }

      // 如果缓存中有记录，直接使用缓存
      if (allRecordsCache.has(date)) {
        setChatRecords(allRecordsCache.get(date) || []);
        setModalLoading(false);
        return;
      }

      const storage = StorageFactory.getInstance().getProvider();
      const records = await storage.getRecords(dayjs(date));

      setChatRecords(records);
    } catch (error) {
      console.error('Failed to load chat records:', error);
      message.error('Failed to load chat records');
    } finally {
      setModalLoading(false);
    }
  };

  // 在模态框打开后，确保滚动到高亮文本
  useEffect(() => {
    if (modalVisible && contentSearchText && !modalLoading) {
      // 创建一个MutationObserver来监听DOM变化
      const observer = new MutationObserver((mutations) => {
        const highlightElements = document.querySelectorAll('.highlighted-text');
        if (highlightElements && highlightElements.length > 0) {
          // 找到高亮元素后，滚动到它
          highlightElements[0].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
          // 完成后断开观察器
          observer.disconnect();
        }
      });

      // 开始观察模态框内容的变化
      if (modalContentRef.current) {
        observer.observe(modalContentRef.current, {
          childList: true,
          subtree: true
        });
      }

      // 同时使用定时器作为备份方案
      const scrollToHighlight = () => {
        try {
          const highlightElements = document.querySelectorAll('.highlighted-text');
          if (highlightElements && highlightElements.length > 0) {
            highlightElements[0].scrollIntoView({
              behavior: 'smooth',
              block: 'center'
            });
          }
        } catch (error) {
          console.error('Error scrolling to highlight:', error);
        }
      };

      // 多次尝试滚动，确保DOM已完全渲染
      const timers = [
        setTimeout(scrollToHighlight, 300),
        setTimeout(scrollToHighlight, 600),
        setTimeout(scrollToHighlight, 1000)
      ];

      // 清理函数
      return () => {
        observer.disconnect();
        timers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [modalVisible, contentSearchText, modalLoading]);

  // 滚动到高亮记录
  const scrollToHighlightedRecord = () => {
    if (highlightedRecordIndex !== null) {
      const highlightedElement = listItemRefs.current.get(`record-${highlightedRecordIndex}`);
      if (highlightedElement && modalContentRef.current) {
        // 滚动到列表项
        highlightedElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }
    }

    // 如果有搜索文本，尝试滚动到高亮文本
    if (contentSearchText) {
      setTimeout(() => {
        const highlightElements = document.querySelectorAll('.highlighted-text');
        if (highlightElements && highlightElements.length > 0) {
          highlightElements[0].scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          });
        }
      }, 300);
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    // 如果内容搜索已激活，则清除内容搜索
    if (isSearchingContent) {
      setContentSearchText('');
      setIsSearchingContent(false);
    }
  };

  const handleContentSearch = async (value: string) => {
    if (!value.trim()) {
      setContentSearchText('');
      setIsSearchingContent(false);
      return;
    }

    setContentSearchText(value);
    setIsSearchingContent(true);
    setSearchText('');
    setSearchingContentLoading(true);

    try {
      // 搜索所有日期的聊天记录
      const updatedMonthsData = [...monthsData];

      // 遍历所有月份和日期
      for (const month of updatedMonthsData) {
        for (const day of month.days) {
          // 获取该日期的聊天记录
          const records = allRecordsCache.get(day.date) || [];

          // 搜索匹配的记录
          const matchedRecords: MatchedRecord[] = [];

          for (let i = 0; i < records.length; i++) {
            const record = records[i];
            const content = record.talkContent || '';
            const matchIndex = content.toLowerCase().indexOf(value.toLowerCase());

            if (matchIndex !== -1) {
              // 创建预览文本，显示匹配关键词前后的一些文本
              const previewStart = Math.max(0, matchIndex - 20);
              const previewEnd = Math.min(content.length, matchIndex + value.length + 20);
              let previewText = content.substring(previewStart, previewEnd);

              // 如果预览不是从头开始，添加省略号
              if (previewStart > 0) {
                previewText = '...' + previewText;
              }

              // 如果预览不是到末尾结束，添加省略号
              if (previewEnd < content.length) {
                previewText = previewText + '...';
              }

              matchedRecords.push({
                transcript: record,
                matchIndex,
                previewText
              });

              // 只保留最多3条匹配记录
              if (matchedRecords.length >= 3) break;
            }
          }

          // 更新日期的匹配记录
          day.matchedRecords = matchedRecords;
        }
      }

      setMonthsData(updatedMonthsData);
    } catch (error) {
      console.error('Failed to search content:', error);
      message.error('Failed to search chat content');
    } finally {
      setSearchingContentLoading(false);
    }
  };

  const highlightText = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;

    try {
      // 使用不区分大小写的正则表达式
      const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      const parts = text.split(regex);

      return (
        <>
          {parts.map((part, index) => {
            if (part.toLowerCase() === searchTerm.toLowerCase()) {
              return (
                <HighlightedText
                  className="highlighted-text"
                  key={index}
                  id={`highlight-${index}`}
                >
                  {part}
                </HighlightedText>
              );
            }
            return part;
          })}
        </>
      );
    } catch (error) {
      console.error('Error highlighting text:', error);
      return text;
    }
  };

  const renderMonthCollapse = () => {
    if (filteredMonthsData.length === 0) {
      return (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            contentSearchText
              ? t('no_matching_content')
              : searchText
                ? t('no_matching_history')
                : t('no_chat_history')
          }
        />
      );
    }

    return (
      <div>
        {filteredMonthsData.map((month) => (
          <MonthCard
            key={month.month}
            title={
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <CalendarOutlined style={{ marginRight: 8 }} />
                <span>{month.formattedMonth}</span>
                <MonthStatistic>
                  <Statistic
                    value={month.totalMessages}
                    suffix={month.totalMessages === 1 ? "message" : "messages"}
                    valueStyle={{ fontSize: '14px', color: '#1a73e8' }}
                  />
                </MonthStatistic>
              </div>
            }
          >
            <List
              dataSource={month.days}
              renderItem={(day) => (
                <>
                  <DateItem onClick={() => handleDateClick(day.date)}>
                    <List.Item.Meta
                      avatar={
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          background: '#f0f5ff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          color: '#1a73e8'
                        }}>
                          {day.formattedDate}
                        </div>
                      }
                      title={day.dayOfWeek}
                      description={
                        <div>
                          <MessageOutlined style={{ marginRight: 4 }} />
                          <span>{day.messageCount} {day.messageCount === 1 ? 'message' : 'messages'}</span>
                        </div>
                      }
                    />
                    <StyledBadge count={day.messageCount} />
                  </DateItem>

                  {/* 显示匹配的记录预览 */}
                  {contentSearchText && day.matchedRecords && day.matchedRecords.length > 0 && (
                    <div>
                      {day.matchedRecords.map((match, index) => (
                        <PreviewContainer
                          key={index}
                          onClick={() => handlePreviewClick(day.date, day.matchedRecords!.findIndex(m => m === match), contentSearchText)}
                        >
                          <Space direction="vertical" size={0} style={{ width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: '12px' }}>
                              {match.transcript.activeSpeaker} - {dayjs(match.transcript.timestamp).format('HH:mm:ss')}
                            </Text>
                            <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                              {highlightText(match.previewText, contentSearchText)}
                            </Paragraph>
                          </Space>
                        </PreviewContainer>
                      ))}
                    </div>
                  )}
                </>
              )}
            />
          </MonthCard>
        ))}
      </div>
    );
  };

  const renderLoading = () => (
    <LoadingContainer>
      <Spin indicator={<LoadingOutlined style={{ fontSize: 40 }} spin />} />
      <div className="loading-text">
        {searchingContentLoading ? t('searching_content') : t('loading_history')}
      </div>
    </LoadingContainer>
  );

  return (
    <div>
      <StyledTitle subtitle={t('chat_history_desc')}>{t('chat_history')}</StyledTitle>

      <div style={{ padding: "0 20px" }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <SearchContainer>
            <Search
              placeholder={t('search_content')}
              allowClear
              enterButton={<Button type="primary" icon={<HighlightOutlined />}>{t('search_button')}</Button>}
              onSearch={handleContentSearch}
              onChange={(e) => !e.target.value && handleContentSearch('')}
              loading={searchingContentLoading}
            />
            {contentSearchText && (
              <div style={{ marginTop: 8 }}>
                <Tag color="blue">{t('search_for', { term: contentSearchText })}</Tag>
                <Button
                  type="link"
                  size="small"
                  onClick={() => handleContentSearch('')}
                  disabled={searchingContentLoading}
                >
                  {t('clear')}
                </Button>
              </div>
            )}
          </SearchContainer>
        </Space>

        <Divider />

        {loading || searchingContentLoading ? renderLoading() : renderMonthCollapse()}

        <Modal
          title={selectedDate ? t('chat_records', { date: dayjs(selectedDate).format('YYYY-MM-DD') }) : ''}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          footer={null}
          width={800}
          bodyStyle={{ maxHeight: '70vh', overflow: 'auto' }}
        >
          {modalLoading ? (
            <div style={{ padding: '40px 0' }}>
              <Spin indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} />
              <div style={{ marginTop: 16 }}>{t('loading')}</div>
            </div>
          ) : chatRecords.length === 0 ? (
            <Empty description={t('no_records_for_date')} />
          ) : (
            <div ref={modalContentRef}>
              <Spin spinning={modalLoading}>
                <List
                  dataSource={chatRecords}
                  renderItem={(record, index) => {
                    // 只有在内容搜索模式下且是高亮记录时才应用背景色
                    const isHighlighted = highlightedRecordIndex === index && contentSearchText;

                    return (
                      <List.Item
                        ref={(el) => {
                          if (el) {
                            listItemRefs.current.set(`record-${index}`, el);
                          }
                        }}
                        style={{
                          backgroundColor: isHighlighted ? '#e6f3ff' : 'transparent',
                          transition: 'background-color 0.3s'
                        }}
                      >
                        <List.Item.Meta
                          title={record.activeSpeaker}
                          description={
                            contentSearchText ?
                              highlightText(record.talkContent, contentSearchText) :
                              record.talkContent
                          }
                        />
                        <Text type="secondary">
                          {dayjs(record.timestamp).format('HH:mm:ss')}
                        </Text>
                      </List.Item>
                    );
                  }}
                />
              </Spin>
            </div>
          )}
        </Modal>
      </div>
    </div>
  );
};

export default Calendar;
