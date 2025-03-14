import getCaptions from 'google-meeting-captions-resolver';
import type { PlasmoCSConfig } from "plasmo"
import type {Captions} from "~node_modules/google-meeting-captions-resolver";
import getIsExtensionEnabled from '../utils/get-is-extension-enabled';

let isExtensionEnabled = false;


const addOrUpdateRecords = (incomingData: Captions) => {
    if (!isExtensionEnabled) {return}
    // 从content script发送消息
    console.log('context.js', 'addOrUpdateRecords', incomingData)
    chrome.runtime.sendMessage({
        data: {...incomingData, timestamp: new Date().getTime(), meetingName: document.title},
        action: 'addOrUpdateRecords'
    });
};

const start = () => {
    getIsExtensionEnabled().then((enabled: boolean) => {
        isExtensionEnabled = enabled;
        if (enabled) {
            getCaptions(undefined, (v) => {
                console.log('captions', v);
                addOrUpdateRecords(v)
            })
        }
    });
}

console.log('content.ts', 'loaded')
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'toggleSwitch') {
        start()
    }
});
start();

export const config: PlasmoCSConfig = {
    matches: ["https://meet.google.com/*"],
    all_frames: true
}

// @ts-ignore
window.huhai = addOrUpdateRecords
