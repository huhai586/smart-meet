import { describe, expect, it } from 'vitest';
import { DockLayout, findDockRect, isRectOnScreen, placeBesideDock, type Rect } from './layout';

const button = (left: number, top = 920, size = 48): Rect => ({ left, top, right: left + size, bottom: top + size });
const viewport = { width: 1600, height: 1000 };

// A bar of six 48px buttons with 8px gaps, starting at x=400, plus the separate right-hand cluster.
const bar = [0, 1, 2, 3, 4, 5].map((i) => button(400 + i * 56));
const rightCluster = [button(1450), button(1506), button(1562 - 8)];

describe('findDockRect', () => {
    it('joins the buttons connected to the anchor and stops at a wide gap', () => {
        const dock = findDockRect(bar[3], [...bar, ...rightCluster]);
        expect(dock.left).toBe(400);
        expect(dock.right).toBe(400 + 5 * 56 + 48);
    });

    it('ignores buttons on other rows or of another size', () => {
        const above = button(456, 400);
        const tiny = { left: 700, top: 930, right: 710, bottom: 940 };
        const dock = findDockRect(bar[0], [above, tiny]);
        expect(dock).toEqual(bar[0]);
    });

    it('returns the anchor when it has no neighbours', () => {
        expect(findDockRect(bar[2], [])).toEqual(bar[2]);
    });
});

describe('placeBesideDock', () => {
    const dock = findDockRect(bar[3], bar);

    it('goes to the right of the bar, centred on the anchor row', () => {
        const slot = placeBesideDock(dock, bar[3], viewport);
        expect(slot).toEqual({ left: dock.right + DockLayout.GAP_PX, top: 920, size: 48 });
    });

    it('falls back to the left side when the right has no room', () => {
        const tight = { width: dock.right + 20, height: 1000 };
        const slot = placeBesideDock(dock, bar[3], tight);
        expect(slot?.left).toBe(dock.left - DockLayout.GAP_PX - 48);
    });

    it('gives up when neither side fits', () => {
        const wide = { left: 4, top: 920, right: 596, bottom: 968 };
        expect(placeBesideDock(wide, bar[0], { width: 600, height: 1000 })).toBeNull();
    });

    it('clamps the size to something button-like', () => {
        const huge = button(400, 900, 120);
        expect(placeBesideDock(huge, huge, viewport)?.size).toBe(DockLayout.MAX_SIZE_PX);
    });
});

describe('isRectOnScreen', () => {
    it('is false once the bar slides below the viewport or collapses', () => {
        expect(isRectOnScreen(bar[0], viewport)).toBe(true);
        expect(isRectOnScreen(button(400, 1040), viewport)).toBe(false);
        expect(isRectOnScreen({ left: 0, top: 0, right: 0, bottom: 0 }, viewport)).toBe(false);
    });
});
