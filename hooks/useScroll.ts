import { useRef, useEffect, useState, useCallback } from 'react';
import type {Transcript} from "~hooks/useTranscripts";

function useAutoScroll(scrollAreaRef: React.RefObject<HTMLDivElement>, data:Transcript[], shouldAutoScroll: boolean = true) {
    const [autoScrollEnabled, setAutoScrollEnabled] = useState(true);
    const lastDataLengthRef = useRef(data.length);
    let lastScrollTop = scrollAreaRef.current?.scrollTop || 0;

    const isNearBottom = (scrollArea: HTMLDivElement) => {
        return scrollArea.scrollHeight - scrollArea.scrollTop - scrollArea.clientHeight < 15;
    };

    const handleScroll = () => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea) return;
        
        const scrollTop = scrollArea.scrollTop;
        if (isNearBottom(scrollArea)) {
            setAutoScrollEnabled(true);
        } else {
            setAutoScrollEnabled(false);
        }
        lastScrollTop = scrollTop;
    }

    useEffect(() => {
        const scrollArea = scrollAreaRef.current;
        if (!scrollArea) return;

        // 检查是否有新消息
        const hasNewMessages = data.length > lastDataLengthRef.current;
        
        // 如果有新消息且用户当前在底部附近，启用自动滚动
        if (hasNewMessages && isNearBottom(scrollArea)) {
            setAutoScrollEnabled(true);
        }
        
        // 更新数据长度引用
        lastDataLengthRef.current = data.length;

        // 执行自动滚动，但只有在shouldAutoScroll为true时
        if (autoScrollEnabled && shouldAutoScroll) {
            scrollArea.scrollTop = scrollArea.scrollHeight;
        }
    }, [data, shouldAutoScroll]);

    useEffect(() => {
        const scrollAreaNode = scrollAreaRef.current;
        if (!scrollAreaNode) return;

        scrollAreaNode.addEventListener('scroll', handleScroll);

        return () => {
            scrollAreaNode.removeEventListener('scroll', handleScroll);
        };
    }, [scrollAreaRef]);
}

export default useAutoScroll;
