import { useEffect } from 'react';

const CSS_VAR = '--caption-intrinsic-height';
const MEASURE_DELAY_MS = 300;
/** Captions carrying a translation or an AI answer are taller than a typical one. */
const EXTRA_CONTENT_SELECTOR = '.auto-translation-container, .ai-answer-container';

/**
 * Sets `--caption-intrinsic-height` (the placeholder height of captions that are off-screen, see
 * `content-visibility` in captions.scss) to the average height of the plain captions on screen.
 * A good estimate keeps the scrollbar honest and makes jumping to an unrendered caption land
 * close on the first try.
 *
 * It is measured once the list first renders and again when the list's width changes (text
 * re-wraps). Not on every new caption: changing the placeholder resizes every off-screen
 * caption at once, which shifts the whole scroll range and makes the list jump.
 */
export const useCaptionIntrinsicHeight = (
    containerRef: React.RefObject<HTMLElement>,
    itemCount: number,
) => {
    const hasItems = itemCount > 0;

    useEffect(() => {
        const container = containerRef.current;
        if (!container || !hasItems) return;

        const measure = () => {
            const bounds = container.getBoundingClientRect();
            let total = 0;
            let count = 0;
            container.querySelectorAll<HTMLElement>('.caption-container').forEach((item) => {
                if (item.querySelector(EXTRA_CONTENT_SELECTOR)) return;
                const rect = item.getBoundingClientRect();
                if (rect.bottom > bounds.top && rect.top < bounds.bottom) {
                    total += rect.height;
                    count++;
                }
            });
            if (count > 0) container.style.setProperty(CSS_VAR, `${Math.round(total / count)}px`);
        };

        let timer: ReturnType<typeof setTimeout>;
        let lastWidth = container.clientWidth;
        const schedule = () => {
            clearTimeout(timer);
            timer = setTimeout(measure, MEASURE_DELAY_MS);
        };

        schedule();
        const observer = new ResizeObserver(() => {
            // Height-only changes (window taller/shorter) don't re-wrap anything.
            if (container.clientWidth === lastWidth) return;
            lastWidth = container.clientWidth;
            schedule();
        });
        observer.observe(container);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [containerRef, hasItems]);
};
