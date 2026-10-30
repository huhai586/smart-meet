/**
 * Google Meet page helpers.
 *
 * Detecting and controlling captions lives in utils/captions-control, which does not depend on
 * localised button labels.
 */

/** Returns true when the current page is a Google Meet meeting page. */
export function isGoogleMeeting(): boolean {
    return window.location.hostname === 'meet.google.com';
}
