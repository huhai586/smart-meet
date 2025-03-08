import type {Transcript} from "~hooks/useTranscripts";

const getMeetingCaptions: () => Promise<Transcript[]> = () => {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get('recordedContents', (data) => {
                console.log({data})
                if (data.recordedContents as Transcript[]) {
                    resolve(data.recordedContents);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

export default getMeetingCaptions;
