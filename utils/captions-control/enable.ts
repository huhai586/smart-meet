/**
 * Turning captions on. Order: keyboard shortcut first, then clicking.
 *
 * Both the shortcut and the click are TOGGLES, so an attempt is only made when the state was
 * just read as 'off', and every step re-reads the state before acting. If the state cannot be
 * read we do nothing. Meet can take ~10s to reflect a toggle right after joining, so each
 * attempt waits long (see CaptionsTiming) rather than toggling again.
 */
import {
    CAPTIONS_SHORTCUT,
    CaptionsTiming,
    EnableResult,
} from './constants';
import { findCaptionsControl, findPanelToggle, readCaptionsState } from './dom';

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

async function waitFor<T>(probe: () => T | null | false, timeoutMs: number): Promise<T | null> {
    const deadline = Date.now() + timeoutMs;
    for (;;) {
        const value = probe();
        if (value) return value;
        if (Date.now() >= deadline) return null;
        await sleep(CaptionsTiming.POLL_INTERVAL_MS);
    }
}

const currentState = () => readCaptionsState(findCaptionsControl());
const waitForOn = async (timeoutMs: number) =>
    !!(await waitFor(() => currentState() === 'on', timeoutMs));

function dispatchShortcut(): void {
    for (const type of ['keydown', 'keyup'] as const) {
        document.body.dispatchEvent(
            new KeyboardEvent(type, {
                key: CAPTIONS_SHORTCUT.key,
                code: CAPTIONS_SHORTCUT.code,
                keyCode: CAPTIONS_SHORTCUT.keyCode,
                which: CAPTIONS_SHORTCUT.keyCode,
                bubbles: true,
                cancelable: true,
            }),
        );
    }
}

async function enableByClick(): Promise<boolean> {
    const control = findCaptionsControl();
    const state = readCaptionsState(control);
    if (!control || state === 'unknown') return false;
    if (state === 'on') return true;

    if (control.ui === 'classic') {
        control.button.click();
        return waitForOn(CaptionsTiming.STATE_WAIT_MS);
    }

    // dialog UI: open the panel (unless it already is), click the row, close what we opened.
    const toolbar = control.button;
    const openedPanel = toolbar.getAttribute('aria-expanded') !== 'true';
    if (openedPanel) toolbar.click();

    const row = await waitFor(() => findPanelToggle(toolbar), CaptionsTiming.PANEL_WAIT_MS);
    let enabled = false;
    if (row) {
        row.click();
        enabled = await waitForOn(CaptionsTiming.STATE_WAIT_MS);
    }

    // Re-resolve: Meet may have replaced the toolbar button while the panel was open.
    const current = findCaptionsControl();
    if (openedPanel && current?.ui === 'dialog' && current.button.getAttribute('aria-expanded') === 'true') {
        current.button.click();
    }
    return enabled;
}

async function enableByShortcut(): Promise<boolean> {
    dispatchShortcut();
    return waitForOn(CaptionsTiming.SHORTCUT_WAIT_MS);
}

async function run(): Promise<EnableResult> {
    const initial = currentState();
    if (initial === 'on') return EnableResult.AlreadyOn;
    if (initial === 'unknown') return EnableResult.Unavailable;

    for (const attempt of [enableByShortcut, enableByClick]) {
        const state = currentState();
        if (state === 'on') return EnableResult.Enabled; // the previous attempt landed late
        // Control vanished (e.g. layout change): we can no longer tell, never toggle blindly.
        if (state === 'unknown') return EnableResult.Unavailable;

        if (await attempt()) return EnableResult.Enabled;
    }
    return currentState() === 'on' ? EnableResult.Enabled : EnableResult.Failed;
}

let inFlight: Promise<EnableResult> | null = null;

/**
 * Make sure captions are on. Concurrent calls share one run: two overlapping runs could each
 * send the (toggling) shortcut and switch captions straight back off.
 */
export function enableCaptions(): Promise<EnableResult> {
    inFlight ??= run().finally(() => {
        inFlight = null;
    });
    return inFlight;
}
