/**
 * Where to put our own button so it sits in Meet's bottom control bar, without touching Meet's DOM.
 *
 * We never inject into the bar (Meet re-renders it, collapses it into "⋯" on narrow windows and
 * renames its classes). Instead the caller measures the captions button, which captions-control
 * already finds without localised text, and this module works out where, in viewport coordinates,
 * a neighbouring button of the same size fits. Pure functions: rects in, rect out.
 */
export interface Rect {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

export interface Viewport {
    width: number;
    height: number;
}

export interface DockSlot {
    left: number;
    top: number;
    size: number;
}

export const DockLayout = {
    /** Buttons of the bar are this close; the chat / participants cluster further right is not. */
    MAX_ROW_GAP_PX: 24,
    /** Space between the buttons and ours; the bar's pill pads about 24px beyond its last button. */
    GAP_PX: 28,
    EDGE_MARGIN_PX: 8,
    MIN_SIZE_PX: 36,
    MAX_SIZE_PX: 56,
} as const;

const width = (rect: Rect) => rect.right - rect.left;
const height = (rect: Rect) => rect.bottom - rect.top;
const centerY = (rect: Rect) => (rect.top + rect.bottom) / 2;

/**
 * The bar around `anchor`: the anchor plus every same-sized button on its row that is connected to
 * it through gaps no wider than MAX_ROW_GAP_PX.
 */
export function findDockRect(anchor: Rect, candidates: Rect[]): Rect {
    const anchorHeight = height(anchor);
    const row = candidates.filter(
        (rect) =>
            width(rect) > 0 &&
            Math.abs(centerY(rect) - centerY(anchor)) <= anchorHeight / 2 &&
            height(rect) >= anchorHeight * 0.6 &&
            height(rect) <= anchorHeight * 1.6,
    );

    const dock = { ...anchor };
    let grew = true;
    while (grew) {
        grew = false;
        for (const rect of row) {
            const touchesRight = rect.left <= dock.right + DockLayout.MAX_ROW_GAP_PX && rect.right > dock.right;
            const touchesLeft = rect.right >= dock.left - DockLayout.MAX_ROW_GAP_PX && rect.left < dock.left;
            if (!touchesRight && !touchesLeft) continue;

            dock.left = Math.min(dock.left, rect.left);
            dock.right = Math.max(dock.right, rect.right);
            dock.top = Math.min(dock.top, rect.top);
            dock.bottom = Math.max(dock.bottom, rect.bottom);
            grew = true;
        }
    }
    return dock;
}

/** Next to the bar: on its right, or on its left when the right side has no room. */
export function placeBesideDock(dock: Rect, anchor: Rect, viewport: Viewport): DockSlot | null {
    const size = Math.min(DockLayout.MAX_SIZE_PX, Math.max(DockLayout.MIN_SIZE_PX, Math.round(height(anchor))));
    const top = Math.round(centerY(anchor) - size / 2);

    let left = Math.round(dock.right + DockLayout.GAP_PX);
    if (left + size + DockLayout.EDGE_MARGIN_PX > viewport.width) {
        left = Math.round(dock.left - DockLayout.GAP_PX - size);
    }
    if (left < DockLayout.EDGE_MARGIN_PX) return null;

    return { left, top, size };
}

/** Meet slides the bar out of view when the pointer is idle; we follow it. */
export function isRectOnScreen(rect: Rect, viewport: Viewport): boolean {
    return (
        width(rect) > 0 &&
        height(rect) > 0 &&
        rect.bottom > 0 &&
        rect.top < viewport.height &&
        rect.right > 0 &&
        rect.left < viewport.width
    );
}
