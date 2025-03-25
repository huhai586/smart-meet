import openSidePanel from "~utils/open-side-panel";
import getIsExtensionDisabled from "~utils/get-is-extension-disabled";
import type {PlasmoCSConfig} from "~node_modules/plasmo";

document.addEventListener('click', (ev) => {
    const clickedElement = ev.target as HTMLElement;
    const isCaptionButton = clickedElement.closest('button[aria-label="Turn on captions"]') || clickedElement.closest('button[aria-label="开启字幕"]');
    if (isCaptionButton) {
        getIsExtensionDisabled().then((disabled: boolean) => {
            if (!disabled) {
                openSidePanel();
            }
        })
    }
})

export const config: PlasmoCSConfig = {
    matches: ["https://meet.google.com/*"]
}
