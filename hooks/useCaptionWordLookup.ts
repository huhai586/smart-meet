import { useCallback, useEffect, useRef, useState } from 'react';
import { getCaptionsContainer } from '~node_modules/google-meeting-captions-resolver';
import { getCurrentTranslationProvider } from '~hooks/useTranslationProvider';
import { translateWord } from '~utils/unified-translation';
import { CAPTION_WORD_POPOVER_ID, wordAtPoint, type WordHit } from '~utils/word-lookup';
import { recordLookup } from '~utils/vocab';

export interface WordLookup {
    word: string;
    /** Viewport box of the clicked word; the popover is placed relative to it. */
    rect: WordHit['rect'];
    status: 'loading' | 'done' | 'error';
    translation: string;
    /** How many times the word has now been looked up (1 the first time). */
    count: number;
    /** The caption line the word was in. */
    sentence: string;
}

/**
 * Click a word in Meet's native captions to translate it. Looking a word up also saves it, with the
 * caption line it was heard in: not knowing a word well enough to look it up is what makes it worth keeping.
 *
 * Meet re-renders caption text constantly, so nothing here keeps an element: the word is read from
 * the click point and the result is anchored to that point. Only plain left clicks count; a click
 * that ends a text selection or carries a modifier is the user copying or doing something else.
 */
export const useCaptionWordLookup = (enabled: boolean) => {
    const [lookup, setLookup] = useState<WordLookup | null>(null);
    const cache = useRef(new Map<string, string>());
    const latest = useRef(0);

    const dismiss = useCallback(() => {
        latest.current++;
        setLookup(null);
    }, []);

    useEffect(() => {
        if (!enabled) {
            dismiss();
            return;
        }

        const onClick = async (event: MouseEvent) => {
            const target = event.target instanceof Element ? event.target : null;
            if (!target || target.closest(`#${CAPTION_WORD_POPOVER_ID}`)) return;

            const captions = getCaptionsContainer();
            if (!captions?.contains(target)) {
                dismiss();
                return;
            }

            const isPlainClick = event.button === 0 && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey;
            if (!isPlainClick || window.getSelection()?.toString()) return;

            const hit = wordAtPoint(captions, event.clientX, event.clientY);
            if (!hit) {
                dismiss();
                return;
            }

            const { word, rect, context } = hit;
            const request = ++latest.current;
            const key = `${await getCurrentTranslationProvider()}:${word.toLowerCase()}`;
            if (request !== latest.current) return;

            const save = (translation: string) =>
                recordLookup({ word, translation, sentence: context, meetingName: document.title });

            const cached = cache.current.get(key);
            if (cached !== undefined) {
                const entry = await save(cached);
                if (request === latest.current) setLookup({ word, rect, status: 'done', translation: cached, count: entry?.count ?? 1, sentence: context });
                return;
            }

            setLookup({ word, rect, status: 'loading', translation: '', count: 1, sentence: context });
            try {
                const translation = await translateWord(word, { silent: true, context });
                cache.current.set(key, translation);
                const entry = await save(translation);
                if (request === latest.current) setLookup({ word, rect, status: 'done', translation, count: entry?.count ?? 1, sentence: context });
            } catch {
                // The lookup still counts: the user did not know the word, whether or not a translation came back.
                await save('');
                if (request === latest.current) setLookup({ word, rect, status: 'error', translation: '', count: 1, sentence: context });
            }
        };

        document.addEventListener('click', onClick, true);
        return () => document.removeEventListener('click', onClick, true);
    }, [enabled, dismiss]);

    return { lookup, dismiss };
};
