import React, { useEffect, useRef } from 'react';
import { Spin } from 'antd';
import { LoadingOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import MarkdownRenderer from '~components/summary/MarkdownRenderer';
import type { ChatMsg, LoadPhase } from './useAIChat';

interface Props {
  messages: ChatMsg[];
  loadPhase: LoadPhase;
  recordCount: number;
}

const ChatMessages: React.FC<Props> = ({ messages, loadPhase, recordCount }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loadPhase]);

  if (messages.length === 0 && loadPhase === 'idle') {
    return (
      <div className="ai-chat__empty-state">
        <div className="ai-chat__empty-state-icon">💬</div>
        <div className="ai-chat__empty-state-title">AI 会议助手</div>
        <div className="ai-chat__empty-state-desc">
          选择日期范围后，可以基于这段时间的会议记录进行对话
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
            正在读取会议记录（{recordCount > 0 ? `已找到 ${recordCount} 条` : '加载中...'}）
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
