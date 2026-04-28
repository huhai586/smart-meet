const getIsExtensionDisabled = () => {
    return new Promise((resolve, _reject) => {
        chrome.storage.sync.get(['isExtensionDisabled'], (result) => {
        resolve(!!result.isExtensionDisabled);
        });
    });
}

export default getIsExtensionDisabled; 