/** chrome.runtime messages exchanged between the Meet content script and the sidepanel. */
export const CaptionsMessage = {
    /** sidepanel → content script: please make sure captions are on */
    Enable: 'enableGoogleMeetingCaptions',
    /** content script → sidepanel: captions state changed (by anyone: user, shortcut or us) */
    TurnedOn: 'captionsTurnedOn',
    TurnedOff: 'captionsTurnedOff',
} as const;

/** Result of an enable request, also used as the `reason` in the message response. */
export const EnableResult = {
    AlreadyOn: 'already_on',
    Enabled: 'enabled',
    /** Controls were found and state was readable, but captions did not turn on. */
    Failed: 'failed',
    /** No captions control / unreadable state (lobby, unsupported UI): we did nothing. */
    Unavailable: 'unavailable',
} as const;
export type EnableResult = (typeof EnableResult)[keyof typeof EnableResult];

/**
 * Material Symbols ligature names Meet renders inside `<i>` icons.
 * Unlike aria-labels they are not localised, and unlike `jsname` they are not obfuscated.
 */
export const CaptionIcon = {
    /** classic UI toggle / panel row when captions are OFF */
    Off: 'closed_caption_off',
    /** classic UI toggle when captions are ON */
    On: 'closed_caption',
    /** dialog UI toolbar button that opens the "Captions and translation" panel */
    DialogToolbar: 'translate_cc',
} as const;

/** The Meet keyboard shortcut that toggles captions ("c or shift + c"). */
export const CAPTIONS_SHORTCUT = { key: 'c', code: 'KeyC', keyCode: 67 } as const;

export const CaptionsTiming = {
    POLL_INTERVAL_MS: 100,
    /**
     * Wait for the state to flip after dispatching the shortcut / clicking. Observed right after
     * joining: Meet reflects the toggle either within ~1s or only after 8–10s (captions startup),
     * and further toggles during that startup are ignored. Being impatient and toggling again
     * only risks switching captions back off, so we wait long before trying the next method.
     */
    SHORTCUT_WAIT_MS: 15_000,
    /** wait for the "Captions and translation" panel to render after opening it */
    PANEL_WAIT_MS: 10_000,
    /** same wait, after a click */
    STATE_WAIT_MS: 15_000,
    /** liveness check of the observed button (a cheap `isConnected` read) */
    HEARTBEAT_MS: 2000,
    /** back-off while the control is not in the DOM yet (e.g. lobby) */
    RESCAN_MIN_MS: 500,
    RESCAN_MAX_MS: 2000,
    /** pause between entering the meeting and auto-enabling captions */
    ENTRY_DELAY_MS: 1000,
} as const;
