/** Hash routes of the options page (options.html#<route>) that other parts of the extension link to. */
export const OptionsRoute = {
  VOCABULARY: 'vocabulary',
  DATA_TRANSFER: 'import-export',
} as const;

export const optionsUrl = (route: string): string => `${chrome.runtime.getURL('options.html')}#${route}`;
