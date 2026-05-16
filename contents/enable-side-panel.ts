import openSidePanel from "~utils/open-side-panel";
import { getConfigValue, onConfigChanged } from '~utils/appConfig';
import type {PlasmoCSConfig} from "~node_modules/plasmo";
import { CAPTIONS_ON_BUTTON_LABELS, CAPTIONS_OFF_BUTTON_LABELS } from '~utils/google-meet-captions-dom';

// Build combined CSS selectors for both button types
const captionOnSelector = CAPTIONS_ON_BUTTON_LABELS
    .map(label => `button[aria-label="${label}"]`)
    .join(', ');

const captionOffSelector = CAPTIONS_OFF_BUTTON_LABELS
    .map(label => `button[aria-label="${label}"]`)
    .join(', ');

// Cache disabled state synchronously so the click handler doesn't need an async read.
// This avoids breaking the browser's user-gesture token before openSidePanel() is called.
let cachedIsDisabled = false;
getConfigValue('isExtensionDisabled').then((v) => { cachedIsDisabled = !!v; });
onConfigChanged((changes) => {
    if ('isExtensionDisabled' in changes) {
        cachedIsDisabled = !!(changes.isExtensionDisabled as { value: boolean }).value;
    }
});

document.addEventListener('click', (ev) => {
    const clickedElement = ev.target as HTMLElement;

    // User clicked "Turn on captions" → open sidepanel + notify that captions are on
    if (clickedElement.closest(captionOnSelector)) {
        // Notify sidepanel so it can dismiss any "captions off" warning
        chrome.runtime.sendMessage({ action: 'captionsTurnedOn' }, () => {
            void chrome.runtime.lastError;
        });
        // Use cached value synchronously — keeps user gesture valid for openSidePanel()
        if (!cachedIsDisabled) {
            openSidePanel().catch((error) => {
                console.error('Failed to open sidepanel from caption button:', error);
            });
        }
        return;
    }

    // User clicked "Turn off captions" → notify sidepanel
    if (clickedElement.closest(captionOffSelector)) {
        chrome.runtime.sendMessage({ action: 'captionsTurnedOff' }, () => {
            // Ignore errors — sidepanel may not be open
            void chrome.runtime.lastError;
        });
    }
})

export const config: PlasmoCSConfig = {
    matches: ["https://meet.google.com/*"]
}
