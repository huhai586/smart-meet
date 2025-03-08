import type {Transcript} from "~hooks/useTranscripts";

const setMeetingCaptions: (data:Transcript[]) => Promise<void> = (data) => {
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
