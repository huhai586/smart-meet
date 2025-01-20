import {useEffect, useState} from "react";
import type {Captions} from "~node_modules/google-meeting-captions-resolver";
import getMeetingCaptions from "../utils/getCaptions";

export type Transcript = Captions & {timestamp: number};

const useTranscripts = () : [Transcript[], React.Dispatch<React.SetStateAction<Transcript[]>>] => {
    const [transcripts, setTranscripts] = useState([]);

    useEffect(() => {
        const loadContent = () => {
            getMeetingCaptions().then((res) => {
                setTranscripts(res);
            });
        };

        // @ts-ignore
        window.loadContent = loadContent;

        // 设置消息监听器
        const messageListener = (message, sender, sendResponse) => {
            const {type, action} = message;
            if (type === 'contentUpdated') {
                loadContent();
            }
            if (action === 'clear') {
                loadContent();
            }
        };

        chrome.runtime.onMessage.addListener(messageListener);
        loadContent();

        return () => {
            console.error('popup unmounted');
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, []);

    return [transcripts, setTranscripts]
};

export default useTranscripts;
