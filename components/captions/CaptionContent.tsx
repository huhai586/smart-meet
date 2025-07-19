import React, { useMemo } from 'react';
import { Empty, FloatButton } from 'antd';
import CaptionList from './captionList';
import type { Dayjs } from 'dayjs';
import type { Transcript } from '../../hooks/useTranscripts';

interface CaptionContentProps {
  filteredData: Transcript[];
  selectedDate?: Dayjs;
  containerRef: React.RefObject<HTMLDivElement>;
  lastItemInContainerRef: React.RefObject<HTMLDivElement>;
  disableAutoScroll: () => void;
}

/**
 * 字幕内容区域组件
 */
const CaptionContent: React.FC<CaptionContentProps> = ({ 
  filteredData, 
  selectedDate, 
  containerRef,
  lastItemInContainerRef,
  disableAutoScroll
}) => {
  const isNoData = filteredData.length === 0;

  // 使用useMemo包装CaptionList的渲染，减少重新渲染次数
  const memoizedCaptionList = useMemo(() => {
    return filteredData.length > 0 ? (
      <CaptionList listData={filteredData} disableAutoScroll={disableAutoScroll} />
    ) : (
      <Empty 
        description={
          selectedDate
            ? `No messages on ${selectedDate.format('YYYY-MM-DD')}`
            : "No messages"
        }
      />
    );
  }, [filteredData, selectedDate, disableAutoScroll]);

  return (
    <>
      <div 
        className={`chat-container ${isNoData ? 'no-data' : ''}`} 
        ref={containerRef}
      >
        {memoizedCaptionList}
        <div className="last-item" ref={lastItemInContainerRef}></div>
      </div>
      <FloatButton.BackTop 
        visibilityHeight={100} 
        target={() => containerRef.current as HTMLElement}
      />
    </>
  );
};

export default CaptionContent; 