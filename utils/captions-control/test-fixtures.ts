/**
 * DOM fixtures modelled on what Google Meet actually renders (captured from real meetings,
 * with the obfuscated class names / jsaction attributes stripped). When Meet changes its
 * markup, update these first: the tests then show which strategy broke.
 */

/** Classic UI: the toolbar button toggles captions directly. */
export const classicToggle = (icon: 'closed_caption' | 'closed_caption_off') =>
    `<button aria-label="Turn on captions" jsname="RrG0hf"><span><i class="google-symbols" aria-hidden="true">${icon}</i></span></button>`;

/** Another toolbar button that matches the dialog-toolbar ARIA pattern, but is not captions. */
export const reactionsButton =
    '<button aria-label="Send a reaction" aria-haspopup="dialog" aria-pressed="false" aria-expanded="false"><i aria-hidden="true">mood</i></button>';

/** Dialog UI (enterprise gray-release): toolbar button, aria-pressed carries the captions state. */
export const dialogToolbar = (pressed: boolean, expanded = false) =>
    `<button aria-label="Captions and translation" role="button" aria-haspopup="dialog" aria-pressed="${pressed}" aria-expanded="${expanded}"><i class="google-symbols" aria-hidden="true">translate_cc</i></button>`;

/** Dialog UI panel. NOTE both rows share `jsname`, like the real thing. */
export const captionsPanel = (captionsOn: boolean) =>
    `<div role="dialog" aria-label="Captions and translation">
        <button jsname="RrG0hf"><i aria-hidden="true">${captionsOn ? 'check' : 'closed_caption_off'}</i>${captionsOn ? 'Turn off live captions' : 'Turn on captions'}</button>
        <button jsname="RrG0hf"><i aria-hidden="true">translate_spark</i>Translate speech</button>
        <button><i aria-hidden="true">settings</i></button>
    </div>`;

export const unrelatedDialog =
    '<div role="dialog" aria-label="Gemini is available"><button><i aria-hidden="true">close</i></button></div>';
