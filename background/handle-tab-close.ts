import { autoSyncService } from "./auto-sync-service";
import dayjs from "dayjs";

// 存储Meet标签页信息的对象
const meetTabs = {};

// 监听标签页更新，收集Meet标签页信息
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
    if (tab.url && tab.url.includes('meet.google.com') && changeInfo.status === 'complete') {
        console.log('Google Meet 页面加载完成:', tabId);
        meetTabs[tabId] = {
            url: tab.url,
            meetingId: extractMeetingId(tab.url),
            lastActive: Date.now(),
            title: tab.title || '会议'
        };
    }
});

// 从内容脚本接收会议信息更新
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'update_meeting_info' && sender.tab && sender.tab.id) {
        // 更新标签页信息
        if (meetTabs[sender.tab.id]) {
            meetTabs[sender.tab.id] = {
                ...meetTabs[sender.tab.id],
                ...message.data,
                lastUpdated: Date.now()
            };
            console.log('更新了会议信息:', meetTabs[sender.tab.id]);
        }
        
        if (sendResponse) {
            sendResponse({ success: true });
        }
    }
});

// 监听标签页关闭事件
chrome.tabs.onRemoved.addListener(function(tabId, _removeInfo) {
    if (meetTabs[tabId]) {
        console.log('Google Meet 标签页被关闭:', tabId);
        console.log('关闭的会议信息:', meetTabs[tabId]);
        
        // 执行同步操作
        syncMeetingDataToGoogleDrive(meetTabs[tabId]);
        
        // 清理记录
        delete meetTabs[tabId];
    }
});

// 从URL中提取会议ID
function extractMeetingId(url) {
    try {
        const meetUrl = new URL(url);
        // 处理形如 /abc-defg-hij 的路径
        const pathParts = meetUrl.pathname.split('/');
        return pathParts[pathParts.length - 1] || 'unknown';
    } catch (e) {
        console.error('提取会议ID时出错:', e);
        return 'unknown';
    }
}

// 同步会议数据到Google Drive
async function syncMeetingDataToGoogleDrive(meetingInfo) {
    try {
        console.log('准备同步会议数据到Google Drive:', meetingInfo);
        
        // 获取今天的日期，格式为YYYY-MM-DD
        const today = dayjs().format('YYYY-MM-DD');
        
        // 使用autoSyncService进行同步
        const result = await autoSyncService.autoSync(today);
        
        if (result) {
            console.log('同步成功，会议数据已保存到Google Drive');
            // 显示成功通知
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/icon-48.png',
                title: '会议记录已同步',
                message: `${meetingInfo.title || '会议'} 的记录已自动同步到Google Drive`,
                priority: 0
            });
        } else {
            console.warn('同步失败');
            // 显示失败通知
            chrome.notifications.create({
                type: 'basic',
                iconUrl: 'assets/icon-48.png',
                title: '会议记录同步失败',
                message: '无法同步会议记录到Google Drive，请手动同步',
                priority: 1
            });
        }
        
        return result;
    } catch (error) {
        console.error('同步会议数据时出错:', error);
        
        // 显示错误通知
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'assets/icon-48.png',
            title: '同步出错',
            message: '同步会议记录时发生错误，请手动同步',
            priority: 1
        });
        
        return false;
    }
}


export {};


