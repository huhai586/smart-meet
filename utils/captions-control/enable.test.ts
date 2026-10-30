// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CAPTIONS_SHORTCUT, EnableResult } from './constants';
import { enableCaptions } from './enable';
import { captionsPanel, classicToggle, dialogToolbar, reactionsButton } from './test-fixtures';

interface FakeMeetOptions {
    /** does the `c` shortcut toggle captions? */
    shortcutWorks: boolean;
    /** dialog UI: how long the panel takes to render after the toolbar button is clicked */
    panelDelayMs?: number;
    captionsOn?: boolean;
    /** how long Meet takes to reflect the shortcut (right after joining it can be ~10s) */
    shortcutDelayMs?: number;
}

/** Document-level listeners outlive a test's DOM, so each fake Meet registers its teardown here. */
const disposers: Array<() => void> = [];

/** A tiny stand-in for Meet's behaviour, driven through the real DOM. */
function installFakeMeet(ui: 'classic' | 'dialog', options: FakeMeetOptions) {
    const controller = new AbortController();
    disposers.push(() => controller.abort());

    const stats = { shortcuts: 0, toolbarClicks: 0, captionRowClicks: 0, translateRowClicks: 0 };
    let on = options.captionsOn ?? false;
    let panelOpen = false;

    const render = () => {
        document.body.innerHTML =
            ui === 'classic'
                ? classicToggle(on ? 'closed_caption' : 'closed_caption_off')
                : reactionsButton + dialogToolbar(on, panelOpen) + (panelOpen ? captionsPanel(on) : '');
    };

    // Re-render on every click like a framework would, so elements are replaced under us.
    document.addEventListener('click', (event) => {
        const button = (event.target as Element).closest('button');
        if (!button) return;

        if (ui === 'classic') {
            stats.toolbarClicks++;
            on = !on;
            render();
            return;
        }

        const icon = button.querySelector('i')?.textContent;
        if (icon === 'translate_cc') {
            stats.toolbarClicks++;
            if (panelOpen) {
                panelOpen = false;
                render();
            } else {
                setTimeout(() => {
                    panelOpen = true;
                    render();
                }, options.panelDelayMs ?? 0);
                // aria-expanded flips immediately, the panel renders later
                button.setAttribute('aria-expanded', 'true');
            }
        } else if (icon === 'closed_caption_off' || icon === 'check') {
            stats.captionRowClicks++;
            on = !on;
            render();
        } else if (icon === 'translate_spark') {
            stats.translateRowClicks++;
        }
    }, { signal: controller.signal });

    document.addEventListener('keydown', (event) => {
        if (event.key !== CAPTIONS_SHORTCUT.key) return;
        stats.shortcuts++;
        if (!options.shortcutWorks) return;

        const toggle = () => {
            on = !on;
            render();
        };
        if (options.shortcutDelayMs) setTimeout(toggle, options.shortcutDelayMs);
        else toggle();
    }, { signal: controller.signal });

    render();
    return { stats, isOn: () => on, isPanelOpen: () => panelOpen };
}

/** Run enableCaptions() while advancing fake time until it settles. */
async function runEnable() {
    const promise = enableCaptions();
    await vi.advanceTimersByTimeAsync(60_000);
    return promise;
}

beforeEach(() => {
    vi.useFakeTimers();
    document.body.innerHTML = '';
});

afterEach(() => {
    disposers.splice(0).forEach((dispose) => dispose());
    vi.useRealTimers();
});

