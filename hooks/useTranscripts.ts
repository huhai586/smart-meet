import {useEffect, useState} from "react";
import type {Captions} from "~node_modules/google-meeting-captions-resolver";
import getMeetingCaptions from "../utils/getCaptions";
import setMeetingCaptions from "~utils/set-captions";

export type Transcript = Captions & {timestamp: number};

const useTranscripts = () : [Transcript[], React.Dispatch<React.SetStateAction<Transcript[]>>] => {
    const [transcripts, setTranscripts] = useState([]);

    const loadContent = () => {
        getMeetingCaptions().then((res) => {
            setTranscripts(res);
        });
    };

    useEffect(() => {
        loadContent();
    }, []);

    useEffect(() => {
        setMeetingCaptions(transcripts);
        console.log('store', transcripts);
    }, [transcripts]);

    useEffect(() => {
        // 设置消息监听器
        const messageListener = (message, sender, sendResponse) => {
            const {type, action, data} = message;
            if (action === 'clear') {
                loadContent();
            }
            if(type === 'updateRecords') {
                setTranscripts(currentTranscripts => {
                    const clonedRecords = [...currentTranscripts];
                    const matchingRecord = clonedRecords.find(item => item.session === data.session);

                    if (matchingRecord) {
                        matchingRecord.talkContent = data.talkContent;
                    } else {
                        clonedRecords.push({
                            ...data,
                            timestamp: Date.now()
                        });
                    }

                    return clonedRecords;
                });
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);

        return () => {
            console.error('popup unmounted');
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    return [transcripts, setTranscripts]
};

export default useTranscripts;
