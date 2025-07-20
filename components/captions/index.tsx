import React, { useRef } from 'react';
import './captions.scss';
import useTranscripts from '../../hooks/useTranscripts';
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
      />
    </div>
  );
};

export default Captions; 