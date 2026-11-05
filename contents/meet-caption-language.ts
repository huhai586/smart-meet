/**
 * meet-caption-language — Content Script
 *
 * Tells the background translation center which caption language Meet is set to, so that in auto
 * mode translations use it as their source language instead of guessing. Reports only changes,
 * including to null when the setting disappears (captions turned off, or left the meeting).
 */
import type { PlasmoCSConfig } from "~node_modules/plasmo";
import { isGoogleMeeting } from '~utils/google-meet-captions-dom';
import { readMeetCaptionLanguage } from '~utils/meet-caption-language';
import { TranslationCenterAction, type MeetLanguageMessage } from '~utils/translation-center';

/** The setting changes rarely; a few seconds of delay costs nothing. */
const POLL_INTERVAL_MS = 3000;

if (isGoogleMeeting()) {
    let reported: string | null = null;
    setInterval(() => {
        const language = readMeetCaptionLanguage();
        if (language === reported) return;
        reported = language;
        const message: MeetLanguageMessage = { action: TranslationCenterAction.MEET_LANGUAGE, language };
        chrome.runtime.sendMessage(message).catch(() => {
            // The extension was reloaded; this page's script is orphaned until Meet is reloaded.
        });
    }, POLL_INTERVAL_MS);
}

export const config: PlasmoCSConfig = {
    matches: ['https://meet.google.com/*'],
};
