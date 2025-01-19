const getIsExtensionEnabled = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(['isExtensionEnabled'], (result) => {
        resolve(!!result.isExtensionEnabled);
        });
    });
}

export default getIsExtensionEnabled;
