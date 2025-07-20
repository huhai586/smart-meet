const getIsExtensionDisabled = () => {
    return new Promise((resolve, _reject) => {
        chrome.storage.local.get(['isExtensionDisabled'], (result) => {
        resolve(!!result.isExtensionDisabled);
        });
    });
}

export default getIsExtensionDisabled; 