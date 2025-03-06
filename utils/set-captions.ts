import type {Captions} from '~node_modules/google-meeting-captions-resolver';

const setMeetingCaptions: (data:Captions[]) => Promise<void> = (data) => {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.set({ recordedContents: data }, () => {
                resolve()
            });
        } catch (e) {
            reject(e);
        }
    });
}

export default setMeetingCaptions;
