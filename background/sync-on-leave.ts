/**
 * 退出通话时同步模块
 * 监听退出通话事件，自动同步当天的会议记录到 Google Drive
 */

import { autoSyncService } from "./auto-sync-service";
import dayjs from "dayjs";
import { getSyncNotificationText } from "~utils/i18n-sync";

/**
 * 显示通知（发送消息到 content script）
 */
function showNotification(title: string, content: string, type: 'success' | 'error' | 'warning' | 'info' = 'info'): void {
    console.log('准备显示通知:', { title, content, type });
    
    try {
        // 向所有 Google Meet 标签页发送通知消息
        chrome.tabs.query({ url: 'https://meet.google.com/*' }, (tabs) => {
            tabs.forEach((tab) => {
                if (tab.id) {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'show-sync-notification',
                        data: { type, title, content }
                    }).catch((error) => {
                        console.warn('发送通知到标签页失败:', tab.id, error);
                    });
                }
            });
        });
    } catch (error) {
        console.error('显示通知时出错:', error);
    }
}

/**
 * 检查是否启用了自动同步
 */
async function isAutoSyncEnabled(): Promise<boolean> {
    return new Promise((resolve) => {
        chrome.storage.sync.get(['autoSyncOnLeave'], (result) => {
            // 默认开启
            const enabled = result.autoSyncOnLeave !== false;
            console.log('自动同步设置:', enabled);
            resolve(enabled);
        });
    });
}

/**
 * 处理退出通话时的同步请求
 */
export async function handleLeaveCallSync(): Promise<void> {
    console.log('检测到退出通话，准备同步当天的会议记录');
    
    // 检查是否启用了自动同步
    const autoSyncEnabled = await isAutoSyncEnabled();
    if (!autoSyncEnabled) {
        console.log('自动同步已禁用，跳过同步');
        return;
    }
    
    try {
        // 获取今天的日期
        const today = dayjs().format('YYYY-MM-DD');
        
        // 先检查是否有数据
        let meetingData;
        try {
            meetingData = await autoSyncService.getMeetingData(today);
        } catch (error) {
            console.error('获取会议数据失败:', error);
            const text = await getSyncNotificationText.getDataFailed();
            showNotification(text.title, text.description, 'error');
            return;
        }
        
        if (!meetingData || (Array.isArray(meetingData) && meetingData.length === 0)) {
            console.log('当天没有会议记录，跳过同步');
            const text = await getSyncNotificationText.noData();
            showNotification(text.title, text.description, 'info');
            return;
        }
        
        const messageCount = Array.isArray(meetingData) ? meetingData.length : 0;
        console.log(`发现 ${messageCount} 条会议记录，开始同步...`);
        
        // 执行同步
        let result = false;
        try {
            result = await autoSyncService.autoSync(today);
        } catch (error) {
            console.error('同步过程中发生异常:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            const text = await getSyncNotificationText.error(errorMessage);
            showNotification(text.title, text.description, 'error');
            return;
        }
        
        if (result) {
            // 同步成功
            console.log('会议记录同步成功');
            const text = await getSyncNotificationText.success(messageCount);
            showNotification(text.title, text.description, 'success');
        } else {
            // 同步失败（返回 false）
            console.warn('会议记录同步失败（返回 false）');
            const text = await getSyncNotificationText.failed();
            showNotification(text.title, text.description, 'warning');
        }
    } catch (error) {
        // 捕获所有未预期的错误
        console.error('处理同步请求时发生未预期的错误:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const text = await getSyncNotificationText.error(errorMessage);
        showNotification(text.title, text.description, 'error');
    }
}

/**
 * 初始化退出通话同步监听器
 */
export function initLeaveCallSync(): void {
    console.log('初始化退出通话同步监听器');
    
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (message.action === 'sync-on-leave-call') {
            console.log('收到退出通话同步请求');
            
            // 异步处理同步
            handleLeaveCallSync()
                .then(() => {
                    sendResponse({ success: true });
                })
                .catch((error) => {
                    console.error('处理同步请求时出错:', error);
                    sendResponse({ success: false, error: error.message });
                });
            
            // 返回 true 表示异步响应
            return true;
        }
    });
}
