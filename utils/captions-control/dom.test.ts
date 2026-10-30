// @vitest-environment happy-dom
import { beforeEach, describe, expect, it } from 'vitest';
import {
    findCaptionsControl,
    findPanelToggle,
    iconOf,
    isTurnOnControl,
    readCaptionsState,
} from './dom';
import {
    captionsPanel,
    classicToggle,
    dialogToolbar,
    reactionsButton,
    unrelatedDialog,
} from './test-fixtures';

const render = (html: string) => {
    document.body.innerHTML = html;
};

beforeEach(() => {
    document.body.innerHTML = '';
});

describe('findCaptionsControl', () => {
    it('finds the classic toggle and reads its state from the icon', () => {
        render(classicToggle('closed_caption_off'));
        const control = findCaptionsControl();
        expect(control?.ui).toBe('classic');
        expect(readCaptionsState(control)).toBe('off');

        render(classicToggle('closed_caption'));
        expect(readCaptionsState(findCaptionsControl())).toBe('on');
    });

    it('finds the dialog toolbar button and reads its state from aria-pressed', () => {
        render(dialogToolbar(false));
        const control = findCaptionsControl();
        expect(control?.ui).toBe('dialog');
        expect(readCaptionsState(control)).toBe('off');

        render(dialogToolbar(true));
        expect(readCaptionsState(findCaptionsControl())).toBe('on');
    });

    it('does not mistake the reactions button for the captions toolbar button', () => {
        render(reactionsButton + dialogToolbar(true));
        const control = findCaptionsControl();
        expect(control?.ui).toBe('dialog');
        expect(iconOf(control!.button)).toBe('translate_cc');
    });

    it('prefers the dialog UI even while its panel shows a classic-looking row', () => {
        render(dialogToolbar(false, true) + captionsPanel(false));
        expect(findCaptionsControl()?.ui).toBe('dialog');
    });

    it('does not treat a panel row as the classic toggle when the toolbar button is gone', () => {
        render(captionsPanel(false));
        expect(findCaptionsControl()).toBeNull();
    });

    it('returns null when there is no captions control (lobby)', () => {
        render(reactionsButton);
        expect(findCaptionsControl()).toBeNull();
    });
});

describe('readCaptionsState', () => {
    it('is unknown, not "on", when there is no control or the state is unreadable', () => {
        expect(readCaptionsState(null)).toBe('unknown');

        render('<button aria-haspopup="dialog" aria-pressed="mixed"><i>translate_cc</i></button>');
        expect(readCaptionsState(findCaptionsControl())).toBe('unknown');
    });
});

describe('findPanelToggle', () => {
    it('returns the captions row, never the translate row that shares its jsname', () => {
        render(dialogToolbar(false, true) + captionsPanel(false));
        const toolbar = findCaptionsControl()!.button;
        expect(iconOf(findPanelToggle(toolbar)!)).toBe('closed_caption_off');
    });

    it('prefers the dialog with the same label as the toolbar button', () => {
        render(dialogToolbar(false, true) + unrelatedDialog + captionsPanel(false));
        const toolbar = findCaptionsControl()!.button;
        expect(findPanelToggle(toolbar)?.closest('[role="dialog"]')?.getAttribute('aria-label')).toBe(
            'Captions and translation',
        );
    });

    it('returns null when the panel is not rendered or captions are already on', () => {
        render(dialogToolbar(false, true));
        const toolbar = findCaptionsControl()!.button;
        expect(findPanelToggle(toolbar)).toBeNull();

        render(dialogToolbar(true, true) + captionsPanel(true));
        expect(findPanelToggle(findCaptionsControl()!.button)).toBeNull();
    });
});

describe('isTurnOnControl', () => {
    it('is true for the classic toggle and the panel row, including clicks on their icon', () => {
        render(classicToggle('closed_caption_off'));
        expect(isTurnOnControl(document.querySelector('i'))).toBe(true);

        render(dialogToolbar(false, true) + captionsPanel(false));
        expect(isTurnOnControl(document.querySelector('[role="dialog"] i'))).toBe(true);
    });

    it('is false for turn-off controls, other rows, the toolbar button and non-elements', () => {
        render(classicToggle('closed_caption'));
        expect(isTurnOnControl(document.querySelector('button'))).toBe(false);

        render(dialogToolbar(false, true) + captionsPanel(false));
        expect(isTurnOnControl(document.querySelector('[aria-haspopup]'))).toBe(false);
        expect(isTurnOnControl(document.querySelectorAll('[role="dialog"] button')[1])).toBe(false);
        expect(isTurnOnControl(null)).toBe(false);
    });
});
