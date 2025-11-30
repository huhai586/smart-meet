import React, { useMemo, useRef } from "react"
import { Empty, FloatButton } from 'antd';
import { SyncOutlined, MessageOutlined } from '@ant-design/icons';
import CaptionList from './captionList';
import type { Dayjs } from 'dayjs';
import type { Transcript } from '../../hooks/useTranscripts';
import useAutoScroll from "~hooks/useScroll"
import { useI18n } from '../../utils/i18n';
import '../../styles/empty-states.scss';

interface CaptionContentProps {
  filteredData: Transcript[];
  selectedDate?: Dayjs;
  containerRef: React.RefObject<HTMLDivElement>;
}

/**
 * 字幕内容区域组件
 */
const CaptionContent: React.FC<CaptionContentProps> = ({ 
  filteredData, 
  selectedDate, 
  containerRef,
}) => {
  const { t } = useI18n();
  const lastItemInContainer = useRef<HTMLDivElement>(null);
  const { disableAutoScroll, autoScroll, toggleAutoScroll } = useAutoScroll(containerRef.current, lastItemInContainer.current, filteredData);

  const isNoData = filteredData.length === 0;

  // 使用useMemo包装CaptionList的渲染，减少重新渲染次数
  const memoizedCaptionList = useMemo(() => {
    return filteredData.length > 0 ? (
      <CaptionList listData={filteredData} disableAutoScroll={disableAutoScroll} />
    ) : (
      <Empty 
        image={<MessageOutlined style={{ fontSize: 60 }} />}
        description={
          selectedDate
            ? t('no_messages_on_date', { date: selectedDate.format('YYYY-MM-DD') })
            : t('no_messages')
        }
      />
    );
  }, [filteredData, selectedDate, disableAutoScroll, t]);

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
        <FloatButton.Group shape="square" style={{ insetInlineEnd: 24 }} className={'custom-float-buttons'}>
          <FloatButton 
            icon={<SyncOutlined />}
            type={autoScroll ? "primary" : "default"}
            onClick={toggleAutoScroll}
            tooltip={autoScroll ? "Disable auto scroll" : "Enable auto scroll"}
          />
          <FloatButton.BackTop
            visibilityHeight={0}
            target={() => containerRef.current}
            onClick={() => {
              if (autoScroll) {
                toggleAutoScroll();
            }}}
          />
        </FloatButton.Group>
      )}
    </>
  );
};

export default CaptionContent; 