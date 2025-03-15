import { Empty, FloatButton } from "antd";
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import useTranscripts from "../../hooks/useTranscripts";
import CaptionList from "./captionList";
import './captions.scss';
import useAutoScroll from "../../hooks/useScroll";
import dayjs from 'dayjs';
import { useDateContext } from '../../contexts/DateContext';

// 导入拆分后的组件和工具
import SearchBar from './SearchBar';
import FilterSection from './FilterSection';
import { findAndHighlightMatches, clearHighlights, scrollToMatch } from './searchUtils';
import { useTranscriptFilter, formatDate, createLookupMap } from './filterUtils';

const Captions = (props) => {
    const chatContainer = useRef(null);
    const [speakers, setSpeakers] = useState([]);
    const [filterSpeaker, setFilterSpeakers] = useState([]);
    const [transcripts] = useTranscripts();
    const { selectedDate, setSelectedDate } = useDateContext();
    const [searchText, setSearchText] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentMatch, setCurrentMatch] = useState(0);
    const [isSearchActive, setIsSearchActive] = useState(false);
    const [searchVisible, setSearchVisible] = useState(false);
    const searchInputRef = useRef(null);
    
    // 添加会议名称相关状态
    const [meetingNames, setMeetingNames] = useState([]);
    const [selectedMeeting, setSelectedMeeting] = useState('');

    // 优化：使用useCallback包装toggleSpeaker和toggleMeeting函数，避免每次渲染时重新创建
    const toggleSpeaker = useCallback((speaker) => {
        setFilterSpeakers(prev => {
            if (prev.includes(speaker)) {
                return prev.filter(s => s !== speaker);
            } else {
                return [...prev, speaker];
            }
        });
    }, []);

    const toggleMeeting = useCallback((meetingName) => {
        setSelectedMeeting(prev => prev === meetingName ? '' : meetingName);
    }, []);

    // 缓存日期映射
    const datesWithMessages = useMemo(() => {
        const dates = new Set();
        transcripts.forEach(transcript => {
            const date = formatDate(transcript.timestamp);
            dates.add(date);
        });
        return dates;
    }, [transcripts]);

    // 根据选中日期获取发言人列表 - 优化使用 for 循环和 Set
    const availableSpeakers = useMemo(() => {
        const speakerSet = new Set();
        const len = transcripts.length;
        
        if (selectedDate) {
            const targetDate = selectedDate.format('YYYY-MM-DD');
            
            for (let i = 0; i < len; i++) {
                const transcript = transcripts[i];
                const transcriptDate = formatDate(transcript.timestamp);
                
                if (transcriptDate === targetDate) {
                    speakerSet.add(transcript.activeSpeaker);
                }
            }
        } else {
            for (let i = 0; i < len; i++) {
                speakerSet.add(transcripts[i].activeSpeaker);
            }
        }
        
        return Array.from(speakerSet);
    }, [transcripts, selectedDate]);

    // 根据选中日期获取会议名称列表 - 优化使用 for 循环和 Set
    const availableMeetingNames = useMemo(() => {
        const meetingSet = new Set();
        const len = transcripts.length;
        
        if (selectedDate) {
            const targetDate = selectedDate.format('YYYY-MM-DD');
            
            for (let i = 0; i < len; i++) {
                const transcript = transcripts[i];
                const transcriptDate = formatDate(transcript.timestamp);
                
                if (transcriptDate === targetDate && transcript.meetingName) {
                    meetingSet.add(transcript.meetingName);
                }
            }
        } else {
            for (let i = 0; i < len; i++) {
                const meetingName = transcripts[i].meetingName;
                if (meetingName) {
                    meetingSet.add(meetingName);
                }
            }
        }
        
        return Array.from(meetingSet);
    }, [transcripts, selectedDate]);

    // 更新发言人列表和过滤器
    useEffect(() => {
        setSpeakers(availableSpeakers);
        // 移除不在当前日期的发言人 - 使用查找映射优化
        if (availableSpeakers.length > 0) {
            const speakerLookup = createLookupMap<string>(availableSpeakers as string[]);
            setFilterSpeakers(prev => prev.filter(speaker => speakerLookup[speaker]));
        } else {
            setFilterSpeakers([]);
        }
    }, [availableSpeakers]);

    // 更新会议名称列表
    useEffect(() => {
        setMeetingNames(availableMeetingNames);
        // 如果当前选中的会议不在列表中，清除选择
        if (selectedMeeting && !availableMeetingNames.includes(selectedMeeting)) {
            setSelectedMeeting('');
        }
    }, [availableMeetingNames, selectedMeeting]);

    // 使用优化的筛选Hook替换原有的三个级联useMemo
    const filteredData = useTranscriptFilter(
        transcripts,
        selectedDate,
        filterSpeaker,
        selectedMeeting
    );

    const isNoData = filteredData.length === 0;

    // 只有在搜索不活跃时才使用自动滚动
    const shouldAutoScroll = !isSearchActive;
    useAutoScroll(chatContainer, filteredData, shouldAutoScroll);

    // 切换搜索框显示状态
    const toggleSearch = useCallback(() => {
        setSearchVisible(prev => {
            const newState = !prev;
            if (newState) {
                // 当搜索框显示时，聚焦输入框
                setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 100);
            } else {
                // 当搜索框隐藏时，清除搜索和高亮
                clearSearch();
            }
            return newState;
        });
    }, []);

    // 处理搜索文本变化
    const handleSearchTextChange = useCallback((e) => {
        setSearchText(e.target.value);
        // 确保输入框保持焦点
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // 清除搜索
    const clearSearch = useCallback(() => {
        setSearchText('');
        setSearchResults([]);
        setCurrentMatch(0);
        setIsSearchActive(false);

        // 使用提取的工具函数清除高亮
        clearHighlights(chatContainer.current);

        // 清除后保持输入框焦点
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    // 搜索功能
    const handleSearch = useCallback(() => {
        if (!searchText.trim()) {
            setSearchResults([]);
            setCurrentMatch(0);
            setIsSearchActive(false);
            return;
        }

        setIsSearchActive(true);

        // 使用提取的工具函数查找并高亮匹配项
        const results = findAndHighlightMatches(chatContainer.current, searchText);
        setSearchResults(results);

        // 如果有匹配项，滚动到第一个匹配项
        if (results.length > 0) {
            setCurrentMatch(1);
            scrollToMatch(results[0]);
        }

        // 确保搜索后输入框仍然保持焦点
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [searchText]);

    // 导航到下一个匹配项
    const goToNextMatch = useCallback(() => {
        if (searchResults.length === 0) return;

        let nextMatch = currentMatch % searchResults.length + 1;
        setCurrentMatch(nextMatch);
        scrollToMatch(searchResults[nextMatch - 1]);

        // 保持输入框焦点
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [currentMatch, searchResults]);

    // 导航到上一个匹配项
    const goToPrevMatch = useCallback(() => {
        if (searchResults.length === 0) return;

        let prevMatch = currentMatch - 1;
        if (prevMatch === 0) prevMatch = searchResults.length;
        setCurrentMatch(prevMatch);
        scrollToMatch(searchResults[prevMatch - 1]);

        // 保持输入框焦点
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [currentMatch, searchResults]);

    // 当搜索文本变化时，重置搜索结果
    useEffect(() => {
        if (!searchText.trim()) {
            setSearchResults([]);
            setCurrentMatch(0);
            setIsSearchActive(false);
        }
    }, [searchText]);

    // 处理键盘事件
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Ctrl+F 或 Command+F 打开搜索
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                setSearchVisible(true);
                setTimeout(() => {
                    searchInputRef.current?.focus();
                }, 100);
            }

            // Escape 关闭搜索
            if (e.key === 'Escape' && searchVisible) {
                setSearchVisible(false);
                clearSearch();
            }

            // Enter 执行搜索
            if (e.key === 'Enter' && searchVisible && document.activeElement === searchInputRef.current) {
                e.preventDefault();
                handleSearch();
            }

            // F3 或 Enter 查找下一个
            if ((e.key === 'F3' || (e.key === 'Enter' && e.shiftKey === false)) && isSearchActive) {
                e.preventDefault();
                goToNextMatch();
            }

            // Shift+F3 或 Shift+Enter 查找上一个
            if ((e.key === 'F3' && e.shiftKey) || (e.key === 'Enter' && e.shiftKey) && isSearchActive) {
                e.preventDefault();
                goToPrevMatch();
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [searchVisible, isSearchActive, handleSearch, goToNextMatch, goToPrevMatch, clearSearch]);

    return (
        <div className={`captions`}>
            {/* 使用拆分后的SearchBar组件 */}
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

            {/* 使用拆分后的FilterSection组件 */}
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

            <div className={`chat-container ${isNoData ? 'no-data' : ''}`} ref={chatContainer}>
                {filteredData.length > 0 ? (
                    <CaptionList listData={filteredData}/>
                ) : (
                    <Empty description={
                        selectedDate
                            ? `No messages on ${selectedDate.format('YYYY-MM-DD')}`
                            : "No messages"
                    }/>
                )}
            </div>
            <FloatButton.BackTop visibilityHeight={100} target={ () => document.querySelector('.chat-container') as HTMLElement}/>
        </div>
    )
}

export default Captions;
