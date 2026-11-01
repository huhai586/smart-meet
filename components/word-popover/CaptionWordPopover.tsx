import { useEffect, useRef, useState } from "react";
import { useI18n } from "~utils/i18n";
import { recordLookup, removeVocabWord } from "~utils/vocab";
import type { WordLookup } from "~hooks/useCaptionWordLookup";

const AUTO_DISMISS_MS = 2000;
/** The arrow's tip floats this far from the word; the arrow itself is ARROW_HEIGHT_PX tall. */
const TIP_GAP_PX = 3;
const ARROW_HEIGHT_PX = 7;
const WORD_GAP_PX = TIP_GAP_PX + ARROW_HEIGHT_PX;
/** Keeps the arrow on the card when the card was nudged away from the word by a screen edge. */
const MAX_ARROW_SHIFT_PX = 120;
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
    // The hook, not the bare t(): it is what loads the user's UI language in this content script.
    const { t } = useI18n();
    // Looking a word up saves it (see useCaptionWordLookup); the button is the way to take it back.
    const [saved, setSaved] = useState(true);
    const hovered = useRef(false);

    useEffect(() => {
        setSaved(true);
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

    const toggleSaved = () => {
        const next = !saved;
        setSaved(next);
        void (next
            ? recordLookup({ word: lookup.word, translation: lookup.translation, sentence: lookup.sentence, meetingName: document.title })
            : removeVocabWord(lookup.word));
    };

    const { rect } = lookup;
    const centerX = (rect.left + rect.right) / 2;
    const left = Math.min(Math.max(centerX, HALF_WIDTH_PX + SIDE_MARGIN_PX), window.innerWidth - HALF_WIDTH_PX - SIDE_MARGIN_PX);
    const below = rect.top < FLIP_BELOW_PX;
    const arrowShift = Math.max(-MAX_ARROW_SHIFT_PX, Math.min(MAX_ARROW_SHIFT_PX, centerX - left));

    return (
        <div
            className={`cw-popover${below ? ' below' : ''}`}
            style={{ left, top: below ? rect.bottom + WORD_GAP_PX : rect.top - WORD_GAP_PX, '--cw-arrow-shift': `${arrowShift}px` } as React.CSSProperties}
            role="status"
            onMouseEnter={() => { hovered.current = true; }}
            onMouseLeave={() => { hovered.current = false; }}
        >
            <div className="cw-text">
                <span className="cw-word">
                    {lookup.word}
                    {lookup.count > 1 && <span className="cw-count">{t('word_popover_lookup_count', { n: String(lookup.count) })}</span>}
                </span>
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
                    onClick={toggleSaved}
                    aria-label={saved ? t('word_popover_unsave') : t('word_popover_save')}
                    title={saved ? t('word_popover_unsave') : t('word_popover_save')}
                >
                    <BookmarkIcon filled={saved} />
                </button>
            )}
        </div>
    );
};

export default CaptionWordPopover;
