import { getCurrentUILanguage } from '../hooks/useUILanguage';
import { getTranslation } from './i18n';
import messageManager from './message-manager';

/** Options page route that holds the translation provider settings (and the model download). */
const TRANSLATION_SETTINGS_ROUTE = 'translation';

/** Chrome reports these while the on-device model for a language pair is not on the machine yet. */
const MODEL_MISSING_STATES = new Set(['downloadable', 'downloading']);

export const isLocalModelMissing = (availability: string): boolean => MODEL_MISSING_STATES.has(availability);

/** Thrown by local translation when the model is missing; `message` is the localized text shown to the user. */
export class LocalModelNotInstalledError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'LocalModelNotInstalledError';
  }
}

// Translation fires for every caption, so show the prompt once per page instead of once per attempt.
let prompted = false;

/**
 * Tells the user the model is missing, with a link to the settings page where it is downloaded.
 * Returns the localized message so the caller can throw it as the error.
 */
export const promptLocalModelDownload = async (): Promise<LocalModelNotInstalledError> => {
  const { code } = await getCurrentUILanguage();
  const message = getTranslation('local_model_missing_message', code);
  if (!prompted) {
    prompted = true;
    messageManager.warningWithAction(message, getTranslation('go_to_options', code), () => {
      chrome.runtime.sendMessage({ action: 'openOptionsPage', route: TRANSLATION_SETTINGS_ROUTE });
    });
  }
  return new LocalModelNotInstalledError(message);
};
