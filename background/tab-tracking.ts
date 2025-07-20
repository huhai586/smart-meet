/**
 * 标签页跟踪模块
 * 负责跟踪 Google Meet 标签页的生命周期并在标签页关闭时触发同步
 */

import { syncMeetingData } from './sync-manager';

// 存储Meet标签页信息的对象
const meetTabs: Record<number, MeetTabInfo> = {};

// Google Meet 标签页信息接口
export interface MeetTabInfo {
    url: string;
    meetingId: string;
    title: string;
    lastActive: number;
    lastUpdated?: number;
    [key: string]: unknown; // 允许额外属性
}

interface MeetingData {
    [key: string]: unknown;
}

/**
 * 初始化标签页跟踪
 */
export function initTabTracking() {
    console.log('初始化标签页跟踪...');

    // 监听标签页更新，收集Meet标签页信息
    chrome.tabs.onUpdated.addListener(handleTabUpdated);
    
    // 监听标签页关闭事件
    chrome.tabs.onRemoved.addListener(handleTabRemoved);
    
    // 监听内部会议信息更新事件
    chrome.runtime.onMessage.addListener((message) => {
        if (message.action === 'internal_meeting_info_updated' && message.tabId) {
            updateMeetingInfo(message.tabId, message.data);
        }
    });
}

/**
 * 处理标签页更新事件
 */
function handleTabUpdated(tabId: number, changeInfo: chrome.tabs.TabChangeInfo, tab: chrome.tabs.Tab) {
    if (tab.url && tab.url.includes('meet.google.com') && changeInfo.status === 'complete') {
        console.log('Google Meet 页面加载完成:', tabId);
        meetTabs[tabId] = {
            url: tab.url,
            meetingId: extractMeetingId(tab.url),
            lastActive: Date.now(),
            title: tab.title || '会议'
        };
    }
}

/**
 * 处理标签页关闭事件
 */
function handleTabRemoved(tabId: number, _removeInfo: chrome.tabs.TabRemoveInfo) {
    if (meetTabs[tabId]) {
        console.log('Google Meet 标签页被关闭:', tabId);
        console.log('关闭的会议信息:', meetTabs[tabId]);
        
        // 执行同步操作
        syncMeetingData(meetTabs[tabId]);
        
        // 清理记录
        delete meetTabs[tabId];
    }
}

/**
 * 更新会议信息
 */
function updateMeetingInfo(tabId: number, data: MeetingData) {
    if (meetTabs[tabId]) {
        meetTabs[tabId] = {
            ...meetTabs[tabId],
            ...data,
            lastUpdated: Date.now()
        };
        console.log('更新了会议信息:', meetTabs[tabId]);
    }
}

/**
 * 从URL中提取会议ID
 */
function extractMeetingId(url: string): string {
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

/**
 * 获取指定标签页的会议信息
 */
export function getMeetTabInfo(tabId: number): MeetTabInfo | undefined {
    return meetTabs[tabId];
}

/**
 * 获取所有会议标签页信息
 */
export function getAllMeetTabs(): Record<number, MeetTabInfo> {
    return { ...meetTabs }; // 返回副本，避免外部修改
} 