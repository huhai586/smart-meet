/**
 * 语言工具模块
 * 负责处理语言相关的功能
 */

/**
 * 将语言变更广播给所有组件
 */
export function broadcastLanguageChange(languageCode: string): void {
    console.log('广播语言变更:', languageCode);
    
    // 获取所有打开的标签页
    chrome.tabs.query({}, function(tabs) {
        // 向所有标签页发送消息
        tabs.forEach(tab => {
            if (tab.id) {
                try {
                    chrome.tabs.sendMessage(tab.id, {
                        action: 'languageChanged',
                        languageCode: languageCode
                    });
                } catch (error) {
                    // 忽略无法发送消息的错误（例如，标签页不接受消息）
                    console.log(`向标签页 ${tab.id} 发送消息时出错:`, error);
                }
            }
        });
        
        // 向其他组件发送消息
        try {
            chrome.runtime.sendMessage({
                action: 'languageChanged',
                languageCode: languageCode
            });
        } catch (error) {
            // 忽略无法发送消息的错误
            console.log('广播语言变更时出错:', error);
        }
    });
} 