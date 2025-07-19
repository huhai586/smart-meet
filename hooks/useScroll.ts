import { useRef, useEffect, useCallback, useState } from 'react';
import type { Transcript } from "~hooks/useTranscripts";
import { scrollElementIntoView, useScrollToVisible } from "~components/captions/utils/scrollUtils"

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
    scrollAreaElement: HTMLDivElement,
    lastItemElement: HTMLDivElement,
) {
    const [autoScroll, setAutoScroll] = useState(true);

    // Check if user is near bottom (within 100px)
    const isNearBottom = useCallback((scrollArea: HTMLDivElement) => {
        const threshold = 100;
        return scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < threshold;
    }, []);


    // Disable auto scroll when user clicks action buttons
    const disableAutoScroll = useCallback(() => {
      setAutoScroll(false)
    }, []);





    // Return disable function for external use
    return {
        disableAutoScroll
    };
}

export default useAutoScroll;
