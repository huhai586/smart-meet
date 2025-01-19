export const getSpecificTags = () => {
    return new Promise((resolve) => {
        chrome.storage.local.get(['specificHighlightWords'], function(result) {
            resolve(result.specificHighlightWords || []);
        });
    });
}

export const getDomainTags = () => {
    return new Promise((resolve) => {
        chrome.storage.local.get(['highlightWordsByDescriptions'], function(result) {
            resolve(result.highlightWordsByDescriptions || []);
        });
    });
}

export const getDomain = () => {
    return new Promise((resolve) => {
        chrome.storage.local.get(['domain'], function(result) {
            resolve(result.domain);
        });
    });
}
