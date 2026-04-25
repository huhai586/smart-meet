/**
 * caption-control — Content Script
 *
 * Provides two complementary caption-enable mechanisms:
 *
 * A) Message-driven (sidepanel → content script):
 *    Sidepanel sends { action: 'enableGoogleMeetingCaptions' } after mounting.
 *    Handles the common case: user joins a meeting while the sidepanel is already open.
 *
 * B) DOM-driven (MutationObserver, runs automatically):
 *    Watches for the "Turn on captions" button to appear in the DOM.
 *    That button ONLY exists in an active meeting room — not in the lobby/waiting screen.
 *    So its first appearance is a reliable "user just entered the meeting" signal,
 *    regardless of URL (which stays the same across lobby → meeting transition).
 *    Handles the case: user opens the extension, THEN joins the meeting.
 *    The observer disconnects after first trigger so it won't re-fire if the user
 *    manually turns captions off later.
 */
import type { PlasmoCSConfig } from "~node_modules/plasmo";
import {
    isGoogleMeeting,
    isCaptionsEnabled,
    enableCaptions,
    getCaptionsToggleButton,
} from '~utils/google-meet-captions-dom';

// ─── A) Message-driven ────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action !== 'enableGoogleMeetingCaptions') return;

    if (!isGoogleMeeting()) {
        console.log('[caption-control] Not a Google Meet page, skipping.');
        sendResponse({ success: false, reason: 'not_google_meet' });
        return true;
    }

    if (isCaptionsEnabled()) {
        console.log('[caption-control] Captions already enabled.');
        sendResponse({ success: true, reason: 'already_enabled' });
        return true;
    }

    const clicked = enableCaptions();
    console.log('[caption-control] Tried to enable captions, clicked:', clicked);
    sendResponse({ success: clicked, reason: clicked ? 'clicked' : 'button_not_found' });
    return true;
});

// ─── B) DOM-driven — watch for meeting entry ──────────────────────────────────

/**
 * Starts a MutationObserver that watches for the "Turn on captions" button
 * to appear for the first time.  Its appearance means:
 *   - We are inside an active meeting room (not lobby / waiting screen).
 *   - Captions are currently off.
 * Once triggered, the observer disconnects so it won't auto-click again
 * if the user deliberately turns captions off later in the same session.
 */
function watchForMeetingEntry(): void {
    if (!isGoogleMeeting()) return;

    // If the button is already present the page loaded mid-meeting — enable now.
    if (getCaptionsToggleButton()) {
        console.log('[caption-control] Captions button already visible on load, enabling.');
        enableCaptions();
        return;
    }

    const observer = new MutationObserver(() => {
        if (!getCaptionsToggleButton()) return;

        // Button just appeared → we entered the meeting room
        observer.disconnect();
        console.log('[caption-control] Meeting entry detected (captions button appeared), enabling captions.');
        enableCaptions();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    console.log('[caption-control] Watching for meeting entry...');
}

watchForMeetingEntry();

export const config: PlasmoCSConfig = {
    matches: ['https://meet.google.com/*'],
};
