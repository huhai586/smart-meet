import { useState, useEffect } from "react";
import type { PlasmoCSConfig } from "plasmo";
import { getCaptionsContainer } from "~node_modules/google-meeting-captions-resolver";
import { t } from "~utils/i18n";
import "./translate-tips.scss";
import StickerNote from "~components/StickerNote";

const MessageOutlinedIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" className="cs-icon">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.17L4 17.17V4h16v12z" />
    </svg>
);

const MessageFilledIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" className="cs-icon">
        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" />
    </svg>
);

const MoreOutlinedIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" className="cs-icon">
        <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
);

const PushpinOutlinedIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" className="cs-icon">
        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
    </svg>
);

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
    const [captionToggleEnabled, setCaptionToggleEnabled] = useState(false);
    const [stickerEnabled, setStickerEnabled] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSticker, setShowSticker] = useState(false);

    useEffect(() => {
        console.log('showSticker state changed:', showSticker);
    }, [showSticker]);

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
        chrome.storage.local.get(['captionToggleEnabled', 'stickerEnabled'], (result) => {
            setCaptionToggleEnabled(result.captionToggleEnabled || false);
            setStickerEnabled(result.stickerEnabled || false);
        });

        // 监听存储变化
        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.captionToggleEnabled) {
                setCaptionToggleEnabled(changes.captionToggleEnabled.newValue || false);
            }
            if (changes.stickerEnabled) {
                setStickerEnabled(changes.stickerEnabled.newValue || false);
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

    // 如果不在会议页面，返回空
    if (!shouldRender) {
        return null;
    }

    // 如果两个功能都未启用，返回空
    if (!captionToggleEnabled && !stickerEnabled) {
        return null;
    }

    return (
        <>
            <div 
                className="caption-button-group-container"
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                <div className={`caption-button-group ${isExpanded ? 'expanded' : 'collapsed'}`}>
                    {isExpanded && (
                        <>
                            {stickerEnabled && (
                                <button
                                    className="cs-btn caption-sticker-button"
                                    onClick={() => setShowSticker(!showSticker)}
                                    title={t('add_note') || 'Add Note'}
                                >
                                    <PushpinOutlinedIcon />
                                </button>
                            )}
                            {captionToggleEnabled && (
                                <button
                                    className={`cs-btn caption-action-button ${isHidden ? 'hidden' : 'visible'}`}
                                    onClick={toggleCaptionsVisibility}
                                    title={isHidden ? t('show_captions') : t('hide_captions')}
                                >
                                    {isHidden ? <MessageOutlinedIcon /> : <MessageFilledIcon />}
                                </button>
                            )}
                        </>
                    )}
                    <button className="cs-btn caption-menu-button">
                        <MoreOutlinedIcon />
                    </button>
                </div>
            </div>
            {showSticker && <StickerNote onClose={() => setShowSticker(false)} />}
        </>
    )
}

export default PlasmoInline

export const config: PlasmoCSConfig = {
    matches: ["https://meet.google.com/*"]
}
