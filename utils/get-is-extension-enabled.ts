const getIsExtensionEnabled = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['isExtensionEnabled'], (result) => {
        resolve(!!result.isExtensionEnabled);
        });
    });
}

export default getIsExtensionEnabled;
