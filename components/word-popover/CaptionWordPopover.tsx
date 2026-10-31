import { useEffect, useRef, useState } from "react";
import { t } from "~utils/i18n";
import { getTranslatedWords, setTranslatedWords } from "~utils/translate";
import type { WordLookup } from "~hooks/useCaptionWordLookup";

const AUTO_DISMISS_MS = 2000;
/** Distance between the popover and the word it belongs to. */
const WORD_GAP_PX = 50;
const SIDE_MARGIN_PX = 12;
const HALF_WIDTH_PX = 150;
const FLIP_BELOW_PX = 110;

const BookmarkIcon = ({ filled }: { filled: boolean }) => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" className="cw-icon">
        <path d="M6 4h12v17l-6-4-6 4z" />
    </svg>
);

interface CaptionWordPopoverProps {
    lookup: WordLookup;
    onDismiss: () => void;
}

/** Small card next to the clicked word: the word, its translation, and a button to save it. */
const CaptionWordPopover: React.FC<CaptionWordPopoverProps> = ({ lookup, onDismiss }) => {
    const [saved, setSaved] = useState(false);
    const hovered = useRef(false);

    useEffect(() => {
        let cancelled = false;
        setSaved(false);
        getTranslatedWords().then((words) => {
            if (!cancelled) setSaved(words.includes(lookup.word));
        });
        return () => {
            cancelled = true;
        };
    }, [lookup.word]);

    // Leave on its own, but never while the pointer is on it (or while still loading).
    useEffect(() => {
        if (lookup.status === 'loading') return;
        const timer = setInterval(() => {
            if (!hovered.current) onDismiss();
        }, AUTO_DISMISS_MS);
        return () => clearInterval(timer);
    }, [lookup, onDismiss]);

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onDismiss();
        };
        window.addEventListener('keydown', onKeyDown, true);
        return () => window.removeEventListener('keydown', onKeyDown, true);
    }, [onDismiss]);

    const save = () => {
        setSaved(true);
        void setTranslatedWords(lookup.word);
    };

    const { rect } = lookup;
    const centerX = (rect.left + rect.right) / 2;
    const left = Math.min(Math.max(centerX, HALF_WIDTH_PX + SIDE_MARGIN_PX), window.innerWidth - HALF_WIDTH_PX - SIDE_MARGIN_PX);
    const below = rect.top < FLIP_BELOW_PX + WORD_GAP_PX;

    return (
        <div
            className={`cw-popover${below ? ' below' : ''}`}
            style={{ left, top: below ? rect.bottom + WORD_GAP_PX : rect.top - WORD_GAP_PX }}
            role="status"
            onMouseEnter={() => { hovered.current = true; }}
            onMouseLeave={() => { hovered.current = false; }}
        >
            <div className="cw-text">
                <span className="cw-word">{lookup.word}</span>
                <span className={`cw-translation${lookup.status === 'error' ? ' error' : ''}`}>
                    {lookup.status === 'loading' && <span className="cw-dots" aria-hidden="true"><i /><i /><i /></span>}
                    {lookup.status === 'done' && lookup.translation}
                    {lookup.status === 'error' && t('word_popover_failed')}
                </span>
            </div>
            {lookup.status === 'done' && (
                <button
                    type="button"
                    className={`cw-save${saved ? ' saved' : ''}`}
                    onClick={save}
                    disabled={saved}
                    aria-label={saved ? t('word_popover_saved') : t('word_popover_save')}
                    title={saved ? t('word_popover_saved') : t('word_popover_save')}
                >
                    <BookmarkIcon filled={saved} />
                </button>
            )}
        </div>
    );
};

export default CaptionWordPopover;
