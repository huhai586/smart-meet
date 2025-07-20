import initialDataPersistence from "./data-persistence";
import { updateBadgeText } from "./set-badge-text";
import { initMessageHandlers } from "./message-handlers";
import { initTabTracking } from "./tab-tracking";
import { detectAndSetBrowserLanguage } from "./utils/language-utils";

/**
 * 背景页入口文件
 * 负责初始化各个模块
 */

// 监听插件安装事件
chrome.runtime.onInstalled.addListener(async (details) => {
    console.log('插件安装事件触发:', details.reason);
    
    if (details.reason === 'install') {
        // 首次安装时检测并设置浏览器语言
        try {
            const detectedLanguage = await detectAndSetBrowserLanguage();
            console.log('已根据浏览器语言自动设置插件语言:', detectedLanguage.name);
        } catch (error) {
            console.error('设置浏览器语言时出错:', error);
        }
        
        // 首次安装时打开欢迎页面
        // 由于Plasmo的限制，我们使用options页面并导航到欢迎部分
        chrome.tabs.create({
            url: chrome.runtime.getURL('options.html#welcome')
        });
        console.log('首次安装，打开欢迎页面');
    } else if (details.reason === 'update') {
        // 更新时的处理逻辑（可选）
        console.log('插件已更新到版本:', chrome.runtime.getManifest().version);
    }
});

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


