/** Root element of the click-to-translate popover; clicks inside it are never lookups. */
export const CAPTION_WORD_POPOVER_ID = 'caption-word-popover-root';

const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });

export interface WordHit {
    word: string;
    /** The text around the word (its caption line): a single word is too little to tell the language from. */
    context: string;
    /** The word's rendered box (viewport coordinates, first line if it wraps). */
    rect: { left: number; right: number; top: number; bottom: number };
}

/**
 * The word under a viewport point inside `root`, null if the point is not on a word. Hit-tests the
 * rendered boxes of the root's text instead of asking the browser what is at the point: Meet lays
 * the speaker's name row over the caption text, so the caret API answers with the name ("你").
 */
export const wordAtPoint = (root: Element, x: number, y: number): WordHit | null => {
    const range = document.createRange();
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        for (const part of segmenter.segment(node.textContent ?? '')) {
            if (!part.isWordLike) continue;
            range.setStart(node, part.index);
            range.setEnd(node, part.index + part.segment.length);
            for (const rect of range.getClientRects()) {
                if (x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom) {
                    const { left, right, top, bottom } = rect;
                    return { word: part.segment, context: node.textContent ?? part.segment, rect: { left, right, top, bottom } };
                }
            }
        }
    }
    return null;
};
