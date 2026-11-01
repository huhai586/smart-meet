/** Hash routes of the options page (options.html#<route>). The route is also the id of the page. */
export const OptionsRoute = {
  GENERAL: 'general',
  INTERFACE: 'interface',
  AI_TRANSLATION: 'ai-translation',
  TRANSLATION: 'translation',
  OTHER: 'other',
  VOCABULARY: 'vocabulary',
  HISTORY: 'history',
  DATA_TRANSFER: 'import-export',
  CLOUD_SYNC: 'cloud-sync',
  CALENDAR: 'calendar',
  WELCOME: 'welcome',
  DEVELOPER: 'developer',
} as const;

export type OptionsRoute = (typeof OptionsRoute)[keyof typeof OptionsRoute];

const OPTIONS_PAGE = 'options.html';

export const optionsUrl = (route: string): string => `${chrome.runtime.getURL(OPTIONS_PAGE)}#${route}`;

/**
 * Opens the options page at a route. An options tab that is already open is brought to the front and moved
 * to the route (the page follows the hash), so clicking around does not pile up copies of it.
 */
export const openOptions = async (route: string = OptionsRoute.GENERAL): Promise<void> => {
  const [existing] = await chrome.tabs.query({ url: `${chrome.runtime.getURL(OPTIONS_PAGE)}*` });
  if (existing?.id === undefined) {
    await chrome.tabs.create({ url: optionsUrl(route) });
    return;
  }
  await chrome.tabs.update(existing.id, { url: optionsUrl(route), active: true });
  await chrome.windows.update(existing.windowId, { focused: true });
};
