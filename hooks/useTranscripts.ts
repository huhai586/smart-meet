import {useEffect, useState, useMemo} from "react";
import type {Captions} from "~node_modules/google-meeting-captions-resolver";
import { useDateContext } from '../contexts/DateContext';

export type Transcript = Captions & {timestamp: number};

const useTranscripts = () : [Transcript[], React.Dispatch<React.SetStateAction<Transcript[]>>] => {
    const [currentDayTranscripts, setCurrentDayTranscripts] = useState<Transcript[]>([]);
    const { selectedDate } = useDateContext();

    const loadContent = () => {
        console.log('useTranscripts.js', 'loadContent', selectedDate?.toString())
        chrome.runtime.sendMessage({
            action: 'get-transcripts',
            date: selectedDate,
        });
    };

    useEffect(() => {
        loadContent();
    }, [selectedDate]);

    const handleChromeMessage = (message: any, sender: any, sendResponse: any) => {
        if (message.action === 'refresh-transcripts') {
            setCurrentDayTranscripts(message.data);
        }
    }

    useEffect(() => {
        chrome.runtime.onMessage.addListener(handleChromeMessage); // from background
        return () => {
            chrome.runtime.onMessage.removeListener(handleChromeMessage);
        };
    }, [selectedDate]);


    return [currentDayTranscripts,setCurrentDayTranscripts];
};

export default useTranscripts;
