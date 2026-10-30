import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  cleanupLegacyFlatKeys,
  getConfigValue,
  mergeAppConfigs,
  migrateToAppConfig,
  onConfigChanged,
  setConfigValue,
} from './appConfig';

type StorageData = Record<string, unknown>;

function createChromeStorage() {
  const sync: StorageData = {};
  const local: StorageData = {};
  const changeListeners: Array<(changes: object, areaName: string) => void> = [];

  const createArea = (data: StorageData) => ({
    get: vi.fn((keys: string[], callback: (result: StorageData) => void) => {
      callback(Object.fromEntries(keys
        .filter((key) => key in data)
        .map((key) => [key, data[key]])));
    }),
    set: vi.fn((values: StorageData, callback?: () => void) => {
      Object.assign(data, values);
      callback?.();
    }),
    remove: vi.fn((keys: string[], callback?: () => void) => {
      keys.forEach((key) => delete data[key]);
      callback?.();
    }),
  });

  return {
    sync,
    local,
    chrome: {
      storage: {
        sync: createArea(sync),
        local: createArea(local),
        onChanged: {
          addListener: vi.fn((listener) => changeListeners.push(listener)),
          removeListener: vi.fn((listener) => {
            const index = changeListeners.indexOf(listener);
            if (index >= 0) changeListeners.splice(index, 1);
          }),
        },
      },
    },
    emitChange: (changes: object, areaName = 'sync') => {
      changeListeners.forEach((listener) => listener(changes, areaName));
    },
  };
}

let storage: ReturnType<typeof createChromeStorage>;

beforeEach(() => {
  storage = createChromeStorage();
  vi.stubGlobal('chrome', storage.chrome);
  vi.spyOn(Date, 'now').mockReturnValue(1_700_000_000_000);
});

describe('mergeAppConfigs', () => {
  it('keeps the newest value for each individual field', () => {
    const result = mergeAppConfigs(
      {
        translationLanguage: { value: 'zh', updatedAt: 10 },
        darkMode: { value: false, updatedAt: 30 },
      },
      {
        translationLanguage: { value: 'ja', updatedAt: 20 },
        darkMode: { value: true, updatedAt: 15 },
      },
    );

    expect(result).toMatchObject({
      translationLanguage: { value: 'ja', updatedAt: 20 },
      darkMode: { value: false, updatedAt: 30 },
    });
  });
});

describe('appConfig reads and writes', () => {
  it('returns defaults for settings that have not yet been saved', async () => {
    await expect(getConfigValue('translationLanguage')).resolves.toBe('zh');
    await expect(getConfigValue('darkMode')).resolves.toBe(false);
  });

  it('writes one timestamped field without removing existing fields', async () => {
    storage.sync.appConfig = {
      darkMode: { value: true, updatedAt: 10 },
    };

    await setConfigValue('translationLanguage', 'ja');

    expect(storage.sync.appConfig).toEqual({
      _schemaVersion: 1,
      darkMode: { value: true, updatedAt: 10 },
      translationLanguage: { value: 'ja', updatedAt: 1_700_000_000_000 },
    });
    expect(storage.local.lastSyncAt).toBe(1_700_000_000_000);
  });
});

describe('onConfigChanged', () => {
  it('emits only fields changed in the sync appConfig payload', () => {
    const listener = vi.fn();
    const unsubscribe = onConfigChanged(listener);

    storage.emitChange({
      appConfig: {
        oldValue: { translationLanguage: { value: 'zh', updatedAt: 1 } },
        newValue: {
          translationLanguage: { value: 'ja', updatedAt: 2 },
          darkMode: { value: true, updatedAt: 3 },
        },
      },
    });

    expect(listener).toHaveBeenCalledWith({
      translationLanguage: { value: 'ja', updatedAt: 2 },
      darkMode: { value: true, updatedAt: 3 },
    });

    unsubscribe();
    storage.emitChange({ appConfig: { oldValue: {}, newValue: {} } });
    expect(listener).toHaveBeenCalledTimes(1);
  });
});

describe('migrateToAppConfig', () => {
  it('migrates legacy sync and local settings, then removes flat keys', async () => {
    storage.sync.autoTranslateEnabled = true;
    storage.sync.uiLanguage = 'ja';
    storage.local.domain = 'engineering';

    await migrateToAppConfig();

    expect(storage.sync.appConfig).toMatchObject({
      _schemaVersion: 1,
      autoTranslateEnabled: { value: true, updatedAt: 1_700_000_000_000 },
      uiLanguage: { value: 'ja', updatedAt: 1_700_000_000_000 },
      domain: { value: 'engineering', updatedAt: 1_700_000_000_000 },
    });
    expect(storage.sync.autoTranslateEnabled).toBeUndefined();
    expect(storage.sync.uiLanguage).toBeUndefined();
    expect(storage.local.domain).toBeUndefined();
    expect(storage.sync.appConfigMigrationDone_v1).toBe(true);
    expect(storage.sync.appConfigCleanupDone_v3).toBe(true);
  });

  it('converts legacy AI service data and keeps the selected active provider', async () => {
    storage.sync.aiServices = {
      groq: { apiKey: 'key-1', modelName: 'llama-3.3-70b-versatile' },
      empty: { apiKey: '' },
    };
    storage.sync.activeAIService = 'groq';

    await migrateToAppConfig();

    expect(storage.sync.appConfig).toMatchObject({
      AIs: {
        value: {
          active: 'groq',
          data: [{ aiName: 'groq', apiKey: 'key-1', modelName: 'llama-3.3-70b-versatile' }],
        },
      },
    });
  });

  it('can force cleanup after the one-time cleanup flag has been set', async () => {
    storage.sync.appConfigCleanupDone_v3 = true;
    storage.sync.modelCache = { stale: true };
    storage.local.modelCache = { stale: true };

    await cleanupLegacyFlatKeys(true);

    expect(storage.sync.modelCache).toBeUndefined();
    expect(storage.local.modelCache).toBeUndefined();
  });
});
