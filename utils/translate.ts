import type {Captions} from "~node_modules/google-meeting-captions-resolver";

export const getTranslatedWords: () => Promise<string[]> = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get('translatedWords', ({translatedWords}) => {
            console.log({translatedWords})
            resolve(translatedWords || []);
        });
    });
}

export const setTranslatedWords = async (text: string) => {
    const translatedWords = await getTranslatedWords() as string[];
    chrome.storage.local.set({'translatedWords': [...new Set([...translatedWords, text])]});
}
