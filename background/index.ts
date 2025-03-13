import { VersionCheck } from '../utils/version-check';
import initialDataPersistence from "./data-persistence";
import { updateBadgeText} from "./set-badge-text";

// 跟踪侧边栏状态
let isSidePanelOpen = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'openSidePanel') {
        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            if (tabs && tabs.length > 0) {
                const currentTabId = tabs[0].id;
                // 调用 chrome.sidePanel.open() 来打开侧边栏
                chrome.sidePanel.open({tabId: currentTabId});
                
                // 更新侧边栏状态
                isSidePanelOpen = true;
                
                // 广播侧边栏状态变化
                broadcastSidePanelStatus();
            } else {
                console.error("No active tab found.");
            }
        });
    }
    
    // 处理关闭侧边栏的消息
    if (message.action === 'closeSidePanel') {
        // 由于Chrome扩展API中的sidePanel没有直接的close方法
        // 我们通过设置状态并广播消息来处理
        isSidePanelOpen = false;
        broadcastSidePanelStatus();
        
        // 通知所有组件侧边栏已关闭
        chrome.runtime.sendMessage({
            action: "closeSidePanelRequest"
        });
    }
    
    // 检查侧边栏状态
    if (message.action === 'checkSidePanelStatus') {
        sendResponse({ isOpen: isSidePanelOpen });
        return true; // 保持消息通道开放，以便异步响应
    }
    
    // 处理语言变更消息，并广播给所有组件
    if (message.action === 'languageChanged' || message.action === 'uiLanguageChanged') {
        // 获取所有打开的标签页
        chrome.tabs.query({}, function(tabs) {
            // 向所有标签页发送消息
            tabs.forEach(tab => {
                if (tab.id) {
                    try {
                        chrome.tabs.sendMessage(tab.id, {
                            action: message.action,
                            languageCode: message.languageCode
                        });
                    } catch (error) {
                        // 忽略无法发送消息的错误（例如，标签页不接受消息）
                        console.log(`Error sending message to tab ${tab.id}:`, error);
                    }
                }
            });
        });
        
        // 向其他组件发送消息
        try {
            chrome.runtime.sendMessage({
                action: message.action,
                languageCode: message.languageCode
            });
        } catch (error) {
            // 忽略无法发送消息的错误
            console.log('Error broadcasting language change:', error);
        }
    }
    
    // 处理侧边栏打开消息
    if (message.action === 'sidePanelOpened') {
        isSidePanelOpen = true;
        broadcastSidePanelStatus();
    }
    
    // 处理侧边栏关闭消息
    if (message.action === 'sidePanelClosed') {
        isSidePanelOpen = false;
        broadcastSidePanelStatus();
    }
});

// 广播侧边栏状态
function broadcastSidePanelStatus() {
    chrome.runtime.sendMessage({
        action: "sidePanelStatusChanged",
        isOpen: isSidePanelOpen
    });
}

updateBadgeText();
initialDataPersistence();

// 检查版本更新
chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === 'update') {
        const shouldShowUpdate = await VersionCheck.checkForUpdate();
        if (shouldShowUpdate) {
            // 打开更新页面
            chrome.tabs.create({
                url: chrome.runtime.getURL('pages/update.html')
            });
        }
    }
});

export {}

console.log(
    "Live now; make now always the most precious time. Now will never come again2."
)


