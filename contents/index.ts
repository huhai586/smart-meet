import getCaptions from 'google-meeting-captions-resolver';
import type { PlasmoCSConfig } from "plasmo"
import type {Captions} from "~node_modules/google-meeting-captions-resolver";
import getIsExtensionEnabled from '../utils/get-is-extension-enabled';

let isExtensionEnabled = false;


const updateRecords = (incomingData: Captions) => {
    if (!isExtensionEnabled) {return}
    // 从content script发送消息
    chrome.runtime.sendMessage({
        target: "sidepanel",
        data: incomingData,
        type: 'updateRecords'
    });
};

const start = () => {
    getIsExtensionEnabled().then((enabled: boolean) => {
        isExtensionEnabled = enabled;
        if (enabled) {
            getCaptions(undefined, (v) => {
                console.log('captions', v);
                updateRecords(v)
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
window.huhai = updateRecords
