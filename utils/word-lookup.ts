/** Root element of the click-to-translate popover; clicks inside it are never lookups. */
export const CAPTION_WORD_POPOVER_ID = 'caption-word-popover-root';

const segmenter = new Intl.Segmenter(undefined, { granularity: 'word' });

/**
 * The word at a caret offset in `text`, '' when the caret is not on a word. Uses Intl.Segmenter,
 * so punctuation is dropped, "don't" stays one word, and languages without spaces still work.
 */
export const wordAtOffset = (text: string, offset: number): string => {
    // A caret placed on the far half of a word's last letter sits at the start of whatever follows,
    // so look at the character before the caret as well.
    for (const position of [offset, offset - 1]) {
        if (position < 0 || position >= text.length) continue;
        for (const part of segmenter.segment(text)) {
            if (position >= part.index && position < part.index + part.segment.length) {
                if (part.isWordLike) return part.segment;
                break;
            }
        }
    }
    return '';
};

/** The word under a viewport point, '' if the point is not on text. */
export const wordAtPoint = (x: number, y: number): string => {
    const caret = document.caretRangeFromPoint?.(x, y);
    const node = caret?.startContainer;
    if (!caret || !node || node.nodeType !== Node.TEXT_NODE) return '';
    return wordAtOffset(node.textContent ?? '', caret.startOffset);
};
