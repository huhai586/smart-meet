import type {Transcript} from "~hooks/useTranscripts";
import { Dayjs } from 'dayjs';

const getMeetingCaptions = (selectedDate?: Dayjs): Promise<Transcript[]> => {
    return new Promise((resolve, reject) => {
        const handleMessage = (message) => {
            if (message.action === 'refresh-transcripts') {
                console.log('getCaptions.js', 'refresh-transcripts', message.data)
                resolve(message.data as Transcript[]);
                chrome.runtime.onMessage.removeListener(handleMessage);
            }
        }
        chrome.runtime.sendMessage({
            action: 'get-transcripts',
            date: selectedDate
        });
        chrome.runtime.onMessage.addListener(handleMessage);
    });
}

export default getMeetingCaptions;
