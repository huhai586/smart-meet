import initialDataPersistence from "./data-persistence";
import { updateBadgeText} from "./set-badge-text";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openSidePanel') {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs && tabs.length > 0) {
                const currentTabId = tabs[0].id;
                // 调用 chrome.sidePanel.open() 来打开侧边栏
                chrome.sidePanel.open({tabId: currentTabId});
            } else {
                console.error("No active tab found.");
            }
        });
    }
});

updateBadgeText();
initialDataPersistence();
export {}

console.log(
    "Live now; make now always the most precious time. Now will never come again2."
)


