import { useEffect, useState, useCallback } from "react";
import type { Captions } from "~node_modules/google-meeting-captions-resolver";
import { useDateContext } from '../contexts/DateContext';
import getMeetingCaptions from '../utils/getCaptions';

export type Transcript = Captions & { timestamp: number, meetingName: string };

const useTranscripts = (): [Transcript[], React.Dispatch<React.SetStateAction<Transcript[]>>] => {
    const [currentDayTranscripts, setCurrentDayTranscripts] = useState<Transcript[]>([]);
    const { selectedDate } = useDateContext();

    const loadContent = useCallback(async () => {
        const data = await getMeetingCaptions(selectedDate);
        setCurrentDayTranscripts(prev => {
            // 以全量数据为基准，同时保留 loading 期间通过增量推送进来的新记录
            // 避免 Race Condition：loadContent 等待期间到达的增量更新不会被覆盖
            const sessionSet = new Set(data.map(r => r.session));
            const extra = prev.filter(r => !sessionSet.has(r.session));
            return [...data, ...extra].sort((a, b) => a.timestamp - b.timestamp);
        });
    }, [selectedDate]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    useEffect(() => {
        const handleUpdate = (message: { action: string; data?: Transcript }) => {
            if (message.action !== 'transcripts-updated') return;

            if (message.data) {
                // 增量更新：直接在内存中修改 React State，无需回后台查数据库
                setCurrentDayTranscripts(prev => {
                    const newRecord = message.data!;
                    const last = prev[prev.length - 1];

                    // 优先检查末尾（最高频命中路径），O(1)
                    if (last?.session === newRecord.session) {
                        return [...prev.slice(0, -1), newRecord];
                    }

                    // 末尾不匹配再全量查找（乱序或多说话者切换）
                    // 用 findLastIndex 从末尾向前扫，因为目标 session 通常在近期
                    const idx = prev.findLastIndex(t => t.session === newRecord.session);
                    if (idx > -1) {
                        const next = [...prev];
                        next[idx] = newRecord;
                        return next;
                    }

                    // 全新记录 → 追加到末尾
                    return [...prev, newRecord];
                });
            } else {
                // 没有携带数据（clear/restore 等操作） → 回退全量读取
                loadContent();
            }
        };
        chrome.runtime.onMessage.addListener(handleUpdate);
        return () => {
            chrome.runtime.onMessage.removeListener(handleUpdate);
        };
    }, [loadContent]);

    return [currentDayTranscripts, setCurrentDayTranscripts];
};

export default useTranscripts;
