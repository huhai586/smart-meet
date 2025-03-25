const getIsExtensionDisabled = () => {
    return new Promise((resolve, reject) => {
        chrome.storage.local.get(['isExtensionDisabled'], (result) => {
        resolve(!!result.isExtensionDisabled);
        });
    });
}

export default getIsExtensionDisabled; 