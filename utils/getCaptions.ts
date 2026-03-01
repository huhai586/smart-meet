import type { Transcript } from "~hooks/useTranscripts";
import { Dayjs } from 'dayjs';

const getMeetingCaptions = async (selectedDate: Dayjs): Promise<Transcript[]> => {
    const result = await chrome.runtime.sendMessage({ action: 'get-transcripts', date: selectedDate });
    console.warn({result, selectedDate})
    return Array.isArray(result) ? result : [];
}

export default getMeetingCaptions;

