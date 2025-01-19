const getAPIkey = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['geminiApiKey'], (result) => {
            if (result.geminiApiKey) {
                resolve(result.geminiApiKey);
            } else {
                reject('API key not found');
            }
        });
    });
};

export default getAPIkey;
