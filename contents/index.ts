import getCaptions from 'google-meeting-captions-resolver';
import type { PlasmoCSConfig } from "plasmo"
import type {Captions} from "~node_modules/google-meeting-captions-resolver";
import getIsExtensionDisabled from '../utils/get-is-extension-disabled';

let isExtensionEnabled = true;


const addOrUpdateRecords = (incomingData: Captions) => {
    if (!isExtensionEnabled) {return}
    // 从content script发送消息
    console.log('context.js', 'addOrUpdateRecords', incomingData)
    chrome.runtime.sendMessage({
        data: {...incomingData, timestamp: new Date().getTime(), meetingName: document.title},
        action: 'addOrUpdateRecords'
    });
};

/**
 * 监听退出通话按钮点击
 * 使用事件委托，简单高效
 */
const setupLeaveCallListener = () => {
    console.log('设置退出通话按钮监听器');
    
    // 使用事件委托监听所有点击事件
    document.addEventListener('click', (event) => {
        const target = event.target as Element;
        
        // 使用 closest 查找最近的按钮元素
        const button = target.closest('button');
        
        if (button) {
            const ariaLabel = button.getAttribute('aria-label') || '';
            
            // 通过 aria-label 判断是否是退出通话按钮（支持多语言）
            const leaveCallKeywords = [
                'Leave call', 'leave call',
                'End call', 'end call',
                '退出通话', '结束通话', '离开'
            ];
            
            const isLeaveCallButton = leaveCallKeywords.some(keyword => ariaLabel.includes(keyword));
            
            if (isLeaveCallButton) {
                console.log('检测到退出通话按钮被点击');
                
                // 延迟一小段时间再同步，确保最后的记录已保存
                setTimeout(() => {
                    chrome.runtime.sendMessage({
                        action: 'sync-on-leave-call'
                    }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.error('发送同步请求失败:', chrome.runtime.lastError);
                        } else {
                            console.log('同步请求已发送', response);
                        }
                    });
                }, 1000); // 延迟1秒
            }
        }
    }, true); // 使用捕获阶段，确保能捕获到事件
    
    console.log('退出通话按钮监听器已设置（使用事件委托）');
};

const start = () => {
    getIsExtensionDisabled().then((disabled: boolean) => {
        isExtensionEnabled = !disabled;
        if (!disabled) {
            getCaptions(undefined, (v) => {
                console.log('captions', v);
                addOrUpdateRecords(v)
            });
            
            // 设置退出通话监听器
            setupLeaveCallListener();
        }
    });
}

console.log('content.ts', 'loaded')
chrome.runtime.onMessage.addListener((message, _sender, _sendResponse) => {
    if (message.action === 'toggleSwitch') {
        start()
    }
});
start();

export const config: PlasmoCSConfig = {
    matches: ["https://meet.google.com/*"],
    all_frames: true
}

// @ts-expect-error - Adding debug property to window
window.huhai = addOrUpdateRecords
