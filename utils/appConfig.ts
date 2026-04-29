/**
 * Central application configuration store.
 *
 * All user-facing settings live in ONE chrome.storage.sync key: "appConfig".
 * Each field is wrapped as { value, updatedAt } so that on multi-device sync
 * we can do a field-level merge: the device with the higher updatedAt wins.
 *
 * API surface:
 *   getConfigValue(key)          – read one field's value
 *   setConfigValue(key, value)   – write one field (read → merge → write)
 *   onConfigChanged(listener)    – subscribe to remote sync changes
 *   migrateToAppConfig()         – one-time migration from old flat keys
 */

import type { Language } from './languages';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CustomPrompt {
  id: string;
  title: string;
  content: string;
}

export interface SidepanelVisibility {
  captions: boolean;
  summary: boolean;
  translation: boolean;
  longman: boolean;
}

export interface CaptionButtonsVisibility {
  translate: boolean;
  polish: boolean;
  analysis: boolean;
}

export interface DeepLConfig {
  auth_key: string;
}

export interface LocalTranslatorConfig {
  sourceLanguage: string;
}

export interface AIServiceConfig {
  apiKey: string;
  modelName: string;
  aiName: string;
  baseUrl?: string;
}

export interface AIsConfig {
  active: string;
  data: AIServiceConfig[];
}

/** Wraps every stored value with a write timestamp for conflict resolution. */
type Field<T> = { value: T; updatedAt: number };

/** Full shape of the unified config object. */
export interface AppConfigData {
  _schemaVersion: number;

  // Translation
  autoTranslateEnabled:     Field<boolean>;
  translationProvider:      Field<string>;
  translationLanguage:      Field<string>;
  translationFrequency:     Field<number>;
  deeplConfig:              Field<DeepLConfig>;
  localTranslatorConfig:    Field<LocalTranslatorConfig>;

  // UI Language
  uiLanguage:               Field<string>;

  // AI services
  AIs:                      Field<AIsConfig>;

  // Sidepanel
  sidepanelVisibility:      Field<SidepanelVisibility>;
  captionButtonsVisibility: Field<CaptionButtonsVisibility>;
  captionFontSizeOffset:    Field<number>;
  summaryFontSizeOffset:    Field<number>;

  // Meeting overlay
  captionToggleEnabled:     Field<boolean>;
  stickerEnabled:           Field<boolean>;
  isExtensionDisabled:      Field<boolean>;

  // Words & highlights
  specificHighlightWords:      Field<string[]>;
  highlightWordsByDescriptions: Field<string[]>;
  domain:                      Field<string>;
  translatedWords:             Field<string[]>;
  longmanStarred:              Field<string[]>;

  // Custom prompts
  customPrompts: Field<CustomPrompt[]>;

  // Cloud sync
  autoSyncOnStartup: Field<boolean>;
  autoSyncOnLeave:   Field<boolean>;
}

export type AppConfigKey = keyof Omit<AppConfigData, '_schemaVersion'>;

// Value type helper
export type ConfigValue<K extends AppConfigKey> =
  AppConfigData[K] extends Field<infer V> ? V : never;

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'appConfig';
const SCHEMA_VERSION = 1;
const MIGRATION_FLAG  = 'appConfigMigrationDone_v1';
const CLEANUP_FLAG    = 'appConfigCleanupDone_v3'; // v3: also purges modelCache from sync

/** Default values – used when a field doesn't exist yet. */
const DEFAULTS: Record<AppConfigKey, unknown> = {
  autoTranslateEnabled:        false,
  translationProvider:         'microsoft',
  translationLanguage:         'zh',
  translationFrequency:        2.5,
  deeplConfig:                 { auth_key: '' },
  localTranslatorConfig:       { sourceLanguage: 'en' },
  uiLanguage:                  'en',
  AIs:                         { active: '', data: [] },
  sidepanelVisibility:         { captions: true, summary: true, translation: true, longman: false },
  captionButtonsVisibility:    { translate: true, polish: true, analysis: true },
  captionFontSizeOffset:       0,
  summaryFontSizeOffset:       0,
  captionToggleEnabled:        false,
  stickerEnabled:              false,
  isExtensionDisabled:         false,
  specificHighlightWords:      [],
  highlightWordsByDescriptions: [],
  domain:                      '',
  translatedWords:             [],
  longmanStarred:              [],
  customPrompts:               [],
  autoSyncOnStartup:           false,
  autoSyncOnLeave:             true,
};

// ─── Core helpers ─────────────────────────────────────────────────────────────

function readRaw(): Promise<Partial<AppConfigData>> {
  return new Promise((resolve) => {
    chrome.storage.sync.get([STORAGE_KEY], (result) => {
      resolve((result[STORAGE_KEY] as Partial<AppConfigData>) ?? {});
    });
  });
}

function writeRaw(data: Partial<AppConfigData>): Promise<void> {
  return new Promise((resolve) => {
    chrome.storage.sync.set({ [STORAGE_KEY]: data }, () => {
      // Stamp a local-only sync timestamp so any page can show "last synced"
      chrome.storage.local.set({ lastSyncAt: Date.now() });
      resolve();
    });
  });
}

