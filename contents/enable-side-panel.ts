import openSidePanel from "~utils/open-side-panel";
import getIsExtensionDisabled from "~utils/get-is-extension-disabled";
import type {PlasmoCSConfig} from "~node_modules/plasmo";
import { CAPTIONS_ON_BUTTON_LABELS, CAPTIONS_OFF_BUTTON_LABELS } from '~utils/google-meet-captions-dom';

// Build combined CSS selectors for both button types
const captionOnSelector = CAPTIONS_ON_BUTTON_LABELS
    .map(label => `button[aria-label="${label}"]`)
    .join(', ');

const captionOffSelector = CAPTIONS_OFF_BUTTON_LABELS
    .map(label => `button[aria-label="${label}"]`)
    .join(', ');

document.addEventListener('click', (ev) => {
    const clickedElement = ev.target as HTMLElement;

    // User clicked "Turn on captions" → open sidepanel
    if (clickedElement.closest(captionOnSelector)) {
        getIsExtensionDisabled().then(async (disabled: boolean) => {
            if (!disabled) {
                try {
                    await openSidePanel();
                } catch (error) {
                    console.error('Failed to open sidepanel from caption button:', error);
                }
            }
        });
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
