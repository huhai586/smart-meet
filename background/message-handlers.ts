;
/**
 * 消息处理模块
 * 负责处理从内容脚本和扩展其他部分接收的消息
 */

import { handleSyncRequest } from './sync-manager';
import { broadcastLanguageChange } from './utils/language-utils';


interface Message {
    action: string;
    [key: string]: any;
}

/**
 * 初始化消息处理器
 */
export function initMessageHandlers() {
    console.log('初始化消息处理器...');

    // 主消息监听器
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // 尽早返回true，让Chrome知道我们将异步处理这个消息
        const isAsyncResponse = true;

        try {
            console.log('收到消息:', message, '来自:', sender?.url || '未知来源');

            // 根据消息类型分发到不同的处理函数
            switch (message.action) {
                case 'openSidePanel':
                    handleOpenSidePanel(message, sender, sendResponse);
                    break;

                case 'languageChanged':
                    handleLanguageChanged(message, sendResponse);
                    break;

                case 'sync-to-google-drive':
                    handleSyncRequest(message, sendResponse);
                    break;

                case 'update_meeting_info':
                    handleMeetingInfoUpdate(message, sender, sendResponse);
                    break;

                default:
                    console.log('未知消息类型:', message.action);
                    if (sendResponse) {
                        sendResponse({ success: false, message: 'Unknown action' });
                    }
            }
        } catch (error) {
            console.error('处理消息时出错:', error);
            if (sendResponse) {
                sendResponse({ success: false, error: error?.message || '未知错误' });
            }
        }

        return isAsyncResponse;
    });
}

/**
 * 处理打开侧边栏请求
 */
function handleOpenSidePanel(message: any, sender: chrome.runtime.MessageSender, sendResponse?: (response?: any) => void) {
    console.log('处理打开侧边栏请求');

    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs && tabs.length > 0) {
            const currentTab = tabs[0];
            const currentTabId = currentTab.id;

            try {
                // 调用 chrome.sidePanel.open() 来打开侧边栏
                chrome.sidePanel.open({ tabId: currentTabId })
                    .then(() => {
                        console.log('侧边栏已成功打开');
                        if (sendResponse) {
                            sendResponse({ success: true });
                        }
                    })
                    .catch((error) => {
                        console.error('打开侧边栏失败:', error);
                        if (sendResponse) {
                            sendResponse({
                                success: false,
                                error: error?.message || '打开侧边栏失败'
                            });
                        }
                    });
            } catch (error) {
                console.error('调用chrome.sidePanel.open时出错:', error);
                if (sendResponse) {
                    sendResponse({
                        success: false,
                        error: error?.message || '无法调用侧边栏API'
                    });
                }
            }
        } else {
            console.error('未找到活动标签页');
            if (sendResponse) {
                sendResponse({
                    success: false,
                    error: '未找到活动标签页'
                });
            }
        }
    });
}

/**
 * 处理语言变更请求
 */
function handleLanguageChanged(message: Message, sendResponse?: (response?: Message) => void) {
    broadcastLanguageChange(message.languageCode);

    if (sendResponse) {
        sendResponse({
          success: true,
          action: ""
        })
    }
}

/**
 * 处理会议信息更新
 */
function handleMeetingInfoUpdate(message: Message, sender: chrome.runtime.MessageSender, sendResponse?: (response?: any) => void) {
    if (sender.tab && sender.tab.id) {
        // 更新标签页信息的逻辑移到 tab-tracking.ts 中
        // 这里仅发送事件通知
        chrome.runtime.sendMessage({
            action: 'internal_meeting_info_updated',
            tabId: sender.tab.id,
            data: message.data
        });
    }

    if (sendResponse) {
        sendResponse({ success: true });
    }
}
