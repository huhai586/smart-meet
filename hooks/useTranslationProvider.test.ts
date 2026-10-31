import { beforeEach, describe, expect, it, vi } from 'vitest';

const localSupported = vi.hoisted(() => ({ value: true }));
vi.mock('~/utils/translators/local-translator', () => ({
  isLocalTranslatorSupported: () => localSupported.value,
}));

const storeProvider = (provider?: string) => {
  const sync: Record<string, unknown> = provider
    ? { appConfig: { _schemaVersion: 1, translationProvider: { value: provider, updatedAt: 1 } } }
    : {};
  vi.stubGlobal('chrome', {
    storage: {
      sync: {
        get: (keys: string[], callback: (result: Record<string, unknown>) => void) =>
          callback(Object.fromEntries(keys.filter((key) => key in sync).map((key) => [key, sync[key]]))),
        set: (_values: unknown, callback?: () => void) => callback?.(),
      },
      local: { get: (_keys: string[], callback: (result: object) => void) => callback({}), set: vi.fn() },
      onChanged: { addListener: vi.fn(), removeListener: vi.fn() },
    },
  });
};

// appConfig caches the stored config per module instance, so each case loads a fresh one.
const currentProvider = async (stored?: string) => {
  vi.resetModules();
  storeProvider(stored);
  const { getCurrentTranslationProvider } = await import('./useTranslationProvider');
  return getCurrentTranslationProvider();
};

beforeEach(() => {
  localSupported.value = true;
});

describe('getCurrentTranslationProvider', () => {
  it('defaults to local AI translation when the user never chose a provider', async () => {
    expect(await currentProvider()).toBe('local');
  });

  it('keeps an explicit choice, whatever it is', async () => {
    expect(await currentProvider('deepl')).toBe('deepl');
    expect(await currentProvider('microsoft')).toBe('microsoft');
  });

  it('falls back to Microsoft where Chrome has no built-in Translator', async () => {
    localSupported.value = false;
    expect(await currentProvider()).toBe('microsoft');
  });
});
