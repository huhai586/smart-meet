import React, { useMemo, useRef } from "react"
import { Empty } from 'antd';
import { ArrowDownOutlined } from '@ant-design/icons';
import EmptyIllustration, { EmptyKind } from '~components/common/EmptyIllustration';
import CaptionList from './captionList';
import type { Dayjs } from 'dayjs';
import type { Transcript } from '../../hooks/useTranscripts';
import useAutoScroll from "~hooks/useScroll"
import { useI18n } from '../../utils/i18n';
import { useCaptionIntrinsicHeight } from './hooks/useCaptionIntrinsicHeight';
import '../../styles/empty-states.scss';

interface CaptionContentProps {
  filteredData: Transcript[];
  selectedDate?: Dayjs;
  containerRef: React.RefObject<HTMLDivElement>;
  speakerColorMap: Map<string, string>;
}

/**
 * 字幕内容区域组件
 */
const CaptionContent: React.FC<CaptionContentProps> = ({ 
  filteredData, 
  selectedDate, 
  containerRef,
  speakerColorMap,
}) => {
  const { t } = useI18n();
  const lastItemInContainer = useRef<HTMLDivElement>(null);
  const { disableAutoScroll, resumeAutoScroll, showJumpToLatest } = useAutoScroll(containerRef.current, lastItemInContainer.current, filteredData);

  useCaptionIntrinsicHeight(containerRef, filteredData.length);

  const isNoData = filteredData.length === 0;

  // 使用useMemo包装CaptionList的渲染，减少重新渲染次数
  const memoizedCaptionList = useMemo(() => {
    return filteredData.length > 0 ? (
      <CaptionList listData={filteredData} disableAutoScroll={disableAutoScroll} speakerColorMap={speakerColorMap} />
    ) : (
      <Empty 
        image={<EmptyIllustration kind={EmptyKind.CAPTIONS} />}
        description={
          selectedDate
            ? t('no_messages_on_date', { date: selectedDate.format('YYYY-MM-DD') })
            : t('no_messages')
        }
      />
    );
  }, [filteredData, selectedDate, disableAutoScroll, speakerColorMap, t]);

  return (
    <>
      <div 
        className={`chat-container ${isNoData ? 'no-data' : ''}`} 
        ref={containerRef}
      >
        {memoizedCaptionList}
        <div className="last-item" ref={lastItemInContainer}></div>
      </div>

      {!isNoData && (
        <button
          type="button"
          className={`jump-to-latest${showJumpToLatest ? ' visible' : ''}`}
          onClick={resumeAutoScroll}
          tabIndex={showJumpToLatest ? 0 : -1}
          aria-hidden={!showJumpToLatest}
        >
          <ArrowDownOutlined />
          {t('captions_jump_to_latest')}
        </button>
      )}
    </>
  );
};

export default CaptionContent; 