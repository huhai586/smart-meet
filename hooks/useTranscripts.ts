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
        setCurrentDayTranscripts(data);
    }, [selectedDate]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    useEffect(() => {
        const handleUpdate = (message: { action: string }) => {
            if (message.action === 'transcripts-updated') {
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
