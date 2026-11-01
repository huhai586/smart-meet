import React, { useRef, useEffect } from 'react';
import { Empty } from 'antd';
import EmptyIllustration, { EmptyKind } from '~components/common/EmptyIllustration';
import { useI18n } from '../../utils/i18n';
import { useDateContext } from '../../contexts/DateContext';
import SummaryCard from './SummaryCard';
import QuestionInput from './QuestionInput';
import RatingPromptCard from './RatingPromptCard';
import { useSummary } from './useSummary';
import useFontSizeOffset from '../../hooks/useFontSizeOffset';
import { useRatingPrompt } from '../../hooks/useRatingPrompt';
import '../../styles/summary.scss';
import '../../styles/empty-states.scss';

interface SummaryProps {
  show?: boolean;
}

const Summary: React.FC<SummaryProps> = (_props) => {
  const { t } = useI18n();
  const { selectedDate } = useDateContext();
  const rating = useRatingPrompt();
  const { cardData, requesting, handleQuestion, handleRetry } = useSummary(rating.recordSuccess);
  const summaryFontOffset = useFontSizeOffset('summaryFontSizeOffset');
  const container = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Apply font size as a CSS variable on :root so all descendant rules can use it
  useEffect(() => {
    document.documentElement.style.setProperty('--summary-font-size', `${13 + summaryFontOffset}px`);
  }, [summaryFontOffset]);

  // 每次 cardData 变化（新问题 or AI 回复完成）时滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cardData, rating.visible]);

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
            onRetry={() => handleRetry(index)}
          />
        ))}

        {rating.visible && <RatingPromptCard onRate={rating.rate} onDismiss={rating.dismiss} />}

        <div ref={bottomRef} />

        {!cardData.length && (
          <Empty
            image={<EmptyIllustration kind={EmptyKind.SUMMARY} />}
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
