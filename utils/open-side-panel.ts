const openSidePanel = () => {
    chrome.runtime.sendMessage({ action: "openSidePanel" })
}

export default openSidePanel;
