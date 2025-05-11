import initialDataPersistence from "./data-persistence";
import { updateBadgeText } from "./set-badge-text";
import { initMessageHandlers } from "./message-handlers";
import { initTabTracking } from "./tab-tracking";

/**
 * 背景页入口文件
 * 负责初始化各个模块
 */

// 后台服务初始化函数
function initBackgroundService() {
    console.log('初始化背景页服务...');
    
    // 初始化徽章文本
    updateBadgeText();
    
    // 初始化数据持久化
    initialDataPersistence();
    
    // 初始化消息处理器
    initMessageHandlers();
    
    // 初始化标签页跟踪
    initTabTracking();
}

// 执行初始化
initBackgroundService();
export {}

console.log("Background service worker initialized successfully.");


