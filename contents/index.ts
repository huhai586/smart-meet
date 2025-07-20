import getCaptions from 'google-meeting-captions-resolver';
import type { PlasmoCSConfig } from "plasmo"
import type {Captions} from "~node_modules/google-meeting-captions-resolver";
import getIsExtensionDisabled from '../utils/get-is-extension-disabled';

let isExtensionEnabled = true;


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
    getIsExtensionDisabled().then((disabled: boolean) => {
        isExtensionEnabled = !disabled;
        if (!disabled) {
            getCaptions(undefined, (v) => {
                console.log('captions', v);
                addOrUpdateRecords(v)
            })
        }
    });
}

console.log('content.ts', 'loaded')
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.action === 'toggleSwitch') {
        start()
    }
});
start();

export const config: PlasmoCSConfig = {
    matches: ["https://meet.google.com/*"],
    all_frames: true
}

// @ts-expect-error - Adding debug property to window
window.huhai = addOrUpdateRecords
