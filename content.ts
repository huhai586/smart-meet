import getCaptions from 'google-meeting-captions-resolver';
import type { PlasmoCSConfig } from "plasmo"
import type {Captions} from "~node_modules/google-meeting-captions-resolver";
import getIsExtensionEnabled from './utils/get-is-extension-enabled';
let isExtensionEnabled = false;

const storeIntoChromeStorage = (records: Captions[]) => {
    chrome.storage.local.set({ 'recordedContents': records }, () => {
        chrome.runtime.sendMessage({
            type: 'contentUpdated',
        });
    });
};

const updateRecords = (incomingData: Captions) => {
    if (!isExtensionEnabled) {return}
    chrome.storage.local.get('recordedContents', ({ recordedContents }) => {
        const records = recordedContents || [];
        const clonedRecords = [...records];
        const matchingRecord = clonedRecords.find(item => item.session === incomingData.session);

        if (matchingRecord) {
            matchingRecord.talkContent = incomingData.talkContent;
        } else {
            clonedRecords.push({ ...incomingData, timestamp: Date.now() });
        }

        storeIntoChromeStorage(clonedRecords);
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
