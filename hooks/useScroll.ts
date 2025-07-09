import { useRef, useEffect, useState, useCallback } from 'react';
import type {Transcript} from "~hooks/useTranscripts";

function useAutoScroll(scrollAreaRef: React.RefObject<HTMLDivElement>, data:Transcript[], shouldAutoScroll: boolean = true) {
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    const lastDataLengthRef = useRef(data.length);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastScrollTop = useRef(0);
    const isScrollingRef = useRef(false);

    // 增加滚动位置检测的阈值，提高准确性
    const isNearBottom = (scrollArea: HTMLDivElement) => {
        const threshold = 50; // 增加阈值到50px，提高检测准确性
        return scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < threshold;
    };

    // 防抖的滚动处理函数
    const handleScroll = useCallback(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea) return;
        
        const scrollTop = scrollArea.scrollTop;
        lastScrollTop.current = scrollTop;
        
        // 防抖处理，避免频繁更新状态
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        
        scrollTimeoutRef.current = setTimeout(() => {
            if (isNearBottom(scrollArea)) {
                setAutoScrollEnabled(true);
            } else {
                setAutoScrollEnabled(false);
            }
            isScrollingRef.current = false;
        }, 100); // 100ms防抖延迟
    }, []);

    // 执行自动滚动的函数，增加重试机制
    const performAutoScroll = useCallback(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea || !autoScrollEnabled || !shouldAutoScroll) return;

        isScrollingRef.current = true;
        
        // 立即滚动到底部
        scrollArea.scrollTop = scrollArea.scrollHeight;
        
        // 由于异步内容可能还在渲染，添加延迟重试机制
        setTimeout(() => {
            if (scrollArea && autoScrollEnabled && shouldAutoScroll) {
                scrollArea.scrollTop = scrollArea.scrollHeight;
            }
        }, 100);
        
        // 再次延迟重试，确保所有异步内容都已渲染
        setTimeout(() => {
            if (scrollArea && autoScrollEnabled && shouldAutoScroll) {
                scrollArea.scrollTop = scrollArea.scrollHeight;
                isScrollingRef.current = false;
            }
        }, 300);
    }, [autoScrollEnabled, shouldAutoScroll]);

    useEffect(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea) return;

        // 检查是否有新消息
        const hasNewMessages = data.length > lastDataLengthRef.current;
        
        // 如果有新消息，检查是否需要启用自动滚动
        if (hasNewMessages) {
            // 使用 requestAnimationFrame 确保 DOM 更新完成后再检查位置
            requestAnimationFrame(() => {
                if (scrollArea && isNearBottom(scrollArea)) {
                    setAutoScrollEnabled(true);
                    // 延迟执行滚动，等待可能的异步内容渲染
                    setTimeout(() => {
                        performAutoScroll();
                    }, 50);
                }
            });
        }
        
        // 更新数据长度引用
        lastDataLengthRef.current = data.length;

        // 如果自动滚动已启用，执行滚动
        if (autoScrollEnabled && shouldAutoScroll && !isScrollingRef.current) {
            performAutoScroll();
        }
    }, [data, shouldAutoScroll, performAutoScroll]);

    // 监听滚动事件
    useEffect(() => {
        const scrollAreaNode = scrollAreaRef.current;
        if (!scrollAreaNode) return;

        scrollAreaNode.addEventListener('scroll', handleScroll, { passive: true });

        return () => {
            scrollAreaNode.removeEventListener('scroll', handleScroll);
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, [handleScroll]);

    // 清理函数
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    // 监听Caption组件内容变化事件
    useEffect(() => {
        const handleCaptionContentChanged = (event: CustomEvent) => {
            // 当Caption组件内容发生变化时，如果当前启用了自动滚动，则执行滚动
            if (autoScrollEnabled && shouldAutoScroll) {
                // 延迟执行滚动，确保DOM完全更新
                setTimeout(() => {
                    performAutoScroll();
                }, 100);
            }
        };

        window.addEventListener('captionContentChanged', handleCaptionContentChanged);

        return () => {
            window.removeEventListener('captionContentChanged', handleCaptionContentChanged);
        };
    }, [autoScrollEnabled, shouldAutoScroll, performAutoScroll]);
}

export default useAutoScroll;
