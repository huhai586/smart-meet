import React, { useEffect } from 'react';
import { CalendarOutlined, CloseOutlined, WarningOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import DateRangeSelector from './DateRangeSelector';
import ChatMessages from './ChatMessages';
import ChatInputBar from './ChatInputBar';
import { useAIChat } from './useAIChat';
import './ai-chat.scss';

const AIChatPanel: React.FC = () => {
  const {
    messages, dateRange, recordCount, loadPhase, hasProvider,
    configuredProviders, selectedProviderName, setSelectedProviderName,
    setDateRange, sendMessage, clearMessages,
  } = useAIChat();

  // Default to last 7 days on first mount
  useEffect(() => {
    const end = dayjs();
    const start = end.subtract(6, 'day');
    setDateRange([start, end]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isLoading = loadPhase !== 'idle';

  const capsuleText = dateRange
    ? `${dateRange[0].format('M月D日')} - ${dateRange[1].format('M月D日')}（共 ${recordCount} 条记录）`
    : '';

  return (
    <div className="ai-chat">
      {/* Date range selector */}
      <DateRangeSelector
        value={dateRange}
        onChange={(range) => setDateRange(range as [Dayjs, Dayjs] | null)}
        loading={isLoading}
      />

      {/* Range capsule */}
      {dateRange && (
        <div className="ai-chat__capsule">
          <CalendarOutlined className="ai-chat__capsule-icon" />
          <span className="ai-chat__capsule-text">{capsuleText}</span>
          {messages.length > 0 && (
            <button
              className="ai-chat__capsule-clear"
              onClick={clearMessages}
              title="清除对话"
            >
              <CloseOutlined />
            </button>
          )}
        </div>
      )}

      {/* No provider warning */}
      {!hasProvider && (
        <div className="ai-chat__no-provider">
          <WarningOutlined />
          <span>
            尚未配置 AI 服务，请先{' '}
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                window.location.hash = 'ai-settings';
              }}
            >
              前往 AI 设置
            </a>{' '}
            配置服务商。
          </span>
        </div>
      )}

      {/* Messages */}
      <ChatMessages messages={messages} loadPhase={loadPhase} recordCount={recordCount} />

      {/* Input */}
      <ChatInputBar
        onSend={sendMessage}
        disabled={isLoading || !dateRange || !hasProvider}
        placeholder={
          !dateRange
            ? '请先选择日期范围...'
            : !hasProvider
            ? '请先配置 AI 服务...'
            : '输入问题… (Enter 发送)'
        }
        configuredProviders={configuredProviders}
        selectedProviderName={selectedProviderName}
        onSelectProvider={setSelectedProviderName}
      />
    </div>
  );
};

export default AIChatPanel;
