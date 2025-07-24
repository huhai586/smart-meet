import { useState, useEffect } from "react";
import { Tooltip } from "antd";
import { MessageOutlined, MessageFilled } from "@ant-design/icons";
import type { PlasmoCSConfig } from "plasmo";
import { getCaptionsContainer } from "~node_modules/google-meeting-captions-resolver";
import { t } from "~utils/i18n";
import "./translate-tips.scss";

export const getRootContainer = () => {
    const tempDiv = document.createElement('div')
    tempDiv.id = 'caption-toggle-container';
    tempDiv.className = 'caption-toggle-container';
    document.body.appendChild(tempDiv)
    console.log('Caption toggle container created')
    return tempDiv
}

const PlasmoInline = () => {
    const [isHidden, setIsHidden] = useState(false);
    const [shouldRender, setShouldRender] = useState(false);
    const [isFeatureEnabled, setIsFeatureEnabled] = useState(false);

    // 检查是否在实际的会议页面
    const checkIfInMeeting = () => {
        const pathname = window.location.pathname;

        // 如果是根路径或只有斜杠，不渲染
        if (pathname === '/' || pathname === '') {
            return false;
        }

        // 检查是否有会议室代码格式 (通常是 abc-def-ghi 这样的格式)
        const meetingCodePattern = /^\/[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/i;
        if (meetingCodePattern.test(pathname)) {
            return true;
        }

        // 检查其他可能的会议页面格式
        const otherMeetingPatterns = [
            /^\/lookup\//,  // 查找页面
            /^\/[a-z0-9]{10,}$/i,  // 长代码格式
        ];

        return otherMeetingPatterns.some(pattern => pattern.test(pathname));
    };

    useEffect(() => {
        // 检查功能是否启用
        chrome.storage.local.get(['captionToggleEnabled'], (result) => {
            setIsFeatureEnabled(result.captionToggleEnabled || false);
        });

        // 监听存储变化
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.captionToggleEnabled) {
                setIsFeatureEnabled(changes.captionToggleEnabled.newValue || false);
            }
        };

        chrome.storage.onChanged.addListener(handleStorageChange);

        // 初始检查
        setShouldRender(checkIfInMeeting());

        // 监听 URL 变化（SPA 路由变化）
        const handleLocationChange = () => {
            setShouldRender(checkIfInMeeting());
        };

        // 监听 popstate 事件（浏览器前进后退）
        window.addEventListener('popstate', handleLocationChange);

        // 监听 pushstate 和 replacestate（程序化导航）
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;

        history.pushState = function (...args) {
            originalPushState.apply(history, args);
            setTimeout(handleLocationChange, 0);
        };

        history.replaceState = function (...args) {
            originalReplaceState.apply(history, args);
            setTimeout(handleLocationChange, 0);
        };

        return () => {
            window.removeEventListener('popstate', handleLocationChange);
            history.pushState = originalPushState;
            history.replaceState = originalReplaceState;
            chrome.storage.onChanged.removeListener(handleStorageChange);
        };
    }, []);

    const toggleCaptionsVisibility = () => {
        const captionsContainer = getCaptionsContainer();

        if (!captionsContainer) {
            console.warn('Captions container not found');
            return;
        }

        if (!isHidden) {
            // 隐藏字幕：设置高度为0
            captionsContainer.style.height = '0px';
            captionsContainer.style.overflow = 'hidden';
            setIsHidden(true);
            console.log('Captions hidden');
        } else {
            // 显示字幕：移除我们设置的样式，恢复原始状态
            captionsContainer.style.removeProperty('height');
            captionsContainer.style.removeProperty('overflow');
            setIsHidden(false);
            console.log('Captions restored');
        }
    };

    // 如果功能未启用或不应该渲染，返回空
    if (!isFeatureEnabled || !shouldRender) {
        return null;
    }

    return (
        <div>
            <Tooltip
                title={isHidden ? t('show_captions') : t('hide_captions')}
                placement="left"
            >
                <button
                    onClick={toggleCaptionsVisibility}
                    className={`caption-toggle-button ${isHidden ? 'hidden' : 'visible'}`}
                >
                    {isHidden ? <MessageOutlined /> : <MessageFilled />}
                </button>
            </Tooltip>
        </div>
    )
}

export default PlasmoInline

export const config: PlasmoCSConfig = {
    matches: ["https://meet.google.com/*"]
}
