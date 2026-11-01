import { useEffect } from 'react';
import { getCaptionsContainer } from '~node_modules/google-meeting-captions-resolver';
import { useVocabLookupSet } from '~hooks/useVocab';
import { matchesVocab } from '~utils/vocab-core';
import { wordRangesIn } from '~utils/word-lookup';

// The CSS Custom Highlight API is newer than the DOM typings this project builds against.
declare global {
  interface HighlightRegistry {
    set(name: string, highlight: Highlight): void;
    delete(name: string): boolean;
  }
  class Highlight {
    constructor(...ranges: Range[]);
  }
  namespace CSS {
    const highlights: HighlightRegistry | undefined;
  }
}

/** Name of the highlight; contents/caption-word-translate.scss styles it with ::highlight(...). */
export const SAVED_WORD_HIGHLIGHT = 'smart-meet-saved-word';
/** Meet recreates the captions container; check now and then that we are still watching the live one. */
const CONTAINER_POLL_MS = 500;
/** Captions change word by word; repaint once they settle. */
const REPAINT_DELAY_MS = 120;

/**
 * Marks the words the user looked up before whenever they come up again in Meet's native captions.
 *
 * It paints with the CSS Custom Highlight API instead of wrapping the words in elements: Meet owns that
 * DOM and our caption capture watches it for changes, so any node we added there could confuse both.
 * A highlight only colours ranges of text and changes nothing in the page.
 */
export const useSavedWordHighlight = (enabled: boolean) => {
  const lookupSet = useVocabLookupSet();

  useEffect(() => {
    const highlights = typeof CSS !== 'undefined' ? CSS.highlights : undefined;
    if (!enabled || !highlights || lookupSet.size === 0) return;

    let watched: HTMLElement | null = null;
    let repaintTimer: ReturnType<typeof setTimeout> | undefined;

    const paint = () => {
      const captions = getCaptionsContainer();
      const ranges = captions ? wordRangesIn(captions, (word) => matchesVocab(word, lookupSet)) : [];
      if (ranges.length > 0) highlights.set(SAVED_WORD_HIGHLIGHT, new Highlight(...ranges));
      else highlights.delete(SAVED_WORD_HIGHLIGHT);
    };

    const schedulePaint = () => {
      clearTimeout(repaintTimer);
      repaintTimer = setTimeout(paint, REPAINT_DELAY_MS);
    };

    const observer = new MutationObserver(schedulePaint);
    const watchContainer = () => {
      const captions = getCaptionsContainer();
      if (captions === watched) return;
      observer.disconnect();
      watched = captions;
      if (captions) observer.observe(captions, { childList: true, subtree: true, characterData: true });
      schedulePaint();
    };

    watchContainer();
    const poll = setInterval(watchContainer, CONTAINER_POLL_MS);

    return () => {
      clearInterval(poll);
      clearTimeout(repaintTimer);
      observer.disconnect();
      highlights.delete(SAVED_WORD_HIGHLIGHT);
    };
  }, [enabled, lookupSet]);
};

export default useSavedWordHighlight;
