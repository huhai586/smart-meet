/**
 * caption-word-translate — Content Script
 *
 * Click a word in Google Meet's native captions and a small card next to it shows the translation
 * (see hooks/useCaptionWordLookup). Turned on/off by the `captionWordTranslateEnabled` setting.
 */
import type { PlasmoCSConfig } from "plasmo";
import "./caption-word-translate.scss";
import CaptionWordPopover from "~components/word-popover/CaptionWordPopover";
import useCaptionWordTranslateToggle from "~hooks/useCaptionWordTranslateToggle";
import { useCaptionWordLookup } from "~hooks/useCaptionWordLookup";
import { CAPTION_WORD_POPOVER_ID } from "~utils/word-lookup";

export const getRootContainer = () => {
    const container = document.createElement('div');
    container.id = CAPTION_WORD_POPOVER_ID;
    document.body.appendChild(container);
    return container;
};

const CaptionWordTranslate = () => {
    const [enabled] = useCaptionWordTranslateToggle();
    const { lookup, dismiss } = useCaptionWordLookup(enabled);

    return lookup ? <CaptionWordPopover lookup={lookup} onDismiss={dismiss} /> : null;
};

export default CaptionWordTranslate;

export const config: PlasmoCSConfig = {
    matches: ["https://meet.google.com/*"],
};
