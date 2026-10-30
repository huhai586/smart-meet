/**
 * Locating and reading Google Meet's captions control, for both UI variants:
 *
 *   - classic: a toolbar button that toggles captions directly. Its icon is
 *     `closed_caption_off` (off) / `closed_caption` (on).
 *   - dialog:  a toolbar button (icon `translate_cc`, aria-pressed = captions state) that
 *     opens a "Captions and translation" panel containing the actual toggle row.
 *
 * Nothing here depends on localised text or obfuscated attributes (`jsname`, class names).
 * Perf: always `textContent`, never `innerText` (which forces a synchronous layout).
 */
import { CaptionIcon } from './constants';

export type CaptionsState = 'on' | 'off' | 'unknown';
export type CaptionsUi = 'classic' | 'dialog';

export interface CaptionsControl {
    ui: CaptionsUi;
    /** classic: the toggle itself; dialog: the toolbar button that opens the panel */
    button: HTMLButtonElement;
}

const DIALOG_TOOLBAR_SELECTOR = 'button[aria-haspopup="dialog"][aria-pressed]';
const DIALOG_SELECTOR = '[role="dialog"]';

/** The icon ligature text of a button, '' if it has none. */
export function iconOf(button: Element): string {
    return (button.querySelector('i') ?? button).textContent?.trim() ?? '';
}

function findDialogToolbar(root: ParentNode): HTMLButtonElement | null {
    // Several toolbar buttons match the selector (e.g. reactions), the icon tells them apart.
    for (const button of root.querySelectorAll<HTMLButtonElement>(DIALOG_TOOLBAR_SELECTOR)) {
        if (iconOf(button) === CaptionIcon.DialogToolbar) return button;
    }
    return null;
}

function findClassicToggle(root: ParentNode): HTMLButtonElement | null {
    for (const button of root.querySelectorAll<HTMLButtonElement>('button')) {
        const icon = iconOf(button);
        if (icon !== CaptionIcon.On && icon !== CaptionIcon.Off) continue;
        // The dialog UI's panel row also uses closed_caption_off; that is not the toolbar toggle.
        if (!button.closest(DIALOG_SELECTOR)) return button;
    }
    return null;
}

/** Dialog UI is checked first: its open panel contains buttons that look like the classic toggle. */
export function findCaptionsControl(root: ParentNode = document): CaptionsControl | null {
    const toolbar = findDialogToolbar(root);
    if (toolbar) return { ui: 'dialog', button: toolbar };

    const toggle = findClassicToggle(root);
    return toggle ? { ui: 'classic', button: toggle } : null;
}

/** Never guesses: an unreadable control is 'unknown', not 'on'. */
export function readCaptionsState(control: CaptionsControl | null): CaptionsState {
    if (!control) return 'unknown';

    if (control.ui === 'dialog') {
        const pressed = control.button.getAttribute('aria-pressed');
        if (pressed === 'true') return 'on';
        return pressed === 'false' ? 'off' : 'unknown';
    }

    const icon = iconOf(control.button);
    if (icon === CaptionIcon.On) return 'on';
    return icon === CaptionIcon.Off ? 'off' : 'unknown';
}

/**
 * Dialog UI: the row inside the opened panel that turns captions on (icon `closed_caption_off`).
 * The panel is the dialog sharing the toolbar button's aria-label; other dialogs are a fallback.
 * NOTE: `jsname` must not be used here, it is shared with the "Translate speech" row.
 */
export function findPanelToggle(
    toolbar: HTMLButtonElement,
    root: ParentNode = document,
): HTMLButtonElement | null {
    const label = toolbar.getAttribute('aria-label');
    const dialogs = Array.from(root.querySelectorAll(DIALOG_SELECTOR));
    const ordered = [
        ...dialogs.filter((dialog) => dialog.getAttribute('aria-label') === label),
        ...dialogs.filter((dialog) => dialog.getAttribute('aria-label') !== label),
    ];

    for (const dialog of ordered) {
        for (const button of dialog.querySelectorAll<HTMLButtonElement>('button')) {
            if (iconOf(button) === CaptionIcon.Off) return button;
        }
    }
    return null;
}

/** True when the click target is a control that, when clicked, turns captions ON (either UI). */
export function isTurnOnControl(target: EventTarget | null): boolean {
    const button = target instanceof Element ? target.closest('button') : null;
    return !!button && iconOf(button) === CaptionIcon.Off;
}
