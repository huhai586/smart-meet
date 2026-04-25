import React, { useRef, useEffect } from 'react';
import { Empty } from 'antd';
import { BulbOutlined } from '@ant-design/icons';
import { useI18n } from '../../utils/i18n';
import { useDateContext } from '../../contexts/DateContext';
import SummaryCard from './SummaryCard';
import QuestionInput from './QuestionInput';
import { useSummary } from './useSummary';
import '../../styles/summary.scss';
import '../../styles/empty-states.scss';

interface SummaryProps {
  show?: boolean;
}

const Summary: React.FC<SummaryProps> = (_props) => {
  const { t } = useI18n();
  const { selectedDate } = useDateContext();
  const { cardData, requesting, handleQuestion } = useSummary();
  const container = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // 每次 cardData 变化（新问题 or AI 回复完成）时滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cardData]);

  // 格式化日期为 月/日
  const formattedDate = selectedDate ? selectedDate.format('M/D') : '';

  return (
    <div className="summary-wrapper">
      <div className={`summaryContainer ${!cardData.length && 'no-data'}`} ref={container}>

        {cardData.map((item, index) => (
          <SummaryCard
            key={index}
            item={item}
            loading={requesting}
            index={index}
          />
        ))}

        <div ref={bottomRef} />

        {!cardData.length && (
          <Empty
            image={<BulbOutlined style={{ fontSize: 60 }} />}
            description={
              <div>
                {formattedDate && <div style={{ fontSize: '13px', color: '#bfbfbf', marginBottom: '4px' }}>{formattedDate}</div>}
                <div>{t('summary_empty_state')}</div>
              </div>
            }
            className={'summary-no-meeting-data'}
          />
        )}
      </div>

      <QuestionInput
        onSubmit={handleQuestion}
        loading={requesting}
      />
    </div>
  );
};

export default Summary;
