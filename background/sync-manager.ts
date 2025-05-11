/**
 * 同步管理模块
 * 负责处理与 Google Drive 同步相关的功能
 */

import { autoSyncService } from "./auto-sync-service";
import dayjs from "dayjs";
import type { MeetTabInfo } from "./tab-tracking";

// 跟踪消息处理状态
const pendingSyncRequests = new Map<string, SyncRequestInfo>();

// 同步请求信息接口
interface SyncRequestInfo {
    timestamp: number;
    date: string;
    status: 'pending' | 'success' | 'failed' | 'error';
    completedAt?: number;
    error?: string;
}

/**
 * 处理同步请求
 */
export function handleSyncRequest(message: any, sendResponse?: (response?: any) => void) {
    console.log('收到同步到Google Drive请求:', message);
    
    // 执行后台自动同步
    if (message.date) {
        // 处理同步请求
        processSyncRequest(message);
        
        // 立即响应
        if (sendResponse) {
            sendResponse({ 
                success: true, 
                message: '同步请求已接收，将在后台处理' 
            });
        }
    } else if (sendResponse) {
        sendResponse({ 
            success: false, 
            message: '缺少日期参数' 
        });
    }
}

/**
 * 同步会议数据到Google Drive
 */
export async function syncMeetingData(meetingInfo: MeetTabInfo): Promise<boolean> {
    try {
        console.log('准备同步会议数据到Google Drive:', meetingInfo);
        
        // 获取今天的日期，格式为YYYY-MM-DD
        const today = dayjs().format('YYYY-MM-DD');
        
        // 使用autoSyncService进行同步
        const result = await autoSyncService.autoSync(today);
        
        if (result) {
            console.log('同步成功，会议数据已保存到Google Drive');
            console.log('会议记录已同步:', `${meetingInfo.title || '会议'} 的记录已自动同步到Google Drive`);
        } else {
            console.warn('同步失败');
            console.warn('会议记录同步失败: 无法同步会议记录到Google Drive，请手动同步');
        }
        
        return result;
    } catch (error) {
        console.error('同步会议数据时出错:', error);
        console.error('同步出错: 同步会议记录时发生错误，请手动同步');
        
        return false;
    }
}

/**
 * 处理同步请求
 */
function processSyncRequest(data: any) {
    const requestId = `sync-${data.date}-${data.timestamp || Date.now()}`;
    
    // 检查是否已经处理过这个请求
    if (pendingSyncRequests.has(requestId)) {
        console.log(`请求已处理，跳过重复处理 (请求ID: ${requestId})`);
        return;
    }
    
    // 记录请求
    pendingSyncRequests.set(requestId, {
        timestamp: Date.now(),
        date: data.date,
        status: 'pending'
    });
    
    console.log(`开始在后台自动同步日期 ${data.date} 的数据 (请求ID: ${requestId})`);
    
    // 使用autoSyncService进行自动同步
    autoSyncService.autoSync(data.date)
        .then(success => {
            console.log(`自动同步${success ? '成功' : '失败'} (请求ID: ${requestId})`);
            
            // 更新请求状态
            pendingSyncRequests.set(requestId, {
                ...pendingSyncRequests.get(requestId)!,
                status: success ? 'success' : 'failed',
                completedAt: Date.now()
            });
            
            // 记录同步结果
            if (success) {
                console.log(`自动同步成功: ${data.date} 的会议记录已成功同步到Google Drive`);
            } else if (!data.isLastAttempt) {
                console.warn('自动同步失败: 无法自动同步会议记录，请进入设置页面手动同步');
            }
        })
        .catch(error => {
            console.error('自动同步过程中发生错误:', error);
            
            // 更新请求状态
            pendingSyncRequests.set(requestId, {
                ...pendingSyncRequests.get(requestId)!,
                status: 'error',
                error: error.message,
                completedAt: Date.now()
            });
            
            // 只有非最后尝试才显示错误信息
            if (!data.isLastAttempt) {
                console.error('自动同步出错: 同步过程中发生错误，请进入设置页面手动同步');
            }
        });
} 