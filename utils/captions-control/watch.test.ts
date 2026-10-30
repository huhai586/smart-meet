// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CaptionsTiming } from './constants';
import { watchCaptionsState } from './watch';
import { classicToggle, dialogToolbar } from './test-fixtures';

const flush = () => vi.advanceTimersByTimeAsync(10);

const setIcon = (icon: string) => {
    document.querySelector('i')!.textContent = icon;
};
const setPressed = (pressed: boolean) => {
    document.querySelector('[aria-pressed]')!.setAttribute('aria-pressed', String(pressed));
};

let stop: (() => void) | undefined;

beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
});

afterEach(() => {
    stop?.();
    stop = undefined;
    vi.useRealTimers();
});

describe('watchCaptionsState', () => {
    it('does not report the initial state, only later changes (classic UI, any source)', async () => {
        document.body.innerHTML = classicToggle('closed_caption_off');
        const onChange = vi.fn();
        stop = watchCaptionsState({ onChange });
        await flush();
        expect(onChange).not.toHaveBeenCalled();

        setIcon('closed_caption'); // user clicked, pressed `c`, or we did: all look the same
        await flush();
        setIcon('closed_caption_off');
        await flush();

        expect(onChange.mock.calls).toEqual([['on'], ['off']]);
    });

    it('reports changes of the dialog UI toolbar button', async () => {
        document.body.innerHTML = dialogToolbar(true);
        const onChange = vi.fn();
        stop = watchCaptionsState({ onChange });
        await flush();

        setPressed(false);
        await flush();
        setPressed(true);
        await flush();

        expect(onChange.mock.calls).toEqual([['off'], ['on']]);
    });

    it('ignores mutations that do not change the state, and unreadable states', async () => {
        document.body.innerHTML = dialogToolbar(true);
        const onChange = vi.fn();
        stop = watchCaptionsState({ onChange });
        await flush();

        document.querySelector('[aria-pressed]')!.setAttribute('aria-label', 'Something else');
        setPressed(true);
        document.querySelector('[aria-pressed]')!.setAttribute('aria-pressed', 'mixed');
        await flush();

        expect(onChange).not.toHaveBeenCalled();
    });

    it('calls onFirstSeen once with the initial state', async () => {
        document.body.innerHTML = classicToggle('closed_caption_off');
        const onFirstSeen = vi.fn();
        stop = watchCaptionsState({ onChange: vi.fn(), onFirstSeen });
        await flush();

        expect(onFirstSeen).toHaveBeenCalledTimes(1);
        expect(onFirstSeen).toHaveBeenCalledWith('off');

        document.body.innerHTML = classicToggle('closed_caption');
        await vi.advanceTimersByTimeAsync(CaptionsTiming.HEARTBEAT_MS * 2);
        expect(onFirstSeen).toHaveBeenCalledTimes(1);
    });

    it('waits for the control to appear, e.g. while the user is still in the lobby', async () => {
        const onFirstSeen = vi.fn();
        stop = watchCaptionsState({ onChange: vi.fn(), onFirstSeen });
        await vi.advanceTimersByTimeAsync(5000);
        expect(onFirstSeen).not.toHaveBeenCalled();

        document.body.innerHTML = dialogToolbar(false);
        await vi.advanceTimersByTimeAsync(CaptionsTiming.RESCAN_MAX_MS);

        expect(onFirstSeen).toHaveBeenCalledWith('off');
    });

    it('re-attaches when Meet replaces the button and reports a change that happened meanwhile', async () => {
        document.body.innerHTML = classicToggle('closed_caption_off');
        const onChange = vi.fn();
        stop = watchCaptionsState({ onChange });
        await flush();

        document.body.innerHTML = classicToggle('closed_caption'); // brand new element, already on
        await vi.advanceTimersByTimeAsync(CaptionsTiming.HEARTBEAT_MS);
        expect(onChange).toHaveBeenCalledWith('on');

        // and the new element is observed too
        setIcon('closed_caption_off');
        await flush();
        expect(onChange).toHaveBeenLastCalledWith('off');
    });

    it('stops reporting after the returned disposer is called', async () => {
        document.body.innerHTML = classicToggle('closed_caption_off');
        const onChange = vi.fn();
        const dispose = watchCaptionsState({ onChange });
        await flush();

        dispose();
        setIcon('closed_caption');
        await vi.advanceTimersByTimeAsync(CaptionsTiming.HEARTBEAT_MS * 2);

        expect(onChange).not.toHaveBeenCalled();
    });
});
