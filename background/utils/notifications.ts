/**
 * 通知工具模块 - 已禁用
 * 
 * 注意：所有通知功能已被移除，现在只是一个占位文件
 */

// 导出一个空接口以保持类型兼容性
export interface NotificationOptions {
    title: string;
    message: string;
    iconUrl?: string;
    priority?: number;
    requireInteraction?: boolean;
}

// 导出一个空函数替代原来的showNotification
export function showNotification(options: NotificationOptions): void {
    console.log('通知已禁用:', options.title, options.message);
    // 不执行任何实际的通知操作
} 