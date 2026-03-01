import { useEffect } from 'react';
import type { Dayjs } from 'dayjs';

/**
 * 监听日期变化并在搜索框打开时触发重新搜索的 Hook
 * 
 * @param selectedDate 当前选中的日期
 * @param searchVisible 搜索栏是否可见
 * @param searchText 搜索文本
 * @param handleSearch 执行搜索的处理函数
 */
export const useSearchUpdate = (
    selectedDate: Dayjs,
    searchVisible: boolean,
    searchText: string,
    handleSearch: () => void
) => {
    useEffect(() => {
        if (searchVisible && searchText.trim()) {
            // 延迟以确保内容已渲染（此时 DOM 可能还在更新中）
            const timer = setTimeout(() => {
                handleSearch();
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [selectedDate, searchVisible, searchText, handleSearch]);
};
