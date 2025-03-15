import {Button, Empty, FloatButton, Typography, Input} from "antd";
import React, {useEffect, useMemo, useRef, useState, useCallback} from "react";
import useTranscripts from "../../hooks/useTranscripts";
import CaptionList from "./captionList";
import './captions.scss';
import useAutoScroll from "../../hooks/useScroll";
import dayjs from 'dayjs';
import { useDateContext } from '../../contexts/DateContext';
import { SearchOutlined, UpOutlined, DownOutlined, CloseOutlined } from '@ant-design/icons';

const { Title } = Typography;

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

    // 缓存日期映射
    const datesWithMessages = useMemo(() => {
        const dates = new Set();
        transcripts.forEach(transcript => {
            const date = dayjs(transcript.timestamp).format('YYYY-MM-DD');
            dates.add(date);
        });
        return dates;
    }, [transcripts]);

    // 根据选中日期获取发言人列表
    const availableSpeakers = useMemo(() => {
        let filtered = transcripts;
        if (selectedDate) {
            const targetDate = selectedDate.format('YYYY-MM-DD');
            filtered = filtered.filter(transcript => {
                const transcriptDate = dayjs(transcript.timestamp).format('YYYY-MM-DD');
                return transcriptDate === targetDate;
            });
        }
        return [...new Set(filtered.map(item => item.activeSpeaker))];
    }, [transcripts, selectedDate]);

    // 更新发言人列表和过滤器
    useEffect(() => {
        setSpeakers(availableSpeakers);
        // 移除不在当前日期的发言人
        setFilterSpeakers(prev => prev.filter(speaker => availableSpeakers.includes(speaker)));
    }, [availableSpeakers]);


    // 优化过滤操作
    const filteredData = useMemo(() => {
        let filtered = transcripts;

        // 使用 Map 优化发言人过滤
        if (filterSpeaker.length > 0) {
            const speakerSet = new Set(filterSpeaker);
            filtered = filtered.filter(v => speakerSet.has(v.activeSpeaker));
        }

        // 日期筛选
        if (selectedDate) {
            const targetDate = selectedDate.format('YYYY-MM-DD');
            filtered = filtered.filter(transcript => {
                const transcriptDate = dayjs(transcript.timestamp).format('YYYY-MM-DD');
                return transcriptDate === targetDate;
            });
        }

        return filtered;
    }, [transcripts, filterSpeaker, selectedDate]);

    const isNoData = filteredData.length === 0;

    // 只有在搜索不活跃时才使用自动滚动
    const shouldAutoScroll = !isSearchActive;
    useAutoScroll(chatContainer, filteredData, shouldAutoScroll);

    const toggleSpeaker = (speaker: string) => {
        if (filterSpeaker.includes(speaker)) {
            setFilterSpeakers(filterSpeaker.filter((v) => v !== speaker));
        } else {
            setFilterSpeakers([...filterSpeaker, speaker]);
        }
    }

    // 切换搜索框显示状态
    const toggleSearch = () => {
        const newState = !searchVisible;
        setSearchVisible(newState);
        if (newState) {
            // 当搜索框显示时，聚焦输入框
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        } else {
            // 当搜索框隐藏时，清除搜索和高亮
            clearSearch();
        }
    };

    // 处理搜索文本变化
    const handleSearchTextChange = (e) => {
        setSearchText(e.target.value);
        // 确保输入框保持焦点
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    // 搜索功能
    const handleSearch = useCallback(() => {
        if (!searchText.trim()) {
            setSearchResults([]);
            setCurrentMatch(0);
            setIsSearchActive(false);
            return;
        }

        setIsSearchActive(true);

        // 查找所有匹配项
        const results = [];
        const searchRegex = new RegExp(searchText, 'gi');

        // 在DOM中查找匹配项
        const container = chatContainer.current;
        if (container) {
            // 先移除之前的高亮
            const existingHighlights = container.querySelectorAll('.search-highlight');
            existingHighlights.forEach(el => {
                const parent = el.parentNode;
                parent.replaceChild(document.createTextNode(el.textContent), el);
                // 合并相邻的文本节点
                parent.normalize();
            });

            // 查找所有文本节点并高亮匹配项
            const textNodes = [];
            const walk = document.createTreeWalker(
                container,
                NodeFilter.SHOW_TEXT,
                { acceptNode: () => NodeFilter.FILTER_ACCEPT }
            );

            let node;
            while (node = walk.nextNode()) {
                if (node.nodeValue.trim() !== '') {
                    textNodes.push(node);
                }
            }

            textNodes.forEach(textNode => {
                const content = textNode.nodeValue;
                const matches = content.match(searchRegex);

                if (matches) {
                    let lastIndex = 0;
                    searchRegex.lastIndex = 0;

                    const fragments = [];
                    let match;

                    while ((match = searchRegex.exec(content)) !== null) {
                        // 添加匹配前的文本
                        if (match.index > lastIndex) {
                            fragments.push(document.createTextNode(
                                content.substring(lastIndex, match.index)
                            ));
                        }

                        // 创建高亮元素
                        const highlightEl = document.createElement('span');
                        highlightEl.className = 'search-highlight';
                        highlightEl.textContent = match[0];
                        fragments.push(highlightEl);

                        // 记录匹配项位置
                        results.push(highlightEl);

                        lastIndex = searchRegex.lastIndex;
                    }

                    // 添加最后一个匹配后的文本
                    if (lastIndex < content.length) {
                        fragments.push(document.createTextNode(
                            content.substring(lastIndex)
                        ));
                    }

                    // 替换原始节点
                    const parent = textNode.parentNode;
                    fragments.forEach(fragment => {
                        parent.insertBefore(fragment, textNode);
                    });
                    parent.removeChild(textNode);
                }
            });
        }

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
    }, [searchText, chatContainer]);

    // 滚动到指定匹配项
    const scrollToMatch = (element) => {
        if (element) {
            element.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });

            // 添加活跃状态样式
            const activeHighlight = document.querySelector('.search-highlight-active');
            if (activeHighlight) {
                activeHighlight.classList.remove('search-highlight-active');
            }
            element.classList.add('search-highlight-active');
        }
    };

    // 导航到下一个匹配项
    const goToNextMatch = () => {
        if (searchResults.length === 0) return;

        let nextMatch = currentMatch % searchResults.length + 1;
        setCurrentMatch(nextMatch);
        scrollToMatch(searchResults[nextMatch - 1]);

        // 保持输入框焦点
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    // 导航到上一个匹配项
    const goToPrevMatch = () => {
        if (searchResults.length === 0) return;

        let prevMatch = currentMatch - 1;
        if (prevMatch === 0) prevMatch = searchResults.length;
        setCurrentMatch(prevMatch);
        scrollToMatch(searchResults[prevMatch - 1]);

        // 保持输入框焦点
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    // 清除搜索
    const clearSearch = () => {
        setSearchText('');
        setSearchResults([]);
        setCurrentMatch(0);
        setIsSearchActive(false);

        // 移除高亮
        const container = chatContainer.current;
        if (container) {
            const highlights = container.querySelectorAll('.search-highlight');
            highlights.forEach(el => {
                const parent = el.parentNode;
                parent.replaceChild(document.createTextNode(el.textContent), el);
                parent.normalize();
            });
        }

        // 清除后保持输入框焦点
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

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
    }, [searchVisible, searchText, isSearchActive, handleSearch]);

    return (
        <div className={`captions`}>
            {/* 搜索框 - 放在顶部 */}
            <div className={`search-bar ${searchVisible ? 'visible' : ''}`}>
                <div className="search-input-container">
                    <SearchOutlined className="search-icon" />
                    <Input
                        ref={searchInputRef}
                        placeholder="Search in messages..."
                        value={searchText}
                        onChange={handleSearchTextChange}
                        onPressEnter={handleSearch}
                        className="search-input"
                        autoFocus={searchVisible}
                        suffix={
                            searchText ? (
                                <CloseOutlined
                                    onClick={clearSearch}
                                    className="clear-icon"
                                />
                            ) : null
                        }
                    />
                    <span className="match-counter">
                        {searchResults.length > 0 ? `${currentMatch}/${searchResults.length}` : ''}
                    </span>
                    <Button
                        icon={<UpOutlined />}
                        onClick={goToPrevMatch}
                        className="nav-button"
                        disabled={searchResults.length === 0}
                    />
                    <Button
                        icon={<DownOutlined />}
                        onClick={goToNextMatch}
                        className="nav-button"
                        disabled={searchResults.length === 0}
                    />
                    <Button
                        icon={<CloseOutlined />}
                        onClick={toggleSearch}
                        className="close-button"
                    />
                </div>
            </div>

            {speakers.length > 0 && (
                <div className="filter-section">
                    <div>

                        <div className="filter-speakers">
                            <Title level={5} style={{ margin: '0', lineHeight: '32px' }}>Filter by talker:</Title>
                            {speakers.map((speaker) => (
                                <Button
                                    type={filterSpeaker.includes(speaker) ? 'primary' : 'default'}
                                    className={filterSpeaker.includes(speaker) ? 'selected-filter' : ''}
                                    size={'small'}
                                    onClick={() => {toggleSpeaker(speaker)}}
                                    key={speaker}
                                >
                                    {speaker}
                                </Button>
                            ))}
                        </div>

                        <div className="filter-meeting">
                            2
                        </div>
                    </div>
                    <div className="search-container">
                        <Button
                            icon={<SearchOutlined />}
                            className="search-icon-button"
                            onClick={toggleSearch}
                            type={isSearchActive ? "primary" : "default"}
                        />
                    </div>


                </div>
            )}

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