describe('enableCaptions', () => {
    it.each(['classic', 'dialog'] as const)(
        '%s UI: uses the shortcut first and does not click anything',
        async (ui) => {
            const meet = installFakeMeet(ui, { shortcutWorks: true });

            expect(await runEnable()).toBe(EnableResult.Enabled);
            expect(meet.isOn()).toBe(true);
            expect(meet.stats.shortcuts).toBe(1);
            expect(meet.stats.toolbarClicks).toBe(0);
        },
    );

    it('classic UI: falls back to clicking when the shortcut is ignored', async () => {
        const meet = installFakeMeet('classic', { shortcutWorks: false });

        expect(await runEnable()).toBe(EnableResult.Enabled);
        expect(meet.isOn()).toBe(true);
        expect(meet.stats.shortcuts).toBe(1);
        expect(meet.stats.toolbarClicks).toBe(1);
    });

    it('dialog UI: falls back to the panel, clicks the captions row only, and closes the panel', async () => {
        const meet = installFakeMeet('dialog', { shortcutWorks: false });

        expect(await runEnable()).toBe(EnableResult.Enabled);
        expect(meet.isOn()).toBe(true);
        expect(meet.stats.captionRowClicks).toBe(1);
        expect(meet.stats.translateRowClicks).toBe(0);
        expect(meet.isPanelOpen()).toBe(false);
    });

    it('dialog UI: waits for a slow panel (well beyond the old 3s limit)', async () => {
        const meet = installFakeMeet('dialog', { shortcutWorks: false, panelDelayMs: 8000 });

        expect(await runEnable()).toBe(EnableResult.Enabled);
        expect(meet.isOn()).toBe(true);
    });

    it.each(['classic', 'dialog'] as const)(
        '%s UI: waits for a slow Meet instead of toggling a second time',
        async (ui) => {
            const meet = installFakeMeet(ui, { shortcutWorks: true, shortcutDelayMs: 10_000 });

            expect(await runEnable()).toBe(EnableResult.Enabled);
            expect(meet.isOn()).toBe(true);
            expect(meet.stats.shortcuts).toBe(1);
            expect(meet.stats.toolbarClicks).toBe(0);
        },
    );

    it('stops toggling once the control disappears, instead of guessing', async () => {
        const meet = installFakeMeet('classic', { shortcutWorks: false });
        const collapseToolbar = () => {
            document.body.innerHTML = reactionsButton; // e.g. Meet collapsed its toolbar
        };
        document.addEventListener('keydown', collapseToolbar, { once: true });
        disposers.push(() => document.removeEventListener('keydown', collapseToolbar));

        expect(await runEnable()).toBe(EnableResult.Unavailable);
        expect(meet.stats.toolbarClicks).toBe(0);
    });

    it('does nothing when captions are already on', async () => {
        const meet = installFakeMeet('dialog', { shortcutWorks: true, captionsOn: true });

        expect(await runEnable()).toBe(EnableResult.AlreadyOn);
        expect(meet.stats.shortcuts).toBe(0);
        expect(meet.stats.toolbarClicks).toBe(0);
    });

    it('does nothing when there is no captions control, e.g. in the lobby', async () => {
        const keydown = vi.fn();
        document.addEventListener('keydown', keydown);
        disposers.push(() => document.removeEventListener('keydown', keydown));
        document.body.innerHTML = reactionsButton;

        expect(await runEnable()).toBe(EnableResult.Unavailable);
        expect(keydown).not.toHaveBeenCalled();
    });

    it('reports failure when neither the shortcut nor the clicks turn captions on', async () => {
        const meet = installFakeMeet('dialog', { shortcutWorks: false, panelDelayMs: 60_000 });

        expect(await runEnable()).toBe(EnableResult.Failed);
        expect(meet.isOn()).toBe(false);
    });

    it('shares one run between concurrent calls so the toggling shortcut is sent once', async () => {
        const meet = installFakeMeet('classic', { shortcutWorks: true });

        const first = enableCaptions();
        const second = enableCaptions();
        await vi.advanceTimersByTimeAsync(30_000);

        expect(await first).toBe(EnableResult.Enabled);
        expect(await second).toBe(EnableResult.Enabled);
        expect(meet.stats.shortcuts).toBe(1);
        expect(meet.isOn()).toBe(true);
    });
});
