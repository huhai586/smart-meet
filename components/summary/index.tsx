import React, { useRef, useEffect } from 'react';
import { Empty } from 'antd';
import { useI18n } from '../../utils/i18n';
import SummaryCard from './SummaryCard';
import QuestionInput from './QuestionInput';
import { useSummary } from './useSummary';
import '../../styles/summary.scss';

interface SummaryProps {
  show?: boolean;
}

const Summary: React.FC<SummaryProps> = (props) => {
  const { t } = useI18n();
  const { cardData, requesting, handleQuestion, contextHolder } = useSummary();
  const container = useRef<HTMLDivElement>(null);

  // 滚动到最新的卡片
  useEffect(() => {
    if (container.current) {
      const lastItem = container.current.querySelector('.ant-spin-nested-loading:last-child');
      lastItem && lastItem.scrollIntoView({ behavior: 'smooth' });
    }
  }, [cardData]);

  return (
    <div className="summary-wrapper">
      <div className={`summaryContainer ${!cardData.length && 'no-data'}`} ref={container}>
        {contextHolder}
        
        {cardData.map((item, index) => (
          <SummaryCard
            key={index}
            item={item}
            loading={requesting}
            index={index}
          />
        ))}
        
        {!cardData.length && (
          <Empty 
            description={t('summary_question')} 
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