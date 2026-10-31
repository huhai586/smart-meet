/**
 * The whitespace-delimited word under a screen point, or '' if there is none.
 * Used for captions that are still plain text (no per-word spans).
 */
export const getWordAtPoint = (x: number, y: number): string => {
    const caret = document.caretRangeFromPoint?.(x, y);
    const node = caret?.startContainer;
    if (!caret || !node || node.nodeType !== Node.TEXT_NODE) return '';

    const text = node.textContent ?? '';
    let start = caret.startOffset;
    let end = caret.startOffset;
    while (start > 0 && /\S/.test(text[start - 1])) start--;
    while (end < text.length && /\S/.test(text[end])) end++;
    return text.slice(start, end);
};
