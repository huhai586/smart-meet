/**
 * caption-control — Content Script
 *
 * Owns Google Meet's captions state for the extension (see utils/captions-control):
 *
 * A) Message-driven (sidepanel → content script):
 *    Sidepanel sends { action: CaptionsMessage.Enable } after mounting.
 *    Handles the case: user joins a meeting while the sidepanel is already open.
 *
 * B) Entry-driven: the first time the captions control appears in the page it can only be
 *    because the user is inside the meeting room (not the lobby), so captions are enabled once.
 *    Handles the case: user opens the extension, THEN joins the meeting.
 *
 * C) State broadcast: every on/off transition (user click, `c` shortcut, or us) is reported
 *    to the sidepanel as CaptionsMessage.TurnedOn / TurnedOff.
 */
import type { PlasmoCSConfig } from "~node_modules/plasmo";
import { isGoogleMeeting } from '~utils/google-meet-captions-dom';
import getIsExtensionDisabled from '~utils/get-is-extension-disabled';
import openSidePanel from '~utils/open-side-panel';
import {
    CaptionsMessage,
    CaptionsTiming,
    EnableResult,
    enableCaptions,
    watchCaptionsState,
} from '~utils/captions-control';

// ─── A) Message-driven ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action !== CaptionsMessage.Enable) return;

    if (!isGoogleMeeting()) {
        console.log('[caption-control] Not a Google Meet page, skipping.');
        sendResponse({ success: false, reason: 'not_google_meet' });
        return true;
    }

    enableCaptions().then((result) => {
        console.log('[caption-control] Enable captions:', result);
        sendResponse({
            success: result === EnableResult.Enabled || result === EnableResult.AlreadyOn,
            reason: result,
        });
    });
    return true; // async response
});

// ─── B) + C) Entry detection and state broadcast ──────────────────────────────

const notifyCaptionsState = (action: string) => {
    chrome.runtime.sendMessage({ action }, () => {
        // Sidepanel may not be open — ignore "no receiver" errors
        void chrome.runtime.lastError;
    });
};

/**
 * Open the sidepanel when captions are turned on by the user's own action or on meeting entry.
 * chrome.sidePanel.open() needs a user gesture; the browser keeps one alive for ~5s after the
 * user's last click / key press, and it carries through runtime messages to the background.
 * Our own auto-enable (shortcut or synthetic click) is not a gesture, it only works because
 * the user just clicked "Join now" or pressed `c`, so we check the window before trying.
 */
const openSidePanelWhileUserActive = async () => {
    if (!navigator.userActivation.isActive) {
        console.log('[caption-control] No recent user activation, not opening the sidepanel.');
        return;
    }
    if (await getIsExtensionDisabled()) return;

    openSidePanel().catch((error) => {
        console.error('[caption-control] Failed to open the sidepanel:', error);
    });
};

if (isGoogleMeeting()) {
    watchCaptionsState({
        onChange: (state) => {
            notifyCaptionsState(
                state === 'on' ? CaptionsMessage.TurnedOn : CaptionsMessage.TurnedOff,
            );
            // Covers captions switched on with the `c` shortcut, which produces no click.
            if (state === 'on') void openSidePanelWhileUserActive();
        },
        onFirstSeen: (state) => {
            if (state !== 'off') return;
            console.log('[caption-control] Meeting entry detected, enabling captions.');
            // Open right away: the "Join now" click that got the user here is still fresh, the
            // delay below plus the shortcut wait could push us past its ~5s window.
            void openSidePanelWhileUserActive();
            setTimeout(() => {
                enableCaptions().then((result) => {
                    if (result === EnableResult.Failed) {
                        console.warn('[caption-control] Could not enable captions automatically.');
                    }
                });
            }, CaptionsTiming.ENTRY_DELAY_MS);
        },
    });
}

export const config: PlasmoCSConfig = {
    matches: ['https://meet.google.com/*'],
};
