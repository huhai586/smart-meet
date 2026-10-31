import { useEffect, useState } from 'react';
import { findCaptionsControl } from '~utils/captions-control';
import { MEET_TOOLS_CONTAINER_ID } from '~utils/meet-dock/constants';
import { findDockRect, isRectOnScreen, placeBesideDock, type DockSlot, type Rect } from '~utils/meet-dock/layout';

export interface DockAnchor extends DockSlot {
    /** False while Meet has slid its control bar out of view. */
    visible: boolean;
}

const FOLLOW_INTERVAL_MS = 300;

const sameAnchor = (a: DockAnchor | null, b: DockAnchor | null) =>
    a === b || (!!a && !!b && a.left === b.left && a.top === b.top && a.size === b.size && a.visible === b.visible);

// DOMRect's fields are prototype getters, so it can't be spread or compared as a plain object.
const rectOf = (element: Element): Rect => {
    const { left, top, right, bottom } = element.getBoundingClientRect();
    return { left, top, right, bottom };
};

const measure = (): DockAnchor | null => {
    const control = findCaptionsControl();
    if (!control) return null;

    const viewport = { width: window.innerWidth, height: window.innerHeight };
    const anchor = rectOf(control.button);
    // Our own button must not count as part of Meet's bar, or it would chase itself.
    const buttons = Array.from(document.querySelectorAll('button'))
        .filter((button) => !button.closest(`#${MEET_TOOLS_CONTAINER_ID}`))
        .map(rectOf);
    const slot = placeBesideDock(findDockRect(anchor, buttons), anchor, viewport);
    return slot && { ...slot, visible: isRectOnScreen(anchor, viewport) };
};

/**
 * Follows Meet's bottom control bar and reports where a button of our own fits next to it, in
 * viewport coordinates. null means the bar could not be located, the caller should fall back to a
 * fixed corner. Nothing is injected into Meet's DOM.
 */
export const useMeetDockAnchor = (enabled: boolean): DockAnchor | null => {
    const [anchor, setAnchor] = useState<DockAnchor | null>(null);

    useEffect(() => {
        if (!enabled) return;

        const update = () => {
            const next = measure();
            setAnchor((previous) => (sameAnchor(previous, next) ? previous : next));
        };

        update();
        const timer = setInterval(update, FOLLOW_INTERVAL_MS);
        window.addEventListener('resize', update);
        return () => {
            clearInterval(timer);
            window.removeEventListener('resize', update);
        };
    }, [enabled]);

    return anchor;
};
