import { getCurrentUILanguage } from '../hooks/useUILanguage';

const FEEDBACK_FORM_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSegAGph025Sv5L9v3s72_G_Ckxd0Bzi9Cuz2SZDt3s4O52FLg/viewform';
/** The form's "Diagnostics" field; the form shows it to the user, who can edit or delete it. */
const DIAGNOSTICS_ENTRY = 'entry.1962349541';

export const FeedbackSource = {
  OPTIONS: 'options',
  UNINSTALL: 'uninstall',
} as const;

export type FeedbackSource = (typeof FeedbackSource)[keyof typeof FeedbackSource];

interface FeedbackContext {
  version: string;
  browser: string;
  uiLanguage: string;
  source: FeedbackSource;
}

/** Version, browser and language only. Never anything from a meeting. */
export const formatDiagnostics = ({ version, browser, uiLanguage, source }: FeedbackContext): string =>
  `Smart Meet ${version} | Chrome ${browser} | UI ${uiLanguage} | via ${source}`;

export const buildFeedbackUrl = (context: FeedbackContext): string => {
  const url = new URL(FEEDBACK_FORM_URL);
  url.searchParams.set('usp', 'pp_url');
  url.searchParams.set(DIAGNOSTICS_ENTRY, formatDiagnostics(context));
  return url.toString();
};

/** The feedback form link for the current install. */
export const getFeedbackUrl = async (source: FeedbackSource): Promise<string> =>
  buildFeedbackUrl({
    version: chrome.runtime.getManifest().version,
    browser: navigator.userAgent.match(/Chrome\/([\d.]+)/)?.[1] ?? 'unknown',
    uiLanguage: (await getCurrentUILanguage()).code,
    source,
  });
