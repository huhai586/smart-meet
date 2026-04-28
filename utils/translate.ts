
export const getTranslatedWords: () => Promise<string[]> = () => {
    return new Promise((resolve, _reject) => {
        chrome.storage.sync.get('translatedWords', ({translatedWords}) => {
            console.log({translatedWords})
            resolve(translatedWords || []);
        });
    });
}

export const setTranslatedWords = async (text: string) => {
    const translatedWords = await getTranslatedWords() as string[];
    chrome.storage.sync.set({'translatedWords': [...new Set([...translatedWords, text])]});
}
