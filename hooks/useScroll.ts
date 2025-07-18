import { useRef, useEffect, useCallback } from 'react';
import type { Transcript } from "~hooks/useTranscripts";

/**
 * 自动滚动Hook - 重新设计的简化版本
 * 
 * 这个Hook实现了智能的自动滚动功能，满足以下需求：
 * 
 * 1. **高度变化触发滚动**: 当captions list的高度发生变化时，自动滚动到底部
 * 2. **用户操作停止滚动**: 当用户点击翻译、polish或analysis按钮时，立即停止自动滚动
 * 3. **滚动行为停止滚动**: 当检测到用户在chat-container中滚动时，立即停止自动滚动
 * 4. **接近底部恢复滚动**: 当用户手动滚动到距离底部100px范围内时，重新启用自动滚动
 * 5. **历史消息不滚动**: 通过外部传入的shouldAutoScroll参数控制（已在外部检查消息时间戳）
 * 
 * @param scrollAreaRef - 滚动容器的引用
 * @param data - 字幕数据数组
 * @param shouldAutoScroll - 是否应该启用自动滚动（外部控制，包含消息时间检查）
 * @returns 包含disableAutoScroll函数的对象，用于外部手动禁用自动滚动
 * 
 * @example
 * ```typescript
 * const chatContainer = useRef<HTMLDivElement>(null);
 * const shouldAutoScroll = !isSearchActive && isLatestMessageRecent;
 * const { disableAutoScroll } = useAutoScroll(chatContainer, transcripts, shouldAutoScroll);
 * 
 * // 在某些情况下手动禁用自动滚动
 * const handleSomeAction = () => {
 *   disableAutoScroll();
 * };
 * ```
 */
function useAutoScroll(
    scrollAreaRef: React.RefObject<HTMLDivElement>, 
    data: Transcript[], 
    shouldAutoScroll: boolean = true
) {
    const isUserScrolling = useRef(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    
    // 使用shouldAutoScroll作为autoScrollEnabled的默认值
    const autoScrollEnabled = useRef(shouldAutoScroll);
    
    // 当shouldAutoScroll发生变化时，更新autoScrollEnabled的默认状态
    useEffect(() => {
        if (shouldAutoScroll && !autoScrollEnabled.current) {
            autoScrollEnabled.current = true;
        }
    }, [shouldAutoScroll]);
    
    // Check if user is near bottom (within 100px)
    const isNearBottom = useCallback((scrollArea: HTMLDivElement) => {
        const threshold = 100;
        return scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < threshold;
    }, []);

    // Perform auto scroll to bottom
    const scrollToBottom = useCallback(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea || !autoScrollEnabled.current) {
            return;
        }
        
        scrollArea.scrollTop = scrollArea.scrollHeight;
    }, []);

    // Handle scroll event
    const handleScroll = useCallback(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea) return;
        
        isUserScrolling.current = true;
        
        // Clear existing timeout
        if (scrollTimeoutRef.current) {
            clearTimeout(scrollTimeoutRef.current);
        }
        
        // Debounce scroll handling
        scrollTimeoutRef.current = setTimeout(() => {
            if (isNearBottom(scrollArea)) {
                // User scrolled near bottom, enable auto scroll
                autoScrollEnabled.current = true;
            } else {
                // User scrolled away from bottom, disable auto scroll
                autoScrollEnabled.current = false;
            }
            
            isUserScrolling.current = false;
        }, 150);
    }, [isNearBottom]);

    // Disable auto scroll when user clicks action buttons
    const disableAutoScroll = useCallback(() => {
        autoScrollEnabled.current = false;
    }, []);

    // Monitor container height changes using ResizeObserver
    useEffect(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (const entry of entries) {
                // Only scroll if auto scroll is enabled and not currently user scrolling
                if (autoScrollEnabled.current && !isUserScrolling.current) {
                    // Use requestAnimationFrame to ensure DOM is updated
                    requestAnimationFrame(() => {
                        scrollToBottom();
                    });
                }
            }
        });

        resizeObserver.observe(scrollArea);

        return () => {
            resizeObserver.disconnect();
        };
    }, [scrollToBottom]);

    // Set up scroll event listener
    useEffect(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea) return;

        scrollArea.addEventListener('scroll', handleScroll, { passive: true });
        
        return () => {
            scrollArea.removeEventListener('scroll', handleScroll);
        };
    }, [handleScroll]);



    // Cleanup timeouts
    useEffect(() => {
        return () => {
            if (scrollTimeoutRef.current) {
                clearTimeout(scrollTimeoutRef.current);
            }
        };
    }, []);

    // Return disable function for external use
    return {
        disableAutoScroll
    };
}

export default useAutoScroll;
