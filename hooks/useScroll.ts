import { useRef, useEffect, useCallback, useState } from 'react';
import type { Transcript } from "~hooks/useTranscripts";
import { scrollElementIntoView } from "~components/captions/utils/scrollUtils"

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
 * @param scrollAreaElement
 * @param lastItemElement
 */
function useAutoScroll(
    scrollAreaElement: HTMLDivElement,
    lastItemElement: HTMLDivElement,
    filteredData: Transcript[]
) {
    const [autoScroll, setAutoScroll] = useState(true);
    // Disable auto scroll when user clicks action buttons
    const disableAutoScroll = useCallback(() => {
      setAutoScroll(false)
    }, []);

    // Check if scrolled to bottom and re-enable auto scroll
    const animationFrameId = useRef<number | null>(null);

    useEffect(() => {
        if (animationFrameId.current) {
            cancelAnimationFrame(animationFrameId.current);
        }
        if (autoScroll === false) {
            return;
        }
        if (filteredData.length === 0) {
          return;
        }
        // Check if the latest message is older than 10 minutes
        const lastData = filteredData[filteredData.length - 1];

        if (lastData) {
            const { timestamp } = lastData;
            const now = Date.now();
            const messageTime = new Date(timestamp).getTime();
            const tenMinutesAgo = now - (2 * 60 * 1000); // 2 minutes in milliseconds
            
            // If the latest message is older than 10 minutes, don't auto scroll
            if (messageTime < tenMinutesAgo) {
                console.warn('Latest message is older than 10 minutes, skipping auto scroll');
                return;
            }
        }

        const loopCheck = () => {
            const animate = () => {
                if (autoScroll && lastItemElement) {
                    scrollElementIntoView(lastItemElement);
                } else {
                    console.log('ignore scrolling');
                }
                
                // 继续下一帧
                if (autoScroll) {
                    animationFrameId.current = requestAnimationFrame(animate);
                }
            };
            
            animationFrameId.current = requestAnimationFrame(animate);
        };
        
        loopCheck();
        
        return () => {
            if (animationFrameId.current) {
                cancelAnimationFrame(animationFrameId.current);
            }
        };
    }, [autoScroll, lastItemElement, filteredData]);

    // Return disable function for external use

    const toggleAutoScroll = () => {
        setAutoScroll(!autoScroll)
    }
    return {
        disableAutoScroll,
        toggleAutoScroll,
        autoScroll,
    };
}

export default useAutoScroll;
