/**
 * Version utilities for the application
 * 
 * Note: Update APP_VERSION when releasing new versions
 * This should match the version in package.json
 */

// Current application version - update this when releasing
const APP_VERSION = '1.4.2';

/**
 * Get application version
 * @returns {string} Application version
 */
export const getAppVersion = (): string => {
  // Try to get version from Chrome extension manifest if available
  try {
    if (typeof chrome !== 'undefined' && chrome.runtime?.getManifest) {
      const manifest = chrome.runtime.getManifest();
      if (manifest.version) {
        return manifest.version;
      }
    }
  } catch (error) {
    console.log(error)
    // Silently fall back to hardcoded version
  }

  return APP_VERSION;
};

/**
 * Get formatted version string
 * @returns {string} Formatted version string like "Version 1.4.2"
 */
export const getFormattedVersion = (): string => {
  return `Version ${getAppVersion()}`;
};

/**
 * Get semantic version string
 * @returns {string} Semantic version string like "v1.4.2"
 */
export const getSemanticVersion = (): string => {
  return `v${getAppVersion()}`;
};

/**
 * Get detailed version string
 * @returns {string} Detailed version string like "App Version 1.4.2"
 */
export const getDetailedVersion = (): string => {
  return `App Version ${getAppVersion()}`;
};

/**
 * Check if running in Chrome extension context
 * @returns {boolean} True if running as Chrome extension
 */
export const isExtensionContext = (): boolean => {
  return typeof chrome !== 'undefined' && chrome.runtime?.getManifest !== undefined;
}; 