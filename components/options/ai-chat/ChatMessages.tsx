import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import MarkdownRenderer from '~components/summary/MarkdownRenderer';
import { useI18n } from '~/utils/i18n';
import type { ChatMsg, LoadPhase } from './useAIChat';

interface Props {
  messages: ChatMsg[];
  loadPhase: LoadPhase;
  recordCount: number;
}

const ChatMessages: React.FC<Props> = ({ messages, loadPhase, recordCount }) => {
  const { t } = useI18n();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadPhase]);

  if (messages.length === 0 && loadPhase === 'idle') {
    return (
      <div className="ai-chat__empty-state">
        <div className="ai-chat__empty-state-icon">💬</div>
        <div className="ai-chat__empty-state-title">{t('ai_chat_title')}</div>
        <div className="ai-chat__empty-state-desc">
          {t('ai_chat_empty_desc')}
        </div>
      </div>
    );
  }

  return (
    <div className="ai-chat__messages">
      {messages.map(msg => {
        if (msg.role === 'user') {
          return (
            <div key={msg.id} className="ai-chat__bubble-row ai-chat__bubble-row--user">
              <div className="ai-chat__bubble ai-chat__bubble--user">{msg.content}</div>
            </div>
          );
        }

        if (msg.role === 'error') {
          return (
            <div key={msg.id} className="ai-chat__bubble-row ai-chat__bubble-row--ai">
              <div className="ai-chat__bubble ai-chat__bubble--error">
                <ExclamationCircleOutlined style={{ marginRight: 6 }} />
                {msg.content}
              </div>
            </div>
          );
        }

        // assistant
        return (
          <div key={msg.id} className="ai-chat__bubble-row ai-chat__bubble-row--ai">
            <div className="ai-chat__bubble ai-chat__bubble--ai">
              <MarkdownRenderer content={msg.content} />
            </div>
          </div>
        );
      })}

      {/* Loading context */}
      {loadPhase === 'loading-context' && (
        <div className="ai-chat__context-card">
          <Spin indicator={<LoadingOutlined style={{ fontSize: 16 }} spin />} />
          <span className="ai-chat__context-card-text">
            {t('ai_reading_records')}（{recordCount > 0 ? t('ai_found_records', { count: recordCount }) : t('loading') + '...'}）
          </span>
        </div>
      )}

      {/* Thinking */}
      {loadPhase === 'thinking' && (
        <div className="ai-chat__thinking">
          <span /><span /><span />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
