const openSidePanel = (): Promise<boolean> => {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "openSidePanel" }, (response) => {
            if (chrome.runtime.lastError) {
                console.error('Failed to send openSidePanel message:', chrome.runtime.lastError);
                reject(chrome.runtime.lastError);
                return;
            }
            
            if (response && response.success) {
                console.log('SidePanel opened successfully');
                resolve(true);
            } else {
                console.error('Failed to open sidepanel:', response?.error || 'Unknown error');
                reject(new Error(response?.error || 'Failed to open sidepanel'));
            }
        });
    });
}

export default openSidePanel;
