import React from 'react';
import { CalendarOutlined, CloseOutlined, WarningOutlined } from '@ant-design/icons';
import { type Dayjs } from 'dayjs';
import DateRangeSelector from './DateRangeSelector';
import ChatMessages from './ChatMessages';
import ChatInputBar from './ChatInputBar';
import { useAIChat } from './useAIChat';
import useI18n from '~/utils/i18n';
import './ai-chat.scss';

const AIChatPanel: React.FC = () => {
  const { t } = useI18n();
  const {
    messages, dateRange, recordCount, loadPhase, hasProvider,
    configuredProviders, selectedProviderName, setSelectedProviderName,
    setDateRange, sendMessage, clearMessages,
  } = useAIChat();

  const isLoading = loadPhase !== 'idle';

  const capsuleText = dateRange
    ? t('capsule_text', {
        start: dateRange[0].format(t('date_format_short')),
        end: dateRange[1].format(t('date_format_short')),
        count: String(recordCount),
      })
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
              title={t('clear_chat')}
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
            {t('no_ai_provider_before')}{' '}
            <a
              href="#"
              onClick={e => {
                e.preventDefault();
                window.location.hash = 'ai-translation';
              }}
            >
              {t('no_ai_provider_link')}
            </a>{' '}
            {t('no_ai_provider_after')}
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
            ? t('placeholder_no_date')
            : !hasProvider
            ? t('placeholder_no_provider')
            : t('ai_input_placeholder')
        }
        configuredProviders={configuredProviders}
        selectedProviderName={selectedProviderName}
        onSelectProvider={setSelectedProviderName}
      />
    </div>
  );
};

export default AIChatPanel;