/**
 * Merge two (partial) configs field-by-field.
 * For each key, whichever entry has the higher `updatedAt` wins.
 */
export function mergeAppConfigs(
  base: Partial<AppConfigData>,
  incoming: Partial<AppConfigData>,
): Partial<AppConfigData> {
  const result: Partial<AppConfigData> = { ...base };

  for (const k of Object.keys(incoming) as Array<keyof AppConfigData>) {
    if (k === '_schemaVersion') continue;

    const incomingField = incoming[k] as Field<unknown> | undefined;
    const baseField = base[k] as Field<unknown> | undefined;

    if (!incomingField) continue;
    if (!baseField || incomingField.updatedAt >= baseField.updatedAt) {
      (result as Record<string, unknown>)[k] = incomingField;
    }
  }

  return result;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Read a single config field's value (unwrapped). */
export async function getConfigValue<K extends AppConfigKey>(
  key: K,
): Promise<ConfigValue<K>> {
  const config = await readRaw();
  const field = config[key] as Field<ConfigValue<K>> | undefined;
  return field !== undefined ? field.value : (DEFAULTS[key] as ConfigValue<K>);
}

/**
 * Write a single config field.
 * Performs a read → field-merge → write to avoid overwriting other fields
 * that may have been written by another device.
 */
export async function setConfigValue<K extends AppConfigKey>(
  key: K,
  value: ConfigValue<K>,
): Promise<void> {
  const current = await readRaw();
  const updated: Partial<AppConfigData> = {
    ...current,
    _schemaVersion: SCHEMA_VERSION,
    [key]: { value, updatedAt: Date.now() } as Field<ConfigValue<K>>,
  };
  await writeRaw(updated);
}

/**
 * Subscribe to remote config changes arriving via chrome.storage.onChanged.
 * The listener receives the field-merged result (only changed keys).
 * Returns an unsubscribe function.
 */
export function onConfigChanged(
  listener: (changes: Partial<AppConfigData>) => void,
): () => void {
  const handler = (
    changes: Record<string, chrome.storage.StorageChange>,
    areaName: string,
  ) => {
    if (areaName !== 'sync' || !changes[STORAGE_KEY]) return;

    const oldVal = (changes[STORAGE_KEY].oldValue ?? {}) as Partial<AppConfigData>;
    const newVal = (changes[STORAGE_KEY].newValue ?? {}) as Partial<AppConfigData>;

    // Merge: take the field-level winner between old and new
    const merged = mergeAppConfigs(oldVal, newVal);

    // Extract only the keys that actually changed
    const diff: Partial<AppConfigData> = {};
    for (const k of Object.keys(merged) as Array<keyof AppConfigData>) {
      if (k === '_schemaVersion') continue;
      const mergedField = merged[k] as Field<unknown> | undefined;
      const oldField = oldVal[k] as Field<unknown> | undefined;
      if (!oldField || mergedField?.updatedAt !== oldField.updatedAt) {
        (diff as Record<string, unknown>)[k] = mergedField;
      }
    }

    if (Object.keys(diff).length > 0) listener(diff);
  };

  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}

// ─── Migration ────────────────────────────────────────────────────────────────

/**
 * OLD individual sync keys that have been consolidated into appConfig.
 * Map: appConfig field name → old chrome.storage.sync key name.
 */
const OLD_SYNC_KEYS: Partial<Record<AppConfigKey, string>> = {
  autoTranslateEnabled:        'autoTranslateEnabled',
  translationProvider:         'translationProvider',
  translationLanguage:         'translationLanguage',
  translationFrequency:        'translationFrequency',
  deeplConfig:                 'deeplConfig',
  localTranslatorConfig:       'localTranslatorConfig',
  uiLanguage:                  'uiLanguage',
  AIs:                         'AIs',
  autoSyncOnStartup:           'autoSyncOnStartup',
  autoSyncOnLeave:             'autoSyncOnLeave',
};

/**
 * OLD individual local keys migrated to sync in the previous refactor.
 * Map: appConfig field name → old chrome.storage.local key name.
 */
const OLD_LOCAL_KEYS: Partial<Record<AppConfigKey, string>> = {
  customPrompts:               'customPrompts',
  specificHighlightWords:      'specificHighlightWords',
  highlightWordsByDescriptions: 'highlightWordsByDescriptions',
  domain:                      'domain',
  captionToggleEnabled:        'captionToggleEnabled',
  stickerEnabled:              'stickerEnabled',
  captionFontSizeOffset:       'captionFontSizeOffset',
  summaryFontSizeOffset:       'summaryFontSizeOffset',
  sidepanelVisibility:         'sidepanelVisibility',
  captionButtonsVisibility:    'captionButtonsVisibility',
  longmanStarred:              'longmanStarred',
  isExtensionDisabled:         'isExtensionDisabled',
  translatedWords:             'translatedWords',
};

/**
 * One-time migration: reads old individual keys (both sync and local),
 * merges them into the new unified appConfig structure, then marks as done.
 *
 * Rules:
 *  - appConfig field already has a value → skip (don't overwrite)
 *  - appConfig field is empty, old sync key exists → use sync value
 *  - appConfig field is empty, only old local key exists → use local value
 */
export async function migrateToAppConfig(): Promise<void> {
  // Check migration flag
  const flagResult = await new Promise<Record<string, unknown>>((resolve) =>
    chrome.storage.sync.get([MIGRATION_FLAG], resolve),
  );
  if (flagResult[MIGRATION_FLAG]) {
    // Migration already ran — still run cleanup in case it was skipped before
    await cleanupLegacyFlatKeys();
    return;
  }

  const currentConfig = await readRaw();
  const toWrite: Partial<AppConfigData> = {
    ...currentConfig,
    _schemaVersion: SCHEMA_VERSION,
  };

  // Read all old sync keys
  const oldSyncValues = await new Promise<Record<string, unknown>>((resolve) =>
    chrome.storage.sync.get(Object.values(OLD_SYNC_KEYS), resolve),
  );

  // Read all old local keys
  const oldLocalValues = await new Promise<Record<string, unknown>>((resolve) =>
    chrome.storage.local.get(Object.values(OLD_LOCAL_KEYS), resolve),
  );

  const now = Date.now();

  // Merge old sync keys
  for (const [configKey, oldKey] of Object.entries(OLD_SYNC_KEYS) as Array<[AppConfigKey, string]>) {
    const existing = toWrite[configKey] as Field<unknown> | undefined;
    if (existing !== undefined) continue; // already in appConfig, skip
    const oldValue = oldSyncValues[oldKey];
    if (oldValue !== undefined) {
      (toWrite as Record<string, unknown>)[configKey] = { value: oldValue, updatedAt: now };
    }
  }

  // Merge old local keys (lower priority than sync keys)
  for (const [configKey, oldKey] of Object.entries(OLD_LOCAL_KEYS) as Array<[AppConfigKey, string]>) {
    const existing = toWrite[configKey] as Field<unknown> | undefined;
    if (existing !== undefined) continue; // already set from sync or appConfig, skip
    const oldValue = oldLocalValues[oldKey];
    if (oldValue !== undefined) {
      (toWrite as Record<string, unknown>)[configKey] = { value: oldValue, updatedAt: now };
    }
  }

  await writeRaw(toWrite);

  // Mark migration as done
  await new Promise<void>((resolve) =>
    chrome.storage.sync.set({ [MIGRATION_FLAG]: true }, resolve),
  );

  // Remove the now-redundant flat keys
  await cleanupLegacyFlatKeys();

  console.log('[appConfig] Migration from old keys completed.');
}

/**
 * Complete list of every key that should NOT exist outside of appConfig.
 * Hardcoded rather than derived from the maps so future map changes don't
 * accidentally skip something.
 */
const ALL_LEGACY_SYNC_KEYS = [
  // original sync flat keys
  'autoTranslateEnabled',
  'translationProvider',
  'translationLanguage',
  'translationFrequency',
  'deeplConfig',
  'localTranslatorConfig',
  'uiLanguage',
  'AIs',
  'autoSyncOnStartup',
  'autoSyncOnLeave',
  // "local" keys that a prior migration copied into sync
  'customPrompts',
  'specificHighlightWords',
  'highlightWordsByDescriptions',
  'domain',
  'captionToggleEnabled',
  'stickerEnabled',
  'captionFontSizeOffset',
  'summaryFontSizeOffset',
  'sidepanelVisibility',
  'captionButtonsVisibility',
  'longmanStarred',
  'isExtensionDisabled',
  'translatedWords',
  // old migration flags that are no longer needed
  'localToSyncMigrationDone_v1',
  'appConfigMigrationDone_v1',
  'appConfigCleanupDone_v1',
  'appConfigCleanupDone_v2',
  // model cache was incorrectly stored in sync — now lives in local
  'modelCache',
] as const;

/**
 * Removes all legacy flat keys from chrome.storage.sync (and local).
 *
 * Pass `force = true` to run even if the cleanup flag is already set.
 * This is useful for manual recovery via the Developer Panel.
 */
export async function cleanupLegacyFlatKeys(force = false): Promise<void> {
  if (!force) {
    const flagResult = await new Promise<Record<string, unknown>>((resolve) =>
      chrome.storage.sync.get([CLEANUP_FLAG], resolve),
    );
    if (flagResult[CLEANUP_FLAG]) return;
  }

  const keysToRemove = [...ALL_LEGACY_SYNC_KEYS];

  await Promise.all([
    new Promise<void>((resolve) => chrome.storage.sync.remove(keysToRemove, resolve)),
    new Promise<void>((resolve) => chrome.storage.local.remove(keysToRemove, resolve)),
  ]);

  // Write the "done" flag separately so it survives
  await new Promise<void>((resolve) =>
    chrome.storage.sync.set({ [CLEANUP_FLAG]: true }, resolve),
  );

  console.log('[appConfig] Legacy flat keys removed from storage.');
}
