import { useState, useEffect, useRef } from "react";
import type { PlasmoCSConfig } from "plasmo";
import { getCaptionsContainer } from "~node_modules/google-meeting-captions-resolver";
import { t } from "~utils/i18n";
import "./translate-tips.scss";
import StickerNote from "~components/StickerNote";
import MeetDockMenu from "~components/meet-dock/MeetDockMenu";
import { useMeetDockAnchor } from "~hooks/useMeetDockAnchor";
import { MEET_TOOLS_CONTAINER_ID } from "~utils/meet-dock/constants";
import { watchCaptionsState } from "~utils/captions-control";
import { getConfigValue, onConfigChanged } from "~utils/appConfig";

export const getRootContainer = () => {
    const tempDiv = document.createElement('div')
    tempDiv.id = MEET_TOOLS_CONTAINER_ID;
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
    const [showSticker, setShowSticker] = useState(false);
    const watcherRef = useRef<(() => void) | null>(null);
    const anchor = useMeetDockAnchor(inMeetingRoom && (captionToggleEnabled || stickerEnabled));

    useEffect(() => {
        console.log('showSticker state changed:', showSticker);
    }, [showSticker]);

    // ── Detect actual meeting entry via DOM ──────────────────────────────
    // The meeting control bar (with the captions control) only appears once the
    // user is inside the meeting room, not in the Lobby/waiting screen.
    // captions-control finds that control in both Meet UIs without localised labels,
    // and reports the first time it shows up (including when it is already there).
    const startMeetingObserver = () => {
        if (watcherRef.current) return; // already watching

        watcherRef.current = watchCaptionsState({
            onFirstSeen: () => setInMeetingRoom(true),
        });
    };

    const stopMeetingObserver = () => {
        watcherRef.current?.();
        watcherRef.current = null;
    };

    // ── URL-based guard: only run observer on meeting URLs ───────────────
    const isMeetingUrl = () => {
        const pathname = window.location.pathname;
        if (pathname === '/' || pathname === '') return false;
        // Meet serves meetings both as /abc-defg-hij and /meet/abc-defg-hij
        const meetingCodePattern = /^\/(?:meet\/)?[a-z0-9]+-[a-z0-9]+-[a-z0-9]+$/i;
        if (meetingCodePattern.test(pathname)) return true;
        return /^\/lookup\//.test(pathname) || /^\/[a-z0-9]{10,}$/i.test(pathname);
    };

    useEffect(() => {
        // Load feature flags
        Promise.all([
            getConfigValue('captionToggleEnabled'),
            getConfigValue('stickerEnabled'),
        ]).then(([captionToggle, sticker]) => {
            setCaptionToggleEnabled(captionToggle || false);
            setStickerEnabled(sticker || false);
        });

        const unsubscribe = onConfigChanged((changes) => {
            if (changes.captionToggleEnabled) setCaptionToggleEnabled((changes.captionToggleEnabled as { value: boolean }).value || false);
            if (changes.stickerEnabled) setStickerEnabled((changes.stickerEnabled as { value: boolean }).value || false);
        });

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
            unsubscribe();
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
            <MeetDockMenu
                anchor={anchor}
                noteEnabled={stickerEnabled}
                captionToggleEnabled={captionToggleEnabled}
                captionsHidden={isHidden}
                onNote={() => setShowSticker(!showSticker)}
                onToggleCaptions={toggleCaptionsVisibility}
            />
            {showSticker && <StickerNote onClose={() => setShowSticker(false)} />}
        </>
    )
}

export default PlasmoInline

export const config: PlasmoCSConfig = {
    matches: ["https://meet.google.com/*"]
}
