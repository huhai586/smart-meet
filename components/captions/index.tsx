import React, { useRef, useMemo } from 'react';
import './captions.scss';
import useTranscripts from '../../hooks/useTranscripts';
import useAutoScroll from '../../hooks/useScroll';
import { useDateContext } from '../../contexts/DateContext';

// 导入拆分后的组件和自定义hooks
import SearchBar from './SearchBar';
import FilterSection from './FilterSection';
import CaptionContent from './CaptionContent';
import { useSearch } from './hooks/useSearch';
import { useFilter } from './hooks/useFilter';

/**
 * 字幕主组件
 */
const Captions = () => {
  // 引用和状态
  const chatContainer = useRef<HTMLDivElement>(null);
  const [transcripts] = useTranscripts();
  const { selectedDate } = useDateContext();

  // 使用自定义hooks处理搜索和过滤
  const {
    searchText,
    searchVisible,
    searchResults,
    currentMatch,
    isSearchActive,
    searchInputRef,
    handleSearchTextChange,
    handleSearch,
    goToNextMatch,
    goToPrevMatch,
    toggleSearch,
    clearSearch
  } = useSearch(chatContainer);

  const {
    speakers,
    filterSpeaker,
    meetingNames,
    selectedMeeting,
    filteredData,
    toggleSpeaker,
    toggleMeeting
  } = useFilter(transcripts, selectedDate);

  // 检查最新消息是否在10分钟内
  const isLatestMessageRecent = useMemo(() => {
    if (filteredData.length === 0) return false;
    
    const latestMessage = filteredData[filteredData.length - 1];
    const latestTimestamp = new Date(latestMessage.timestamp).getTime();
    const currentTime = Date.now();
    const tenMinutesInMs = 10 * 60 * 1000;
    
    const isRecent = (currentTime - latestTimestamp) < tenMinutesInMs;
    
    if (process.env.NODE_ENV === 'development') {
      console.log('[Captions] Latest message recent check:', {
        isRecent,
        latestTimestamp: new Date(latestTimestamp).toLocaleTimeString(),
        currentTime: new Date(currentTime).toLocaleTimeString(),
        ageInMinutes: Math.floor((currentTime - latestTimestamp) / (1000 * 60))
      });
    }
    
    return isRecent;
  }, [filteredData]);

  // 计算是否应该自动滚动：搜索不活跃 && 最新消息在10分钟内
  const shouldAutoScroll = !isSearchActive && isLatestMessageRecent;
  const { disableAutoScroll } = useAutoScroll(chatContainer, filteredData, shouldAutoScroll);

  return (
    <div className={`captions`}>
      {/* 搜索栏组件 */}
      <SearchBar
        searchText={searchText}
        searchVisible={searchVisible}
        searchResults={searchResults}
        currentMatch={currentMatch}
        onSearchTextChange={handleSearchTextChange}
        onSearch={handleSearch}
        onPrevMatch={goToPrevMatch}
        onNextMatch={goToNextMatch}
        onToggleSearch={toggleSearch}
        onClearSearch={clearSearch}
        searchInputRef={searchInputRef}
      />

      {/* 过滤器组件 */}
      <FilterSection
        speakers={speakers}
        filterSpeaker={filterSpeaker}
        meetingNames={meetingNames}
        selectedMeeting={selectedMeeting}
        isSearchActive={isSearchActive}
        toggleSpeaker={toggleSpeaker}
        toggleMeeting={toggleMeeting}
        toggleSearch={toggleSearch}
      />

      {/* 内容区域组件 */}
      <CaptionContent
        filteredData={filteredData}
        selectedDate={selectedDate}
        containerRef={chatContainer}
        disableAutoScroll={disableAutoScroll}
      />
    </div>
  );
};

export default Captions; 