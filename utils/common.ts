export const getSpecificTags = () => {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['specificHighlightWords'], function(result) {
            resolve(result.specificHighlightWords || []);
        });
    });
}

export const getDomainTags = () => {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['highlightWordsByDescriptions'], function(result) {
            resolve(result.highlightWordsByDescriptions || []);
        });
    });
}

export const getDomain = () => {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['domain'], function(result) {
            resolve(result.domain);
        });
    });
}
