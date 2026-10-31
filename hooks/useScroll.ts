import { useRef, useEffect, useCallback, useState } from 'react';
import type { Transcript } from "~hooks/useTranscripts";
import { scrollElementIntoView } from "~components/captions/utils/scrollUtils"

/**
 * 自动滚动Hook
 *
 * 1. **高度变化触发滚动**: 当captions list的高度发生变化时，自动滚动到底部
 * 2. **用户操作停止滚动**: 当用户点击翻译、polish或analysis按钮时，立即停止自动滚动
 * 3. **滚动行为停止滚动**: 用户向上滚动（滚轮、拖动滚动条、键盘）时，立即停止自动滚动；悬停等布局变化引起的 scrollTop 变化不算
 * 4. **点击恢复**: 只有点击"回到最新"才恢复自动滚动（不根据滚动位置自动恢复，避免和用户拖动互相打架）
 * 5. **历史消息不滚动**: 最新一条消息超过2分钟时不自动滚动
 *
 * 暂停后（autoScroll=false）且离底部超过 FAR_DISTANCE_PX 时 showJumpToLatest 为 true，界面据此显示"回到最新"。
 */
/** Further than this from the bottom, the "jump to latest" pill is offered. */
const FAR_DISTANCE_PX = 100;
/** An upward scroll smaller than this is layout noise (rounding), not the user. */
const SCROLLED_UP_THRESHOLD_PX = 1;
/** An upward scroll within this long of a wheel / key press is the user's. */
const USER_INPUT_WINDOW_MS = 500;
const SCROLL_UP_KEYS = new Set(['ArrowUp', 'PageUp', 'Home']);

const distanceFromBottom = (container: HTMLElement) =>
    container.scrollHeight - container.scrollTop - container.clientHeight;

/**
 * Smooth scrolling is right for following a live caption, but across a long list it crawls and
 * is restarted every time off-screen captions render and shift the list's height (content-visibility),
 * so opening a long meeting could take many seconds to reach the bottom. Jump when far away.
 */
const scrollToBottom = (lastItem: HTMLDivElement) => {
    const container = lastItem.parentElement;
    const distance = container ? container.scrollHeight - container.scrollTop - container.clientHeight : 0;
    if (container && distance > container.clientHeight * 2) {
        lastItem.scrollIntoView({ behavior: 'instant', block: 'nearest', inline: 'nearest' });
    } else {
        scrollElementIntoView(lastItem);
    }
};

function useAutoScroll(
    scrollAreaElement: HTMLDivElement,
    lastItemElement: HTMLDivElement,
    filteredData: Transcript[]
) {
    const [autoScroll, setAutoScrollState] = useState(true);
    // The frame loop below must see a pause immediately, not after React re-renders.
    const autoScrollRef = useRef(true);
    const setAutoScroll = useCallback((value: boolean) => {
        autoScrollRef.current = value;
        setAutoScrollState(value);
    }, []);
    const [isFarFromBottom, setIsFarFromBottom] = useState(false);
    // Disable auto scroll when user clicks action buttons
    const disableAutoScroll = useCallback(() => {
      setAutoScroll(false)
    }, []);

    // Scrolling up pauses auto scroll. The list's own auto scrolling only ever moves down, but layout
    // changes (translations expanding, placeholders resizing) can nudge scrollTop up as well, so an
    // upward scroll only counts when the user is driving it: a button held down (scrollbar drag,
    // selection drag), or a wheel / keyboard input just before it.
    // Resuming is explicit (resumeAutoScroll): deciding it from the scroll position fights the user's drag.
    useEffect(() => {
        const container = scrollAreaElement;
        if (!container) return;

        let lastScrollTop = container.scrollTop;
        let lastUserInputAt = 0;
        let isPointerDown = false;
        const markInput = () => { lastUserInputAt = performance.now(); };

        const onScroll = () => {
            const delta = container.scrollTop - lastScrollTop;
            lastScrollTop = container.scrollTop;
            setIsFarFromBottom(distanceFromBottom(container) > FAR_DISTANCE_PX);
            if (delta < -SCROLLED_UP_THRESHOLD_PX && (isPointerDown || performance.now() - lastUserInputAt < USER_INPUT_WINDOW_MS)) {
                setAutoScroll(false);
            }
        };
        const onWheel = (event: WheelEvent) => {
            markInput();
            if (event.deltaY < 0) setAutoScroll(false);
        };
        const onKeyDown = (event: KeyboardEvent) => {
            if (SCROLL_UP_KEYS.has(event.key)) markInput();
        };
        const onPointerDown = () => { isPointerDown = true; };
        const onPointerUp = () => { isPointerDown = false; };

        container.addEventListener('scroll', onScroll, { passive: true });
        container.addEventListener('wheel', onWheel, { passive: true });
        container.addEventListener('pointerdown', onPointerDown);
        // The release can happen anywhere (the pointer leaves the list while dragging).
        window.addEventListener('pointerup', onPointerUp, true);
        window.addEventListener('pointercancel', onPointerUp, true);
        window.addEventListener('keydown', onKeyDown, true);
        return () => {
            container.removeEventListener('scroll', onScroll);
            container.removeEventListener('wheel', onWheel);
            container.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointerup', onPointerUp, true);
            window.removeEventListener('pointercancel', onPointerUp, true);
            window.removeEventListener('keydown', onKeyDown, true);
        };
    }, [scrollAreaElement, setAutoScroll]);

    // While paused, new captions grow the list below the user without any scroll event.
    useEffect(() => {
        if (autoScroll || !scrollAreaElement) return;
        const frame = requestAnimationFrame(() => setIsFarFromBottom(distanceFromBottom(scrollAreaElement) > FAR_DISTANCE_PX));
        return () => cancelAnimationFrame(frame);
    }, [autoScroll, filteredData, scrollAreaElement]);

    const resumeAutoScroll = useCallback(() => {
        // Scroll right away too: the effect below stays idle when the latest message is old.
        if (lastItemElement) scrollToBottom(lastItemElement);
        setAutoScroll(true);
    }, [lastItemElement, setAutoScroll]);

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
            // scrollIntoView forces a layout even when nothing moved. Only call it when the
            // list's height changed (new caption, translation/AI answer expanded); reading
            // scrollHeight is free while the layout is clean, which is the idle case.
            let lastScrollHeight = -1;

            const animate = () => {
                const scrollHeight = lastItemElement?.parentElement?.scrollHeight ?? -1;
                if (autoScrollRef.current && lastItemElement && scrollHeight !== lastScrollHeight) {
                    lastScrollHeight = scrollHeight;
                    scrollToBottom(lastItemElement);
                }
                
                // 继续下一帧
                if (autoScrollRef.current) {
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

    return {
        disableAutoScroll,
        resumeAutoScroll,
        showJumpToLatest: !autoScroll && isFarFromBottom,
    };
}

export default useAutoScroll;
