import openSidePanel from "~utils/open-side-panel";
import { getConfigValue, onConfigChanged } from '~utils/appConfig';
import type {PlasmoCSConfig} from "~node_modules/plasmo";
import { isTurnOnControl } from '~utils/captions-control';

// Cache disabled state synchronously so the click handler doesn't need an async read.
// This avoids breaking the browser's user-gesture token before openSidePanel() is called.
let cachedIsDisabled = false;
getConfigValue('isExtensionDisabled').then((v) => { cachedIsDisabled = !!v; });
onConfigChanged((changes) => {
    if ('isExtensionDisabled' in changes) {
        cachedIsDisabled = !!(changes.isExtensionDisabled as { value: boolean }).value;
    }
});

// The captions on/off state itself is reported by caption-control.ts; this script only
// turns the user's own "turn on captions" click into a sidepanel opening.
document.addEventListener('click', (ev) => {
    // Ignore the synthetic clicks our own auto-enable dispatches: only a real user gesture
    // may open the sidepanel.
    if (!ev.isTrusted) return;

    if (isTurnOnControl(ev.target) && !cachedIsDisabled) {
        // Use cached value synchronously — keeps user gesture valid for openSidePanel()
        openSidePanel().catch((error) => {
            console.error('Failed to open sidepanel from caption button:', error);
        });
    }
})

export const config: PlasmoCSConfig = {
    matches: ["https://meet.google.com/*"]
}
