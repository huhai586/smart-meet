/**
 * Reports captions on/off changes however they happen (user click, the `c` shortcut, or us),
 * by reading the control's state instead of listening for clicks.
 *
 * Perf: the observer is attached to the single toggle button only, with a narrow filter, so
 * the rest of the (very busy) meeting DOM never wakes it up. Steady state is one timer every
 * HEARTBEAT_MS doing an `isConnected` read; a full scan only happens while the control is
 * missing (back-off) or after Meet replaced the button.
 */
import { CaptionsTiming } from './constants';
import {
    findCaptionsControl,
    readCaptionsState,
    type CaptionsControl,
    type CaptionsState,
} from './dom';

export interface CaptionsWatchHandlers {
    /** Only fired for real transitions between 'on' and 'off', never for the initial read. */
    onChange: (state: 'on' | 'off') => void;
    /** Fired once, the first time the control shows up (i.e. the user is inside the meeting). */
    onFirstSeen?: (state: CaptionsState) => void;
}

export function watchCaptionsState(handlers: CaptionsWatchHandlers): () => void {
    let control: CaptionsControl | null = null;
    let observer: MutationObserver | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last: CaptionsState = 'unknown';
    let seen = false;
    let stopped = false;
    let rescanDelay: number = CaptionsTiming.RESCAN_MIN_MS;

    const check = () => {
        const state = readCaptionsState(control);
        if (state === 'unknown' || state === last) return;

        const previous = last;
        last = state;
        if (previous !== 'unknown') handlers.onChange(state);
    };

    const detach = () => {
        observer?.disconnect();
        observer = null;
        control = null;
    };

    const attach = (): boolean => {
        const found = findCaptionsControl();
        if (!found) return false;

        control = found;
        observer = new MutationObserver(check);
        observer.observe(found.button, {
            attributes: true,
            attributeFilter: ['aria-pressed', 'aria-label'],
            characterData: true,
            childList: true,
            subtree: true,
        });

        check();
        if (!seen) {
            seen = true;
            handlers.onFirstSeen?.(last);
        }
        return true;
    };

    const tick = () => {
        if (stopped) return;

        let delay: number = CaptionsTiming.HEARTBEAT_MS;
        if (!control?.button.isConnected) {
            detach();
            if (attach()) {
                rescanDelay = CaptionsTiming.RESCAN_MIN_MS;
            } else {
                delay = rescanDelay;
                rescanDelay = Math.min(rescanDelay * 2, CaptionsTiming.RESCAN_MAX_MS);
            }
        }
        timer = setTimeout(tick, delay);
    };

    tick();

    return () => {
        stopped = true;
        clearTimeout(timer);
        detach();
    };
}
