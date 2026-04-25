import React, { useRef, useEffect, useMemo } from 'react';
import './captions.scss';
import useTranscripts from '../../hooks/useTranscripts';
import { useDateContext } from '../../contexts/DateContext';
import useFontSizeOffset from '../../hooks/useFontSizeOffset';

// 导入拆分后的组件和自定义hooks
import SearchBar from './SearchBar';
import FilterSection from './FilterSection';
import CaptionContent from './CaptionContent';
import { useSearch, useFilter } from './hooks';
import { computeSpeakerColors } from './utils/speakerColor';

/**
 * 字幕主组件
 */
const Captions = () => {
  // 引用和状态
  const chatContainer = useRef<HTMLDivElement>(null);
  const [transcripts] = useTranscripts();
  const { selectedDate } = useDateContext();

  const captionFontOffset = useFontSizeOffset('captionFontSizeOffset');

  // Apply font size as a CSS variable on :root so all descendant rules can use it
  useEffect(() => {
    document.documentElement.style.setProperty('--caption-font-size', `${16 + captionFontOffset}px`);
  }, [captionFontOffset]);

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
  } = useSearch(chatContainer, selectedDate);

  const {
    speakers,
    filterSpeaker,
    meetingNames,
    selectedMeeting,
    filteredData,
    toggleSpeaker,
    toggleMeeting
  } = useFilter(transcripts, selectedDate);

  // Compute colors from ALL transcripts (not date-filtered) so the same speaker
  // always gets the same color regardless of which date is selected.
  const speakerColorMap = useMemo(() => {
    const allSpeakers = Array.from(new Set(transcripts.map(t => t.activeSpeaker)));
    return computeSpeakerColors(allSpeakers);
  }, [transcripts]);



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
        speakerColorMap={speakerColorMap}
      />
    </div>
  );
};

export default Captions; 