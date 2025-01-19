import type {Captions} from '~node_modules/google-meeting-captions-resolver';

const getMeetingCaptions: () => Promise<Captions[]> = () => {
    return new Promise((resolve, reject) => {
        try {
            chrome.storage.local.get('recordedContents', (data) => {
                if (data.recordedContents as Captions[]) {
                    resolve(data.recordedContents);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

export default getMeetingCaptions;
