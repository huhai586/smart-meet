/**
 * 同步通知组件
 * 在 Google Meet 页面上显示同步状态通知
 */

import { notification } from 'antd';
import type { PlasmoCSConfig } from "plasmo";
import { useEffect } from "react";

export const config: PlasmoCSConfig = {
    matches: ["https://meet.google.com/*"],
    all_frames: false
}

// 监听来自 background 的通知消息
const SyncNotification = () => {
    useEffect(() => {
        console.log('同步通知组件已加载');
        
        // 配置 notification 全局设置
        notification.config({
            placement: 'topRight',
            top: 10,
            duration: 4,
            maxCount: 3,
        });
        
        // 监听来自 background 的消息
        const messageListener = (msg: any) => {
            if (msg.action === 'show-sync-notification') {
                const { type, title, content } = msg.data;
                
                console.log('收到通知请求:', { type, title, content });
                
                switch (type) {
                    case 'success':
                        notification.success({
                            message: title,
                            description: content,
                            duration: 4,
                        });
                        break;
                    case 'error':
                        notification.error({
                            message: title,
                            description: content,
                            duration: 5,
                        });
                        break;
                    case 'warning':
                        notification.warning({
                            message: title,
                            description: content,
                            duration: 4,
                        });
                        break;
                    case 'info':
                    default:
                        notification.info({
                            message: title,
                            description: content,
                            duration: 3,
                        });
                        break;
                }
            }
        };
        
        chrome.runtime.onMessage.addListener(messageListener);
        
        return () => {
            chrome.runtime.onMessage.removeListener(messageListener);
        };
    }, []);
    
    // 不渲染任何 DOM，只是监听消息
    return null;
};

export default SyncNotification;
