import React, { useState } from 'react';
import { useI18n } from '~/utils/i18n';
import Calendar from './Calendar';
import AIChatPanel from './ai-chat/AIChatPanel';
import './ai-chat/ai-chat.scss';

type Tab = 'history' | 'chat';

const CalendarWithAI: React.FC = () => {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState<Tab>('history');

  return (
    <div className="calendar-with-ai">
      {/* Segment Control */}
      <div className="segment-control">
        <button
          className={`segment-control__btn${activeTab === 'history' ? ' segment-control__btn--active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          {t('meeting_history_tab')}
        </button>
        <button
          className={`segment-control__btn${activeTab === 'chat' ? ' segment-control__btn--active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          {t('ai_assistant_tab')}
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
