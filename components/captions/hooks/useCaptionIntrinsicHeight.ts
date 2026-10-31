import { useEffect } from 'react';

const CSS_VAR = '--caption-intrinsic-height';
const MEASURE_DELAY_MS = 300;
/** Ignore changes smaller than this, so a new caption doesn't restyle the whole list. */
const MIN_CHANGE_RATIO = 0.1;

/**
 * Keeps `--caption-intrinsic-height` (the placeholder height of captions that are
 * off-screen, see `content-visibility` in captions.scss) close to the real average,
 * measured from the captions currently on screen. A good estimate keeps the scrollbar
 * honest and makes jumping to an unrendered caption land close on the first try.
 */
export const useCaptionIntrinsicHeight = (
    containerRef: React.RefObject<HTMLElement>,
    itemCount: number,
) => {
    useEffect(() => {
        const container = containerRef.current;
        if (!container || itemCount === 0) return;

        const measure = () => {
            const bounds = container.getBoundingClientRect();
            let total = 0;
            let count = 0;
            container.querySelectorAll<HTMLElement>('.caption-container').forEach((item) => {
                const rect = item.getBoundingClientRect();
                if (rect.bottom > bounds.top && rect.top < bounds.bottom) {
                    total += rect.height;
                    count++;
                }
            });
            if (count === 0) return;

            const average = Math.round(total / count);
            const current = parseFloat(container.style.getPropertyValue(CSS_VAR));
            if (!current || Math.abs(average - current) / current > MIN_CHANGE_RATIO) {
                container.style.setProperty(CSS_VAR, `${average}px`);
            }
        };

        let timer: ReturnType<typeof setTimeout>;
        const schedule = () => {
            clearTimeout(timer);
            timer = setTimeout(measure, MEASURE_DELAY_MS);
        };

        schedule();
        // Width changes re-wrap the text, so the average moves with the window size.
        const observer = new ResizeObserver(schedule);
        observer.observe(container);

        return () => {
            clearTimeout(timer);
            observer.disconnect();
        };
    }, [containerRef, itemCount]);
};
