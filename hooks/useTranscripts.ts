import {useEffect, useState, useCallback} from "react";
import type {Captions} from "~node_modules/google-meeting-captions-resolver";
import { useDateContext } from '../contexts/DateContext';

export type Transcript = Captions & {timestamp: number, meetingName: string};

const useTranscripts = () : [Transcript[], React.Dispatch<React.SetStateAction<Transcript[]>>] => {
    const [currentDayTranscripts, setCurrentDayTranscripts] = useState<Transcript[]>([]);
    const { selectedDate } = useDateContext();

    const loadContent = useCallback(() => {
        console.log('useTranscripts.js', 'loadContent', selectedDate?.toString())
        chrome.runtime.sendMessage({
            action: 'get-transcripts',
            date: selectedDate,
        });
    }, [selectedDate]);

    useEffect(() => {
        loadContent();
    }, [loadContent]);

    const handleChromeMessage = useCallback((message: { action: string; data: Transcript[]; }, _sender: chrome.runtime.MessageSender, _sendResponse: (response?: any) => void) => {
        if (message.action === 'refresh-transcripts') {
            setCurrentDayTranscripts(prevTranscripts => {
                if (message.data.length !== prevTranscripts.length) {
                    return message.data;
                }
                
                const isDifferent = message.data.some((item: Transcript, index: number) => {
                    return item.session !== prevTranscripts[index].session ||
                           item.timestamp !== prevTranscripts[index].timestamp;
                });
                
                return isDifferent ? message.data : prevTranscripts;
            });
        }
    }, []);

    useEffect(() => {
        chrome.runtime.onMessage.addListener(handleChromeMessage);
        return () => {
            chrome.runtime.onMessage.removeListener(handleChromeMessage);
        };
    }, [handleChromeMessage]);

    return [currentDayTranscripts, setCurrentDayTranscripts];
};

export default useTranscripts;
