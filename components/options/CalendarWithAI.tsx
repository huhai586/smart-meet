import React, { useState } from 'react';
import Calendar from './Calendar';
import AIChatPanel from './ai-chat/AIChatPanel';
import './ai-chat/ai-chat.scss';

type Tab = 'history' | 'chat';

const CalendarWithAI: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('history');

  return (
    <div className="calendar-with-ai">
      {/* Segment Control */}
      <div className="segment-control">
        <button
          className={`segment-control__btn${activeTab === 'history' ? ' segment-control__btn--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          会议记录
        </button>
        <button
          className={`segment-control__btn${activeTab === 'chat' ? ' segment-control__btn--active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          AI 助手
        </button>
      </div>

      {/* Tab content */}
      <div className={`calendar-with-ai__tab-content${activeTab === 'chat' ? ' calendar-with-ai__tab-content--chat' : ''}`}>
        {activeTab === 'history' ? <Calendar /> : <AIChatPanel />}
      </div>
    </div>
  );
};

export default CalendarWithAI;
