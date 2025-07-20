import { useState, useEffect, useRef, useCallback } from 'react';
import type { RefObject, ChangeEvent } from 'react';
import { findAndHighlightMatches, clearHighlights, scrollToMatch } from '../searchUtils';

/**
 * 处理字幕搜索的自定义Hook
 */
export const useSearch = (containerRef: RefObject<HTMLElement>) => {
  const [searchText, setSearchText] = useState('');
  const [searchResults, setSearchResults] = useState<HTMLElement[]>([]);
  const [currentMatch, setCurrentMatch] = useState(0);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchVisible, setSearchVisible] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // 清除搜索
  const clearSearch = useCallback(() => {
    setSearchText('');
    setSearchResults([]);
    setCurrentMatch(0);
    setIsSearchActive(false);

    // 使用工具函数清除高亮
    if (containerRef.current) {
      clearHighlights(containerRef.current);
    }

    // 清除后保持输入框焦点
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [containerRef]);

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
  }, [clearSearch]);

  // 处理搜索文本变化
  const handleSearchTextChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value);
    // 确保输入框保持焦点
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);



  // 搜索功能
  const handleSearch = useCallback(() => {
    if (!searchText.trim() || !containerRef.current) {
      setSearchResults([]);
      setCurrentMatch(0);
      setIsSearchActive(false);
      return;
    }

    setIsSearchActive(true);

    // 使用工具函数查找并高亮匹配项
    const results = findAndHighlightMatches(containerRef.current, searchText);
    setSearchResults(results as HTMLElement[]); // 类型断言为HTMLElement[]

    // 如果有匹配项，滚动到第一个匹配项
    if (results.length > 0) {
      setCurrentMatch(1);
      scrollToMatch(results[0] as HTMLElement); // 类型断言
    }

    // 确保搜索后输入框仍然保持焦点
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchText, containerRef]);

  // 导航到下一个匹配项
  const goToNextMatch = useCallback(() => {
    if (searchResults.length === 0) return;

    const nextMatch = currentMatch % searchResults.length + 1;
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
    const handleKeyDown = (e: KeyboardEvent) => {
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

  return {
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
  };
}; 