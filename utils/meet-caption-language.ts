/**
 * Reads the caption language set in Google Meet ("Meeting language" under Captions) from Meet's DOM.
 *
 * While captions are on, Meet keeps that setting in the page as a listbox whose options carry
 * BCP-47 codes (`<li role="option" data-value="en-US" aria-selected="true">`), even with the captions
 * settings closed. Its aria-label is localized, so it is found by its options instead.
 */

/** Meet lists ~90 caption languages; other listboxes on the page are much shorter. */
const MIN_LANGUAGE_OPTIONS = 20;

/** Caption languages always carry a region or variant ('en-US', 'cmn-Hans-CN', 'ar-x-LEVANT'). */
const CAPTION_LANGUAGE_CODE = /^[a-z]{2,3}(-[a-z0-9]+)+$/i;

/** The caption language Meet is set to, as Meet names it ('en-US'), or null when it can't be read. */
export const readMeetCaptionLanguage = (doc: Document = document): string | null => {
  for (const list of doc.querySelectorAll('ul[role="listbox"]')) {
    if (list.querySelectorAll('li[role="option"][data-value]').length < MIN_LANGUAGE_OPTIONS) continue;
    if (!list.querySelector('li[role="option"][data-value="en-US"]')) continue;
    const selected = list.querySelector('li[role="option"][aria-selected="true"]')?.getAttribute('data-value');
    if (selected && CAPTION_LANGUAGE_CODE.test(selected)) return selected;
  }
  return null;
};
