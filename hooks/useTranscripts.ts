import {useEffect, useState, useMemo} from "react";
import type {Captions} from "~node_modules/google-meeting-captions-resolver";
import getMeetingCaptions from "../utils/getCaptions";
import setMeetingCaptions from "~utils/set-captions";
import dayjs from 'dayjs';
import { useDateContext } from '../contexts/DateContext';

export type Transcript = Captions & {timestamp: number};

const useTranscripts = () : [Transcript[], React.Dispatch<React.SetStateAction<Transcript[]>>, Transcript[]] => {
    const [allTranscripts, setAllTranscripts] = useState<Transcript[]>([]);
    const { selectedDate } = useDateContext();

    const loadContent = () => {
        getMeetingCaptions().then((res) => {
            setAllTranscripts(res);
        });
    };

    useEffect(() => {
        loadContent();
    }, []);

    // useEffect(() => {
    //     setMeetingCaptions(allTranscripts);
    //     console.log('store', allTranscripts);
    // }, [allTranscripts]);

    useEffect(() => {
        window.addEventListener('refresh-transcripts', loadContent);

        // 设置消息监听器
        const messageListener = (message, sender, sendResponse) => {
            const {type, action, data} = message;
            if (action === 'clear') {
                loadContent();
            }
            if(type === 'addOrUpdateRecords') {
                setAllTranscripts(currentTranscripts => {
                    const clonedRecords = [...currentTranscripts];
                    const matchingRecord = clonedRecords.find(item => item.session === data.session);

                    if (matchingRecord) {
                        // update
                        matchingRecord.talkContent = data.talkContent;
                    } else {
                        // add
                        clonedRecords.push(data);
                    }
                    return clonedRecords;
                });
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        return () => {
            window.removeEventListener('refresh-transcripts', loadContent);
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    // 根据选中日期过滤记录
    const filteredTranscripts = useMemo(() => {
        if (!selectedDate) {
            return allTranscripts;
        }

        const targetDate = selectedDate.format('YYYY-MM-DD');
        return allTranscripts.filter(transcript => {
            const transcriptDate = dayjs(transcript.timestamp).format('YYYY-MM-DD');
            return transcriptDate === targetDate;
        });
    }, [allTranscripts, selectedDate]);

    return [filteredTranscripts, setAllTranscripts, allTranscripts];
};

export default useTranscripts;
