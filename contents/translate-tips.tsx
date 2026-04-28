import { useState, useEffect, useRef } from "react";
import type { PlasmoCSConfig } from "plasmo";
import { getCaptionsContainer } from "~node_modules/google-meeting-captions-resolver";
import { t } from "~utils/i18n";
import "./translate-tips.scss";
import StickerNote from "~components/StickerNote";
import { CAPTIONS_ON_BUTTON_LABELS, CAPTIONS_OFF_BUTTON_LABELS } from "~utils/google-meet-captions-dom";

const MessageOutlinedIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" className="cs-icon">
        {/* Subtitles OFF — faded CC box + diagonal slash */}
        <path opacity="0.45" d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 14h2v2H6zm4 0h8v2h-8zm-4-4h4v2H6zm6 0h6v2h-6z"/>
        <path d="M1.62 3.38 20.62 22.38 22.38 20.62 3.38 1.62Z"/>
    </svg>
);

const MessageFilledIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" className="cs-icon">
        {/* Subtitles ON — CC box with text lines */}
        <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM6 14h2v2H6zm4 0h8v2h-8zm-4-4h4v2H6zm6 0h6v2h-6z"/>
    </svg>
);

const MoreOutlinedIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" className="cs-icon">
        <path d="M6 10c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm12 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm-6 0c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
    </svg>
);

const PushpinOutlinedIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" className="cs-icon">
        {/* Sticky note with folded bottom-right corner */}
        <path d="M17 2H5c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h9l6-6V4c0-1.1-.9-2-2-2zm0 13h-4v4H5V4h12v11z"/>
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
    const [inMeetingRoom, setInMeetingRoom] = useState(false);
    const [captionToggleEnabled, setCaptionToggleEnabled] = useState(false);
    const [stickerEnabled, setStickerEnabled] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [showSticker, setShowSticker] = useState(false);
    const observerRef = useRef<MutationObserver | null>(null);

    useEffect(() => {
        console.log('showSticker state changed:', showSticker);
    }, [showSticker]);

    // ── Detect actual meeting entry via DOM ──────────────────────────────
    // The meeting control bar (with captions buttons) only appears once the
    // user is inside the meeting room, not in the Lobby/waiting screen.
    // We watch for ANY captions-related button to appear as the signal.
    const captionButtonSelectors = [
        ...CAPTIONS_ON_BUTTON_LABELS,
        ...CAPTIONS_OFF_BUTTON_LABELS,
    ].map(label => `button[aria-label="${label}"]`).join(', ');

    const checkCaptionButtonPresent = () =>
        !!document.querySelector(captionButtonSelectors);

    const startMeetingObserver = () => {
        if (observerRef.current) return; // already watching

        // Already in meeting room when script loads
        if (checkCaptionButtonPresent()) {
            setInMeetingRoom(true);
            return;
        }

        const observer = new MutationObserver(() => {
            if (checkCaptionButtonPresent()) {
                setInMeetingRoom(true);
                observer.disconnect();
                observerRef.current = null;
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
        observerRef.current = observer;
    };

    const stopMeetingObserver = () => {
        observerRef.current?.disconnect();
        observerRef.current = null;
    };

    // ── URL-based guard: only run observer on meeting URLs ───────────────
    const isMeetingUrl = () => {
        const pathname = window.location.pathname;
        if (pathname === '/' || pathname === '') return false;
        const meetingCodePattern = /^\/[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/i;
        if (meetingCodePattern.test(pathname)) return true;
        return /^\/lookup\//.test(pathname) || /^\/[a-z0-9]{10,}$/i.test(pathname);
    };

    useEffect(() => {
        // Load feature flags
        chrome.storage.sync.get(['captionToggleEnabled', 'stickerEnabled'], (result) => {
            setCaptionToggleEnabled(result.captionToggleEnabled || false);
            setStickerEnabled(result.stickerEnabled || false);
        });

        const handleStorageChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
            if (changes.captionToggleEnabled) setCaptionToggleEnabled(changes.captionToggleEnabled.newValue || false);
            if (changes.stickerEnabled) setStickerEnabled(changes.stickerEnabled.newValue || false);
        };
        chrome.storage.onChanged.addListener(handleStorageChange);

        // Start/stop observer based on URL
        const syncObserver = () => {
            if (isMeetingUrl()) {
                startMeetingObserver();
            } else {
                stopMeetingObserver();
                setInMeetingRoom(false);
            }
        };

        syncObserver();

        // SPA navigation
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        const handleLocationChange = () => { setTimeout(syncObserver, 0); };

        window.addEventListener('popstate', handleLocationChange);
        history.pushState = function (...args) { originalPushState.apply(history, args); handleLocationChange(); };
        history.replaceState = function (...args) { originalReplaceState.apply(history, args); handleLocationChange(); };

        return () => {
            window.removeEventListener('popstate', handleLocationChange);
            history.pushState = originalPushState;
            history.replaceState = originalReplaceState;
            chrome.storage.onChanged.removeListener(handleStorageChange);
            stopMeetingObserver();
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

    // 如果还没真正进入会议室，不渲染
    if (!inMeetingRoom) {
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
                    {!isExpanded && (
                        <button className="cs-btn caption-menu-button">
                            <MoreOutlinedIcon />
                        </button>
                    )}
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
